-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE account_type     AS ENUM ('checking', 'savings', 'investment', 'system_reserve', 'system_fees');
CREATE TYPE account_status   AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE transaction_type AS ENUM ('internal_transfer', 'external_transfer', 'bill_payment', 'deposit', 'withdrawal', 'fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'reversed');
CREATE TYPE entry_type       AS ENUM ('debit', 'credit');
CREATE TYPE card_type        AS ENUM ('debit', 'credit');
CREATE TYPE card_status      AS ENUM ('active', 'frozen', 'cancelled');
CREATE TYPE user_role        AS ENUM ('user', 'admin');
CREATE TYPE kyc_status       AS ENUM ('pending', 'verified', 'rejected');

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          user_role DEFAULT 'user',
  kyc_status    kyc_status DEFAULT 'pending',
  is_suspended  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ACCOUNTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for system accounts
  account_number TEXT UNIQUE NOT NULL,
  account_type   account_type NOT NULL,
  currency       TEXT DEFAULT 'USD',
  balance        DECIMAL(15,2) DEFAULT 0 CHECK (balance >= 0),
  status         account_status DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SYSTEM ACCOUNTS (bank's own accounts)
-- ─────────────────────────────────────────
INSERT INTO accounts (account_number, account_type, currency, balance)
VALUES
  ('SYS-RESERVE-001', 'system_reserve', 'USD', 10000000),
  ('SYS-FEES-001',    'system_fees',    'USD', 0)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- LEDGERS  (one per account)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledgers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  balance    DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT UNIQUE NOT NULL DEFAULT 'TXN-' || upper(substring(gen_random_uuid()::text, 1, 12)),
  initiated_by     UUID REFERENCES profiles(id),
  from_account_id  UUID REFERENCES accounts(id),
  to_account_id    UUID REFERENCES accounts(id),
  amount           DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  fee              DECIMAL(15,2) DEFAULT 0,
  currency         TEXT DEFAULT 'USD',
  type             transaction_type NOT NULL,
  status           transaction_status DEFAULT 'pending',
  description      TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ENTRIES  (double-entry ledger lines)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id     UUID NOT NULL REFERENCES accounts(id),
  type           entry_type NOT NULL,
  amount         DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  balance_after  DECIMAL(15,2),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce: sum of debits == sum of credits per transaction
CREATE OR REPLACE FUNCTION check_entries_balanced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  debit_sum  DECIMAL := 0;
  credit_sum DECIMAL := 0;
BEGIN
  debit_sum := COALESCE((
    SELECT SUM(amount) FROM entries
    WHERE transaction_id = NEW.transaction_id AND type = 'debit'::entry_type
  ), 0);

  credit_sum := COALESCE((
    SELECT SUM(amount) FROM entries
    WHERE transaction_id = NEW.transaction_id AND type = 'credit'::entry_type
  ), 0);

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────
-- BENEFICIARIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname       TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name      TEXT,
  full_name      TEXT NOT NULL,
  is_internal    BOOLEAN DEFAULT FALSE, -- true = another user in this app
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CARDS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number     TEXT UNIQUE NOT NULL,
  card_type       card_type DEFAULT 'debit',
  status          card_status DEFAULT 'active',
  expiry_month    INT NOT NULL,
  expiry_year     INT NOT NULL,
  cvv             TEXT NOT NULL, -- hashed in production
  daily_limit     DECIMAL(15,2) DEFAULT 5000,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- BILL PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  biller_name    TEXT NOT NULL,
  biller_type    TEXT NOT NULL, -- electricity, internet, etc.
  account_ref    TEXT NOT NULL, -- customer's account with biller
  amount         DECIMAL(15,2) NOT NULL,
  scheduled_at   TIMESTAMPTZ,
  is_recurring   BOOLEAN DEFAULT FALSE,
  status         transaction_status DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  type       TEXT DEFAULT 'info', -- info | warning | success | error
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_accounts_updated_at    BEFORE UPDATE ON accounts    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ledgers_updated_at     BEFORE UPDATE ON ledgers     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREATE LEDGER when account is created
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_ledger_for_account()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO ledgers (account_id, balance) VALUES (NEW.id, NEW.balance);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_ledger
AFTER INSERT ON accounts
FOR EACH ROW EXECUTE FUNCTION create_ledger_for_account();

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users: own profile"       ON profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "admins: all profiles"     ON profiles      FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Accounts
CREATE POLICY "users: own accounts"      ON accounts      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins: all accounts"     ON accounts      FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ledgers
CREATE POLICY "users: own ledgers"       ON ledgers       FOR SELECT USING (EXISTS (SELECT 1 FROM accounts WHERE accounts.id = ledgers.account_id AND accounts.user_id = auth.uid()));
CREATE POLICY "admins: all ledgers"      ON ledgers       FOR ALL    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Transactions
CREATE POLICY "users: own transactions"  ON transactions  FOR ALL USING (auth.uid() = initiated_by);
CREATE POLICY "admins: all transactions" ON transactions  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Entries
CREATE POLICY "users: own entries"       ON entries       FOR SELECT USING (EXISTS (SELECT 1 FROM accounts WHERE accounts.id = entries.account_id AND accounts.user_id = auth.uid()));
CREATE POLICY "admins: all entries"      ON entries       FOR ALL    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Beneficiaries
CREATE POLICY "users: own beneficiaries" ON beneficiaries FOR ALL USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "users: own cards"         ON cards         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins: all cards"        ON cards         FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Bill payments
CREATE POLICY "users: own bills"         ON bill_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins: all bills"        ON bill_payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications
CREATE POLICY "users: own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);





-- Chat conversations table
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, admin_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = admin_id);

CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND (chat_conversations.user_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND (chat_conversations.user_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  );

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;



-- ─── Reports ────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference       TEXT NOT NULL UNIQUE DEFAULT 'RPT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  category        TEXT NOT NULL CHECK (category IN (
                    'fraud','unauthorized_transaction','suspicious_activity',
                    'account_takeover','phishing','dispute',
                    'lost_stolen_card','identity_theft','other'
                  )),
  description     TEXT NOT NULL,
  amount          NUMERIC(12,2),
  transaction_id  TEXT,
  date_occurred   DATE NOT NULL,
  urgent_contact  BOOLEAN DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN (
                    'investigating','under_review','resolved'
                  )),
  admin_notes     TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Support Tickets ────────────────────────────────────────────────────────
CREATE TABLE support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference   TEXT NOT NULL UNIQUE DEFAULT 'TKT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  subject     TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN (
                'transaction','account','card','security','other'
              )),
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
                'low','medium','high','urgent'
              )),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                'open','in_progress','resolved','closed'
              )),
  message     TEXT NOT NULL,
  admin_reply TEXT,
  replied_at  TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_reports_user_id       ON reports(user_id);
CREATE INDEX idx_reports_status        ON reports(status);
CREATE INDEX idx_tickets_user_id       ON support_tickets(user_id);
CREATE INDEX idx_tickets_status        ON support_tickets(status);
CREATE INDEX idx_tickets_priority      ON support_tickets(priority);

-- ─── Auto-update updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can only see/insert their own rows
CREATE POLICY "reports: user select"  ON reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports: user insert"  ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tickets: user select"  ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets: user insert"  ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (uses your existing role column on profiles)
CREATE POLICY "reports: admin all"  ON reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "tickets: admin all"  ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );