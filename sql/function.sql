CREATE OR REPLACE FUNCTION process_transfer(
  p_from_account_id  UUID,
  p_to_account_id    UUID,
  p_amount           DECIMAL,
  p_initiated_by     UUID,
  p_type             transaction_type,
  p_description      TEXT DEFAULT NULL,
  p_fee              DECIMAL DEFAULT 0
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transaction_id UUID;
  v_from_balance   DECIMAL;
  v_to_balance     DECIMAL;
  v_fees_account   UUID;
BEGIN
  -- Lock both accounts to prevent race conditions
  v_from_balance := (SELECT balance FROM accounts WHERE id = p_from_account_id FOR UPDATE);
  v_to_balance   := (SELECT balance FROM accounts WHERE id = p_to_account_id   FOR UPDATE);

  -- Validate sufficient funds (including fee)
  IF v_from_balance < (p_amount + p_fee) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Get fees system account
  v_fees_account := (SELECT id FROM accounts WHERE account_type = 'system_fees' LIMIT 1);

  -- Create transaction record
  INSERT INTO transactions (initiated_by, from_account_id, to_account_id, amount, fee, type, status, description)
  VALUES (p_initiated_by, p_from_account_id, p_to_account_id, p_amount, p_fee, p_type, 'processing', p_description)
  RETURNING id INTO v_transaction_id;

  -- ── Double-entry: main transfer ──────────────────────────
  INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
  VALUES (v_transaction_id, p_from_account_id, 'debit',  p_amount, v_from_balance - p_amount - p_fee);

  INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
  VALUES (v_transaction_id, p_to_account_id,   'credit', p_amount, v_to_balance + p_amount);

  -- ── Double-entry: fee (if any) ───────────────────────────
  IF p_fee > 0 THEN
    INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
    VALUES (v_transaction_id, p_from_account_id, 'debit',  p_fee, v_from_balance - p_amount - p_fee);

    INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
    VALUES (v_transaction_id, v_fees_account, 'credit', p_fee, 0);
  END IF;

  -- ── Update account balances ───────────────────────────────
  UPDATE accounts SET balance = balance - p_amount - p_fee WHERE id = p_from_account_id;
  UPDATE accounts SET balance = balance + p_amount           WHERE id = p_to_account_id;
  UPDATE accounts SET balance = balance + p_fee              WHERE id = v_fees_account;

  -- ── Update ledgers ────────────────────────────────────────
  UPDATE ledgers SET balance = balance - p_amount - p_fee WHERE account_id = p_from_account_id;
  UPDATE ledgers SET balance = balance + p_amount           WHERE account_id = p_to_account_id;

  -- Mark complete
  UPDATE transactions SET status = 'completed' WHERE id = v_transaction_id;

  RETURN v_transaction_id;
END;
$$;