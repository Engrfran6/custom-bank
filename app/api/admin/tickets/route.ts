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
  const priority = searchParams.get("priority");

  let query = supabase
    .from("support_tickets")
    .select("*, profiles(full_name, email)")
    .order("created_at", {ascending: false});

  if (status && status !== "all") query = query.eq("status", status);
  if (priority && priority !== "all") query = query.eq("priority", priority);

  const {data, error} = await query;
  if (error) return NextResponse.json({error: error.message}, {status: 500});
  return NextResponse.json({tickets: data});
}

export async function PATCH(req: NextRequest) {
  const supabase = await assertAdmin();
  if (!supabase) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  const {id, status, admin_reply} = await req.json();
  if (!id) return NextResponse.json({error: "Missing ticket id"}, {status: 400});

  // Fetch ticket first so we can notify the user
  const {data: ticket} = await supabase
    .from("support_tickets")
    .select("user_id, reference")
    .eq("id", id)
    .single();

  const {error} = await supabase
    .from("support_tickets")
    .update({
      ...(status ? {status} : {}),
      ...(admin_reply ? {admin_reply, replied_at: new Date().toISOString()} : {}),
      ...(status === "resolved" || status === "closed"
        ? {resolved_at: new Date().toISOString()}
        : {}),
    })
    .eq("id", id);

  if (error) return NextResponse.json({error: error.message}, {status: 500});

  // Notify user if a reply was sent
  if (ticket && admin_reply) {
    await notify.ticketReplied(ticket.user_id, ticket.reference);
  }

  return NextResponse.json({ok: true});
}
