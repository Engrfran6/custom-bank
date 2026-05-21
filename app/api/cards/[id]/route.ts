import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function PATCH(req: NextRequest, {params}: {params: {id: string}}) {
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
    const {status, daily_limit} = body;

    // Verify card ownership
    const {data: existing, error: findErr} = await supabase
      .from("cards")
      .select("id, status")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({error: "Card not found"}, {status: 404});
    }

    if (existing.status === "cancelled") {
      return NextResponse.json({error: "Cannot modify a cancelled card"}, {status: 400});
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (daily_limit !== undefined) updates.daily_limit = daily_limit;

    const {data: card, error: updateErr} = await supabase
      .from("cards")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Notification for freeze/unfreeze
    if (status === "frozen") {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Card Frozen",
        body: "Your card has been frozen. No transactions will be allowed.",
        type: "warning",
      });
    } else if (status === "active") {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Card Unfrozen",
        body: "Your card has been unfrozen and is ready to use.",
        type: "success",
      });
    }

    return NextResponse.json({card});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function DELETE(_req: NextRequest, {params}: {params: {id: string}}) {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {error} = await supabase
      .from("cards")
      .update({status: "cancelled"})
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
