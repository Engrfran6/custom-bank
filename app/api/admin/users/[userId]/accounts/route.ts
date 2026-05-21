// app/api/admin/users/[userId]/accounts/route.ts
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

export async function GET(req: NextRequest, {params}: {params: Promise<{userId: string}>}) {
  const {userId} = await params;

  console.log("Fetching accounts for user:", userId);

  try {
    const supabase = await createClient();
    if (!(await verifyAdmin(supabase))) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    // Get all accounts for the user
    const {data: accounts, error} = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {ascending: true});

    if (error) throw error;

    return NextResponse.json({accounts});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(req: NextRequest, {params}: {params: Promise<{userId: string}>}) {
  const {userId} = await params;

  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const body = await req.json();
    const {account_type, currency = "USD"} = body;

    // Generate unique account number
    const account_number = `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const {data: account, error} = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        account_number,
        account_type,
        currency,
        balance: "0.00",
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: admin.id,
      action: "create_account",
      target_user_id: userId,
      details: {account_id: account.id, account_type},
    });

    return NextResponse.json({account});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
