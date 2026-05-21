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

    const {searchParams} = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all";
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = 20;

    let query = supabase
      .from("notifications")
      .select("*", {count: "exact"})
      .eq("user_id", user.id)
      .order("created_at", {ascending: false})
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filter === "unread") query = query.eq("is_read", false);
    if (filter !== "all" && filter !== "unread") {
      query = query.eq("type", filter);
    }

    const {data, count, error} = await query;
    if (error) throw error;

    // Unread count (always full, not filtered)
    const {count: unreadCount} = await supabase
      .from("notifications")
      .select("*", {count: "exact", head: true})
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: data ?? [],
      total: count ?? 0,
      unreadCount: unreadCount ?? 0,
      page,
      pageSize,
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

    const {ids, mark_all} = await req.json();

    if (mark_all) {
      await supabase
        .from("notifications")
        .update({is_read: true})
        .eq("user_id", user.id)
        .eq("is_read", false);
    } else if (ids?.length) {
      await supabase
        .from("notifications")
        .update({is_read: true})
        .in("id", ids)
        .eq("user_id", user.id);
    }

    return NextResponse.json({success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {ids, delete_all} = await req.json();

    if (delete_all) {
      await supabase.from("notifications").delete().eq("user_id", user.id);
    } else if (ids?.length) {
      await supabase.from("notifications").delete().in("id", ids).eq("user_id", user.id);
    }

    return NextResponse.json({success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
