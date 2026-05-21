// app/api/admin/chat/conversations/route.ts
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth verification
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {data: adminProfile, error: profileError} = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({error: "Profile not found"}, {status: 403});
    }

    if (adminProfile?.role !== "admin") {
      console.error("Not admin:", adminProfile?.role);
      return NextResponse.json({error: "Forbidden - Admin access required"}, {status: 403});
    }

    console.log("Admin verified:", user.id);

    // Now use admin client for database operations (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Get query parameters
    const {searchParams} = new URL(req.url);
    const status = searchParams.get("status") ?? "active";

    console.log("Querying for status:", status);

    // Fetch all conversations (no RLS restrictions with admin client)
    const {data: conversations, error: conversationsError} = await adminSupabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", {ascending: false});

    if (conversationsError) {
      console.error("Conversations error:", conversationsError);
      throw conversationsError;
    }

    console.log("All conversations (no filter):", conversations?.length || 0);
    if (conversations && conversations.length > 0) {
      console.log("First conversation:", conversations[0]);
    }

    // Filter by status
    const filteredConversations = conversations?.filter((conv) => conv.status === status) || [];
    console.log(`Filtered by status "${status}":`, filteredConversations.length);

    if (!filteredConversations || filteredConversations.length === 0) {
      console.log("No conversations found with status:", status);
      return NextResponse.json({conversations: [], count: 0});
    }

    // Get user info from profiles table for each conversation
    const userIds = filteredConversations.map((conv) => conv.user_id);
    console.log("User IDs:", userIds);

    const {data: profiles, error: profilesError} = await adminSupabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    console.log("Found profiles:", profiles?.length || 0);

    // Create a map of user profiles
    const userMap = new Map();
    if (profiles) {
      profiles.forEach((profile) => {
        userMap.set(profile.id, profile);
      });
    }

    // Get last message and unread counts for each conversation
    const conversationsWithDetails = await Promise.all(
      filteredConversations.map(async (conv) => {
        console.log("Processing conversation:", conv.id);

        // Get last message
        const {data: lastMessage, error: lastMsgError} = await adminSupabase
          .from("chat_messages")
          .select("message, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", {ascending: false})
          .limit(1)
          .maybeSingle();

        if (lastMsgError) {
          console.error("Error fetching last message:", lastMsgError);
        }

        // Get unread count
        const {count: unreadCount, error: unreadError} = await adminSupabase
          .from("chat_messages")
          .select("*", {count: "exact", head: true})
          .eq("conversation_id", conv.id)
          .eq("sender_type", "user")
          .eq("is_read", false);

        if (unreadError) {
          console.error("Error fetching unread count:", unreadError);
        }

        // Get user profile from map or create placeholder
        const userProfile = userMap.get(conv.user_id);

        return {
          id: conv.id,
          user_id: conv.user_id,
          admin_id: conv.admin_id,
          status: conv.status,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          user: userProfile
            ? {
                id: userProfile.id,
                email: userProfile.email || `user-${conv.user_id.slice(0, 8)}@example.com`,
                full_name: userProfile.full_name || `Customer ${conv.user_id.slice(0, 8)}`,
                avatar_url: userProfile.avatar_url,
              }
            : {
                id: conv.user_id,
                email: `user-${conv.user_id.slice(0, 8)}@example.com`,
                full_name: `Customer ${conv.user_id.slice(0, 8)}`,
              },
          last_message: lastMessage?.message || null,
          last_message_time: lastMessage?.created_at || null,
          unread_count: unreadCount || 0,
        };
      }),
    );

    console.log("Returning conversations:", conversationsWithDetails.length);
    return NextResponse.json({conversations: conversationsWithDetails});
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json(
      {error: "Internal server error", details: err instanceof Error ? err.message : String(err)},
      {status: 500},
    );
  }
}
