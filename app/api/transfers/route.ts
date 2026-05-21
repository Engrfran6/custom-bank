import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";
import {notify} from "@/lib/notifications";

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let transferAmount: number | undefined;

  try {
    const supabase = await createClient();

    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    userId = user.id;

    const body = await req.json();
    const {from_account_id, to_account_number, amount, description, type} = body;

    // ── Validate input ───────────────────────────────────────
    if (!from_account_id || !to_account_number || !amount) {
      return NextResponse.json({error: "Missing required fields"}, {status: 400});
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({error: "Invalid amount"}, {status: 400});
    }

    transferAmount = Number(amount);

    // ── Verify sender owns the from_account ──────────────────
    const {data: fromAccount, error: fromError} = await supabase
      .from("accounts")
      .select(`id, balance, status, user_id, account_number, profiles!user_id(full_name)`)
      .eq("id", from_account_id)
      .eq("user_id", user.id)
      .single();

    if (fromError || !fromAccount) {
      return NextResponse.json({error: "Source account not found"}, {status: 404});
    }

    if (fromAccount.status !== "active") {
      return NextResponse.json({error: "Source account is not active"}, {status: 400});
    }

    // ── Look up destination account by account number ────────
    const {data: toAccounts, error: toError} = await supabase.rpc("lookup_account_by_number", {
      p_account_number: to_account_number,
    });

    const toAccount = toAccounts?.[0] ?? null;

    if (toError || !toAccount) {
      return NextResponse.json({error: "Destination account not found"}, {status: 404});
    }

    if (toAccount.status !== "active") {
      return NextResponse.json({error: "Destination account is not active"}, {status: 400});
    }

    if (toAccount.id === from_account_id) {
      return NextResponse.json({error: "Cannot transfer to the same account"}, {status: 400});
    }

    // ── Determine transfer type & fee ────────────────────────
    const isInternal = toAccount.user_id === user.id;
    const transferType = type ?? (isInternal ? "internal_transfer" : "external_transfer");
    const fee = isInternal ? 0 : calculateFee(transferAmount);

    // ── Simulate processing delay (remove in production) ─────
    await new Promise((r) => setTimeout(r, 1500));

    // ── Call the atomic Postgres function ────────────────────
    const {data, error: txError} = await supabase.rpc("process_transfer", {
      p_from_account_id: fromAccount.id,
      p_to_account_id: toAccount.id,
      p_amount: transferAmount,
      p_initiated_by: user.id,
      p_type: transferType,
      p_description: description ?? null,
      p_fee: fee,
      p_metadata: {
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get("user-agent"),
        ipAddress:
          req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
      },
    });

    if (txError) {
      const message = txError.message.includes("Insufficient funds")
        ? "Insufficient funds"
        : "Transfer failed. Please try again.";
      return NextResponse.json({error: message}, {status: 400});
    }

    // ── Create notification for recipient ────────────────────
    const sendersName =
      fromAccount.profiles[0]?.full_name || `Account ${fromAccount.account_number}`;

    await notify.depositSuccess(toAccount.user_id, transferAmount, sendersName);

    return NextResponse.json({transaction_id: data}, {status: 200});
  } catch (err) {
    console.error("Unexpected error:", err);

    // Attempt to send error notification if we have user info
    if (userId && transferAmount !== undefined) {
      try {
        await notify.transferFailed(userId, transferAmount, err as string | Error);
      } catch (notifyError) {
        console.error("Failed to send error notification:", notifyError);
      }
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

function calculateFee(amount: number): number {
  // 0.5% fee for external transfers, min $0.50, max $25
  const fee = amount * 0.005;
  return Math.min(Math.max(fee, 0.5), 25);
}
