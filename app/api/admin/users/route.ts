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

    const {data: self} = await supabase.from("profiles").select("role").eq("id", user.id).single();

    if (self?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {searchParams} = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";
    const kyc = searchParams.get("kyc") ?? "all";
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = 20;

    let query = supabase
      .from("profiles")
      .select(
        `
        *,
        accounts(id, account_type, balance, status)
      `,
        {count: "exact"},
      )
      .neq("role", "admin")
      .order("created_at", {ascending: false})
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (status === "suspended") query = query.eq("is_suspended", true);
    if (status === "active") query = query.eq("is_suspended", false);
    if (kyc !== "all") query = query.eq("kyc_status", kyc);

    const {data: users, count, error} = await query;
    if (error) throw error;

    return NextResponse.json({
      users: users ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
