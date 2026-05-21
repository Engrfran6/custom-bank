import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

const BILLERS = [
  {id: "elec-001", name: "PowerGrid Electric", type: "electricity", logo: "⚡"},
  {id: "water-001", name: "CityWater Supply", type: "water", logo: "💧"},
  {id: "internet-001", name: "FiberNet ISP", type: "internet", logo: "🌐"},
  {id: "gas-001", name: "NatGas Co.", type: "gas", logo: "🔥"},
  {id: "tv-001", name: "StreamCable TV", type: "cable", logo: "📺"},
  {id: "phone-001", name: "TeleCom Mobile", type: "phone", logo: "📱"},
  {id: "insurance-001", name: "SafeGuard Ins.", type: "insurance", logo: "🛡️"},
  {id: "rent-001", name: "RentPay Portal", type: "rent", logo: "🏠"},
];

export async function GET() {
  return NextResponse.json({billers: BILLERS});
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const body = await req.json();
    const {from_account_id, biller_id, account_ref, amount, scheduled_at, is_recurring} = body;

    if (!from_account_id || !biller_id || !account_ref || !amount) {
      return NextResponse.json({error: "Missing required fields"}, {status: 400});
    }

    const biller = BILLERS.find((b) => b.id === biller_id);
    if (!biller) {
      return NextResponse.json({error: "Invalid biller"}, {status: 400});
    }

    // ── Verify account ownership ─────────────────────────────
    const {data: fromAccount, error: accErr} = await supabase
      .from("accounts")
      .select("id, balance, status, user_id")
      .eq("id", from_account_id)
      .eq("user_id", user.id)
      .single();

    if (accErr || !fromAccount) {
      return NextResponse.json({error: "Account not found"}, {status: 404});
    }

    if (fromAccount.status !== "active") {
      return NextResponse.json({error: "Account is not active"}, {status: 400});
    }

    if (Number(fromAccount.balance) < Number(amount)) {
      return NextResponse.json({error: "Insufficient funds"}, {status: 400});
    }

    // ── If scheduled, save without processing now ────────────
    if (scheduled_at && new Date(scheduled_at) > new Date()) {
      const {data: bill, error: billErr} = await supabase
        .from("bill_payments")
        .insert({
          user_id: user.id,
          biller_name: biller.name,
          biller_type: biller.type,
          account_ref,
          amount: Number(amount),
          scheduled_at,
          is_recurring: is_recurring ?? false,
          status: "pending",
        })
        .select()
        .single();

      if (billErr) throw billErr;
      return NextResponse.json({bill_id: bill.id, scheduled: true}, {status: 200});
    }

    // ── Get system fees account ──────────────────────────────
    const {data: feesAccount} = await supabase
      .from("accounts")
      .select("id")
      .eq("account_type", "system_fees")
      .single();

    // ── Process immediately via Postgres function ────────────
    await new Promise((r) => setTimeout(r, 1200));

    const {data: txId, error: txErr} = await supabase.rpc("process_transfer", {
      p_from_account_id: fromAccount.id,
      p_to_account_id: feesAccount!.id,
      p_amount: Number(amount),
      p_initiated_by: user.id,
      p_type: "bill_payment",
      p_description: `${biller.name} — Ref: ${account_ref}`,
      p_fee: 0,
      p_metadata: {
        biller_id,
        biller_name: biller.name,
        biller_type: biller.type,
        account_ref,
        is_recurring,
      },
    });

    if (txErr) {
      const msg = txErr.message.includes("Insufficient funds")
        ? "Insufficient funds"
        : "Payment failed. Please try again.";
      return NextResponse.json({error: msg}, {status: 400});
    }

    // ── Save bill payment record ─────────────────────────────
    const {data: bill} = await supabase
      .from("bill_payments")
      .insert({
        user_id: user.id,
        transaction_id: txId,
        biller_name: biller.name,
        biller_type: biller.type,
        account_ref,
        amount: Number(amount),
        is_recurring: is_recurring ?? false,
        status: "completed",
      })
      .select()
      .single();

    // ── Notification ─────────────────────────────────────────
    const fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Bill Payment Successful",
      body: `${biller.name} payment of ${fmt} was successful.`,
      type: "success",
    });

    return NextResponse.json({bill_id: bill?.id, transaction_id: txId}, {status: 200});
  } catch (err) {
    console.error("Bill payment error:", err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
