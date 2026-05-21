import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

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

    const body = await req.json();
    const {type} = body;

    // ── Profile update ───────────────────────────────────────
    if (type === "profile") {
      const {full_name, phone} = body;

      const {error} = await supabase
        .from("profiles")
        .update({full_name, phone, updated_at: new Date().toISOString()})
        .eq("id", user.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Profile Updated",
        body: "Your profile information has been updated successfully.",
        type: "success",
      });

      return NextResponse.json({success: true});
    }

    // ── Password update ──────────────────────────────────────
    if (type === "password") {
      const {current_password, new_password} = body;

      // Verify current password by re-signing in
      const {error: signInError} = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: current_password,
      });

      if (signInError) {
        return NextResponse.json({error: "Current password is incorrect"}, {status: 400});
      }

      const {error} = await supabase.auth.updateUser({password: new_password});
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Password Changed",
        body: "Your password has been changed successfully.",
        type: "warning",
      });

      return NextResponse.json({success: true});
    }

    // ── Avatar update ────────────────────────────────────────
    if (type === "avatar") {
      const {avatar_url} = body;

      const {error} = await supabase
        .from("profiles")
        .update({avatar_url, updated_at: new Date().toISOString()})
        .eq("id", user.id);

      if (error) throw error;
      return NextResponse.json({success: true});
    }

    return NextResponse.json({error: "Invalid update type"}, {status: 400});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
