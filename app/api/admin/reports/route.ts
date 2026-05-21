import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";
import {notify} from "@/lib/notifications";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) return null;
  const {data: profile} = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? supabase : null;
}

export async function GET(req: NextRequest) {
  const supabase = await assertAdmin();

  if (!supabase) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  const {searchParams} = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("reports")
    .select("*, profiles(full_name, email)")
    .order("created_at", {ascending: false});

  if (status && status !== "all") query = query.eq("status", status);

  const {data, error} = await query;
  console.log("checking report data=============>", data);
  console.log("checking report error=============>", error);

  if (error) return NextResponse.json({error: error.message}, {status: 500});
  return NextResponse.json({reports: data});
}

export async function PATCH(req: NextRequest) {
  const supabase = await assertAdmin();
  if (!supabase) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  const {id, status, admin_notes} = await req.json();
  if (!id) return NextResponse.json({error: "Missing report id"}, {status: 400});

  const {data: report} = await supabase
    .from("reports")
    .select("user_id, reference, status")
    .eq("id", id)
    .single();

  const {error} = await supabase
    .from("reports")
    .update({
      status,
      admin_notes,
      ...(status === "resolved" ? {resolved_at: new Date().toISOString()} : {}),
    })
    .eq("id", id);

  if (error) return NextResponse.json({error: error.message}, {status: 500});

  // Notify user on status change
  if (report && status !== report.status) {
    await notify.reportStatusChanged(report.user_id, report.reference, status);
  }

  return NextResponse.json({ok: true});
}
