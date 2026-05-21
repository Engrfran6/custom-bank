// app/api/admin/chat/conversations/[conversationId]/messages/route.ts
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function GET(req: NextRequest, {params}: {params: Promise<{conversationId: string}>}) {
  try {
    // Unwrap params - this is the key fix!
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

    // Use admin client for data operations
    const adminSupabase = createAdminClient();

    // Fetch messages
    const {data: messages, error: messagesError} = await adminSupabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", {ascending: true});

    if (messagesError) throw messagesError;

    // Mark unread user messages as read
    const unreadMessages = messages?.filter((m) => !m.is_read && m.sender_type === "user") || [];

    if (unreadMessages.length > 0) {
      await adminSupabase
        .from("chat_messages")
        .update({is_read: true})
        .in(
          "id",
          unreadMessages.map((m) => m.id),
        );
    }

    return NextResponse.json({messages: messages || []});
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(
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
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {message} = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({error: "Message is required"}, {status: 400});
    }

    // Use admin client for data operations
    const adminSupabase = createAdminClient();

    // Ensure admin_id is set on conversation
    await adminSupabase
      .from("chat_conversations")
      .update({admin_id: adminProfile.id, updated_at: new Date().toISOString()})
      .eq("id", conversationId);

    // Insert message
    const {data: newMessage, error: insertError} = await adminSupabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: adminProfile.id,
        sender_type: "admin",
        message: message.trim(),
        is_read: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update conversation updated_at
    await adminSupabase
      .from("chat_conversations")
      .update({updated_at: new Date().toISOString()})
      .eq("id", conversationId);

    return NextResponse.json({message: newMessage});
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
