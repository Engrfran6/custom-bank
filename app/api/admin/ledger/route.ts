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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await verifyAdmin(supabase))) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {searchParams} = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 25);
    const accountId = searchParams.get("account_id") ?? "";
    const type = searchParams.get("type") ?? "all";
    const dateFrom = searchParams.get("date_from") ?? "";
    const dateTo = searchParams.get("date_to") ?? "";
    const search = searchParams.get("search") ?? "";

    // ── Entries query ────────────────────────────────────────
    let query = supabase
      .from("entries")
      .select(
        `
        *,
        account:accounts(
          account_number,
          account_type,
          user_id,
          profiles:profiles(full_name, email)
        ),
        transaction:transactions(
          reference,
          type,
          status,
          description,
          initiated_by,
          amount,
          fee,
          created_at,
          initiator:profiles!initiated_by(full_name, email)
        )
      `,
        {count: "exact"},
      )
      .order("created_at", {ascending: false})
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (accountId) query = query.eq("account_id", accountId);
    if (type !== "all") query = query.eq("type", type);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

    const {data: entries, count, error} = await query;
    if (error) throw error;

    // ── Accounts list for filter dropdown ────────────────────
    const {data: accounts} = await supabase
      .from("accounts")
      .select(
        `
        id,
        account_number,
        account_type,
        balance,
        user_id,
        profiles:profiles(full_name, email)
      `,
      )
      .order("account_type", {ascending: true});

    // ── Summary totals ────────────────────────────────────────
    const {data: summary} = await supabase.from("entries").select("type, amount");

    const totalDebits = (summary ?? [])
      .filter((e) => e.type === "debit")
      .reduce((s, e) => s + Number(e.amount), 0);
    const totalCredits = (summary ?? [])
      .filter((e) => e.type === "credit")
      .reduce((s, e) => s + Number(e.amount), 0);

    return NextResponse.json({
      entries: entries ?? [],
      total: count ?? 0,
      page,
      pageSize,
      accounts: accounts ?? [],
      summary: {
        totalDebits,
        totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
