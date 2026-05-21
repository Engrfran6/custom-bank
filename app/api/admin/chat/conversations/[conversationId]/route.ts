// app/api/admin/chat/conversations/[conversationId]/route.ts
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function PATCH(
  req: NextRequest,
  {params}: {params: Promise<{conversationId: string}>},
) {
  try {
    // Unwrap params
    const {conversationId} = await params;

    // Use regular client for auth verification
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {data: adminProfile} = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {status} = await req.json();

    if (!status || !["resolved", "archived"].includes(status)) {
      return NextResponse.json({error: "Invalid status"}, {status: 400});
    }

    // Use admin client for data operations
    const adminSupabase = createAdminClient();

    const {error: updateError} = await adminSupabase
      .from("chat_conversations")
      .update({status, updated_at: new Date().toISOString()})
      .eq("id", conversationId);

    if (updateError) throw updateError;

    return NextResponse.json({success: true});
  } catch (err) {
    console.error("Error updating conversation:", err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
