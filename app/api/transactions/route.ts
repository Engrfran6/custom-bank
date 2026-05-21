import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {data: profile} = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {searchParams} = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);
    const status = searchParams.get("status") ?? "all";
    const type = searchParams.get("type") ?? "all";
    const search = searchParams.get("search") ?? "";
    const dateFrom = searchParams.get("date_from") ?? "";
    const dateTo = searchParams.get("date_to") ?? "";
    const flagged = searchParams.get("flagged") ?? "false";

    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        initiator:profiles!initiated_by(
          full_name,
          email
        ),
        from_account:accounts!from_account_id(
          account_number,
          account_type
        ),
        to_account:accounts!to_account_id(
          account_number,
          account_type
        )
      `,
        {count: "exact"},
      )
      .order("created_at", {ascending: false})
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status !== "all") query = query.eq("status", status);
    if (type !== "all") query = query.eq("type", type);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

    // Flag suspicious: large amounts > $5000
    if (flagged === "true") query = query.gt("amount", 5000);

    if (search) {
      query = query.or(`reference.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const {data: transactions, count, error} = await query;

    if (error) throw error;

    // ── Volume stats for the filtered set ────────────────────
    const {data: allForStats} = await supabase.from("transactions").select("amount, status, type");

    const completed = (allForStats ?? []).filter((t) => t.status === "completed");
    const pending = (allForStats ?? []).filter((t) => t.status === "pending");
    const failed = (allForStats ?? []).filter((t) => t.status === "failed");
    const suspicious = (allForStats ?? []).filter((t) => Number(t.amount) > 5000);

    return NextResponse.json({
      transactions: transactions ?? [],
      total: count ?? 0,
      page,
      pageSize,
      summary: {
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
        suspicious: suspicious.length,
        volume: completed.reduce((s, t) => s + Number(t.amount), 0),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {data: profile} = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {id, status} = await req.json();
    if (!id || !status) {
      return NextResponse.json({error: "Missing fields"}, {status: 400});
    }

    const {error} = await supabase
      .from("transactions")
      .update({status, updated_at: new Date().toISOString()})
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
