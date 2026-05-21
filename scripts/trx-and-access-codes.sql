-- ─── TRANSACTION CODES ───────────────────────────────────────────────────────
CREATE TABLE transaction_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(20) NOT NULL UNIQUE,          -- short, clean field name
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       DECIMAL(12,2) NOT NULL,               -- required for transfers
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used_at      TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- no updated_at — codes are immutable after creation except status
);

-- ─── ACCESS CODES ────────────────────────────────────────────────────────────
CREATE TABLE access_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(20) NOT NULL UNIQUE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used_at      TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- no amount — access codes are for login, not transactions
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_transaction_codes_code       ON transaction_codes(code);
CREATE INDEX idx_transaction_codes_user_id    ON transaction_codes(user_id);
CREATE INDEX idx_transaction_codes_status     ON transaction_codes(status);
CREATE INDEX idx_transaction_codes_expires_at ON transaction_codes(expires_at);

CREATE INDEX idx_access_codes_code       ON access_codes(code);
CREATE INDEX idx_access_codes_user_id    ON access_codes(user_id);
CREATE INDEX idx_access_codes_status     ON access_codes(status);
CREATE INDEX idx_access_codes_expires_at ON access_codes(expires_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE transaction_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes      ENABLE ROW LEVEL SECURITY;

-- Users can manage their own codes
CREATE POLICY "Users can view own transaction codes"
  ON transaction_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transaction codes"
  ON transaction_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transaction codes"
  ON transaction_codes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own access codes"
  ON access_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own access codes"
  ON access_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own access codes"
  ON access_codes FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all transaction codes"
  ON transaction_codes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "Admins can view all access codes"
  ON access_codes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

--   -- ─── Admin-only SELECT ───────────────────────────────────────────────────────
-- CREATE POLICY "Admins can view all transaction codes"
--   ON transaction_codes FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- CREATE POLICY "Admins can view all access codes"
--   ON access_codes FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
--     )
--   );


-- ─── Drop existing user SELECT policies ──────────────────────────────────────
  -- ✅ Users can read back their own codes (needed for insert().select() to work)
CREATE POLICY "Users can view own access codes"
  ON access_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction codes"
  ON transaction_codes FOR SELECT
  USING (auth.uid() = user_id);


-- ─── DB FUNCTION: verify + consume a code atomically ─────────────────────────
-- Returns a status message the UI can use directly
CREATE OR REPLACE FUNCTION verify_transaction_code(
  p_code   TEXT,
  p_amount DECIMAL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row transaction_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM transaction_codes
  WHERE code = p_code
  FOR UPDATE SKIP LOCKED;  -- prevents race conditions

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid transaction code');
  END IF;

  IF v_row.status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code has already been used');
  END IF;

  IF v_row.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code has been cancelled');
  END IF;

  IF v_row.expires_at < NOW() OR v_row.status = 'expired' THEN
    UPDATE transaction_codes SET status = 'expired' WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', false, 'message', 'Code has expired');
  END IF;

  IF v_row.amount != p_amount THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code amount does not match transfer amount');
  END IF;

  IF v_row.user_id != auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code does not belong to this account');
  END IF;

  -- ✅ All checks passed — mark as used
  UPDATE transaction_codes
  SET status = 'used', used_at = NOW()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('ok', true, 'message', 'Code verified successfully');
END;
$$;

CREATE OR REPLACE FUNCTION verify_access_code(
  p_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row access_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM access_codes
  WHERE code = p_code
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid access code');
  END IF;

  IF v_row.status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code has already been used');
  END IF;

  IF v_row.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code has been cancelled');
  END IF;

  IF v_row.expires_at < NOW() OR v_row.status = 'expired' THEN
    UPDATE access_codes SET status = 'expired' WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', false, 'message', 'Code has expired');
  END IF;

  IF v_row.user_id != auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Code does not belong to this account');
  END IF;

  UPDATE access_codes
  SET status = 'used', used_at = NOW()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('ok', true, 'message', 'Access granted');
END;
$$;

-- ─── AUTO-EXPIRE: pg_cron job (runs every minute) ────────────────────────────
-- Requires pg_cron extension enabled in Supabase dashboard
SELECT cron.schedule(
  'expire-codes',
  '* * * * *',   -- every minute
  $$
    UPDATE transaction_codes
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();

    UPDATE access_codes
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();

    -- Delete expired/used codes older than 24h to keep tables clean
    DELETE FROM transaction_codes
    WHERE status IN ('expired', 'used', 'cancelled')
    AND created_at < NOW() - INTERVAL '24 hours';

    DELETE FROM access_codes
    WHERE status IN ('expired', 'used', 'cancelled')
    AND created_at < NOW() - INTERVAL '24 hours';
  $$
);