// app/api/admin/users/[userId]/accounts/[accountId]/fund/route.ts
import {notify} from "@/lib/notifications";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: {user},
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const {data: profile} = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return profile?.role === "admin" ? user : null;
}

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{userId: string; accountId: string}>},
) {
  try {
    const {userId, accountId} = await params;
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const body = await req.json();
    const {amount, description} = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({error: "Invalid amount"}, {status: 400});
    }

    // Get system reserve account
    const {data: systemAccount, error: systemError} = await supabase
      .from("accounts")
      .select("*")
      .eq("account_type", "system_reserve")
      .single();

    if (systemError || !systemAccount) {
      return NextResponse.json({error: "System reserve account not found"}, {status: 500});
    }

    // Check if system has sufficient balance
    if (parseFloat(systemAccount.balance) < amount) {
      return NextResponse.json({error: "Insufficient system balance"}, {status: 400});
    }

    // Get user account
    const {data: userAccount, error: userError} = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    if (userError || !userAccount) {
      return NextResponse.json({error: "User account not found"}, {status: 404});
    }

    // Start transaction
    // ── Call the atomic Postgres function ────────────────────
    const {data: transaction, error: txError} = await supabase.rpc("process_transfer", {
      p_from_account_id: systemAccount.id,
      p_to_account_id: userAccount.id,
      p_amount: amount,
      p_initiated_by: admin.id,
      p_type: "admin_funding",
      p_description: description || "Admin funding",
      p_fee: 0,
      p_metadata: {
        admin_id: admin.id,
        admin_email: admin.email,
        funding_type: "admin_funding",
      },
    });

    console.log("process transfer error========>", txError);

    if (txError) {
      const message = txError.message.includes("Insufficient funds")
        ? "Insufficient funds"
        : "Transfer failed. Please try again.";
      return NextResponse.json({error: message}, {status: 400});
    }

    // Log admin action
    // await supabase.from("admin_logs").insert({
    //   admin_id: admin.id,
    //   action: "fund_account",
    //   target_user_id: userId,
    //   details: {
    //     account_id: accountId,
    //     amount,
    //     transaction_id: transaction,
    //     description,
    //   },
    // });

    // ── Create notification for recipient ────────────────────
    const recipientName = userAccount.account_name || `Account ${userAccount.account_number}`;
    await notify.transferSuccess(userId, amount, recipientName);

    return NextResponse.json({
      success: true,
      transaction: transaction,
      message: `Successfully funded ${amount} ${userAccount.currency}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

// DECLARE
//   v_transaction_id UUID;
//   v_from_balance   DECIMAL;
//   v_to_balance     DECIMAL;
//   v_fees_account   UUID;
// BEGIN
//   -- Lock both accounts to prevent race conditions
//   v_from_balance := (SELECT balance FROM accounts WHERE id = p_from_account_id FOR UPDATE);
//   v_to_balance   := (SELECT balance FROM accounts WHERE id = p_to_account_id   FOR UPDATE);

//   -- Validate sufficient funds (including fee)
//   IF v_from_balance < (p_amount + p_fee) THEN
//     RAISE EXCEPTION 'Insufficient funds';
//   END IF;

//   -- Get fees system account
//   v_fees_account := (SELECT id FROM accounts WHERE account_type = 'system_fees' LIMIT 1);

//   -- Create transaction record
//   INSERT INTO transactions (initiated_by, from_account_id, to_account_id, amount, fee, type, status, description)
//   VALUES (p_initiated_by, p_from_account_id, p_to_account_id, p_amount, p_fee, p_type, 'processing', p_description)
//   RETURNING id INTO v_transaction_id;

//   -- ── Double-entry: main transfer ──────────────────────────
//   INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
//   VALUES (v_transaction_id, p_from_account_id, 'debit',  p_amount, v_from_balance - p_amount - p_fee);

//   INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
//   VALUES (v_transaction_id, p_to_account_id,   'credit', p_amount, v_to_balance + p_amount);

//   -- ── Double-entry: fee (if any) ───────────────────────────
//   IF p_fee > 0 THEN
//     INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
//     VALUES (v_transaction_id, p_from_account_id, 'debit',  p_fee, v_from_balance - p_amount - p_fee);

//     INSERT INTO entries (transaction_id, account_id, type, amount, balance_after)
//     VALUES (v_transaction_id, v_fees_account, 'credit', p_fee, 0);
//   END IF;

//   -- ── Update account balances ───────────────────────────────
//   UPDATE accounts SET balance = balance - p_amount - p_fee WHERE id = p_from_account_id;
//   UPDATE accounts SET balance = balance + p_amount           WHERE id = p_to_account_id;
//   UPDATE accounts SET balance = balance + p_fee              WHERE id = v_fees_account;

//   -- ── Update ledgers ────────────────────────────────────────
//   UPDATE ledgers SET balance = balance - p_amount - p_fee WHERE account_id = p_from_account_id;
//   UPDATE ledgers SET balance = balance + p_amount           WHERE account_id = p_to_account_id;

//   -- Mark complete
//   UPDATE transactions SET status = 'completed' WHERE id = v_transaction_id;
