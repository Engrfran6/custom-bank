// app/api/admin/users/[id]/route.ts
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

export async function GET(_req: NextRequest, {params}: {params: Promise<{userId: string}>}) {
  try {
    const {userId} = await params;
    const supabase = await createClient();
    if (!(await verifyAdmin(supabase))) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const {data: profile, error} = await supabase
      .from("profiles")
      .select(
        `*, accounts(*), transactions:transactions!initiated_by(id, reference, type, status, amount, created_at)`,
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return NextResponse.json({profile});
  } catch (err) {
    console.error("[GET /api/admin/users/:id]", err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function PATCH(req: NextRequest, {params}: {params: Promise<{userId: string}>}) {
  try {
    const {userId} = await params;
    const supabase = await createClient();

    const adminUser = await verifyAdmin(supabase);
    if (!adminUser) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const body = await req.json();

    const PROFILE_FIELDS = [
      "full_name",
      "phone",
      "role",
      "kyc_status",
      "address",
      "city",
      "state",
      "country",
      "postal_code",
      "date_of_birth",
      "ssn",
      "is_us_citizen",
      "id_type",
      "id_number",
      "id_document_url",
      "next_of_kin_name",
      "next_of_kin_relationship",
      "next_of_kin_phone",
      "next_of_kin_email",
      "next_of_kin_address",
      "employment_status",
      "employer_name",
      "annual_income",
      "source_of_funds",
      "pep_status",
      "tax_residence_country",
      "tin",
      "is_suspended",
      "fraud_flagged",
      "fraud_reason",
      "fraud_details",
      "fraud_flagged_at",
      "fraud_flagged_by",
      "suspension_reason",
      "suspension_details",
      "suspended_at",
      "suspended_by",
      "reactivated_at",
      "reactivated_by",
      "reactivation_reason",
    ];

    // const profileUpdates: Record<string, unknown> = {};
    // for (const field of PROFILE_FIELDS) {
    //   if (body[field] !== undefined) profileUpdates[field] = body[field];
    // }

    const ENUM_FIELDS = ["kyc_status", "employment_status", "id_type", "role"];

    const profileUpdates: Record<string, unknown> = {};
    for (const field of PROFILE_FIELDS) {
      if (body[field] === undefined) continue;
      // Skip empty strings for enum fields — they'd fail DB validation
      if (ENUM_FIELDS.includes(field) && body[field] === "") continue;
      profileUpdates[field] = body[field];
    }

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.profile_updated_at = new Date().toISOString();
      profileUpdates.profile_updated_by = adminUser.id;

      const {error} = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)
        .select();

      if (error) {
        console.error("[PATCH] profile update error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
      }
    }

    if (body.account_status !== undefined) {
      const {error} = await supabase
        .from("accounts")
        .update({status: body.account_status})
        .eq("user_id", userId);

      if (error) {
        console.error("[PATCH] account status error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
      }
    }

    return NextResponse.json({success: true});
  } catch (err) {
    console.error("[PATCH /api/admin/users/:userId] unhandled:", err);
    return NextResponse.json(
      {error: err instanceof Error ? err.message : "Internal server error"},
      {status: 500},
    );
  }
}
