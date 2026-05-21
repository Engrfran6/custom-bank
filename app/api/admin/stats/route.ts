import {createClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Verify admin
    const {data: profile} = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    // ── Run all stat queries in parallel ────────────────────
    const [
      {count: totalUsers},
      {count: activeUsers},
      {count: totalTransactions},
      {data: volumeData},
      {data: depositData},
      {data: feeData},
      {data: dailyTxData},
      {data: recentTx},
    ] = await Promise.all([
      supabase.from("profiles").select("*", {count: "exact", head: true}),

      supabase.from("profiles").select("*", {count: "exact", head: true}).eq("is_suspended", false),

      supabase
        .from("transactions")
        .select("*", {count: "exact", head: true})
        .eq("status", "completed"),

      // Total transaction volume
      supabase.from("transactions").select("amount").eq("status", "completed"),

      // Total deposits
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "deposit")
        .eq("status", "completed"),

      // Total fees collected
      supabase.from("transactions").select("fee").eq("status", "completed"),

      // Daily transaction counts (last 14 days)
      supabase
        .from("transactions")
        .select("created_at, amount, status")
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
        .order("created_at", {ascending: true}),

      // Recent transactions with profiles
      supabase
        .from("transactions")
        .select(
          `
          *,
          initiator:profiles!initiated_by(full_name, email),
          from_account:accounts!from_account_id(account_number, account_type),
          to_account:accounts!to_account_id(account_number, account_type)
        `,
        )
        .order("created_at", {ascending: false})
        .limit(10),
    ]);

    const totalVolume = (volumeData ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const totalDeposit = (depositData ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const totalFees = (feeData ?? []).reduce((s, t) => s + Number(t.fee), 0);

    // Build daily chart data
    const dayMap: Record<string, {date: string; volume: number; count: number}> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
      dayMap[key] = {date: key, volume: 0, count: 0};
    }
    (dailyTxData ?? []).forEach((t) => {
      const key = new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (dayMap[key]) {
        dayMap[key].volume += Number(t.amount);
        dayMap[key].count += 1;
      }
    });

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        totalTransactions: totalTransactions ?? 0,
        totalVolume,
        totalDeposit,
        totalFees,
      },
      dailyChart: Object.values(dayMap),
      recentTx: recentTx ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
