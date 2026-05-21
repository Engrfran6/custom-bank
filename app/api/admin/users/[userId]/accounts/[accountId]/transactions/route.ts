// app/api/admin/users/[userId]/accounts/[accountId]/transactions/route.ts
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

export async function GET(req: NextRequest, {params}: {params: Promise<{accountId: string}>}) {
  try {
    const {accountId} = await params;

    const supabase = await createClient();
    if (!(await verifyAdmin(supabase))) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get transactions where account is either source or destination
    const {
      data: transactions,
      count,
      error,
    } = await supabase
      .from("transactions")
      .select("*", {count: "exact"})
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order("created_at", {ascending: false})
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get related account info for each transaction
    const accountIds = new Set<string>();
    transactions?.forEach((tx) => {
      if (tx.from_account_id) accountIds.add(tx.from_account_id);
      if (tx.to_account_id) accountIds.add(tx.to_account_id);
    });

    const {data: accounts} = await supabase
      .from("accounts")
      .select("id, account_number, account_type, user_id")
      .in("id", Array.from(accountIds));

    const accountMap = new Map(accounts?.map((a) => [a.id, a]));

    const enrichedTransactions = transactions?.map((tx) => ({
      ...tx,
      from_account: accountMap.get(tx.from_account_id),
      to_account: accountMap.get(tx.to_account_id),
    }));

    return NextResponse.json({
      transactions: enrichedTransactions,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function DELETE(req: NextRequest, {params}: {params: Promise<{accountId: string}>}) {
  try {
    const {accountId} = await params;
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    // Check if account has zero balance before deletion
    const {data: account, error: fetchError} = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", accountId)
      .single();

    if (fetchError) throw fetchError;

    if (parseFloat(account.balance) > 0) {
      return NextResponse.json(
        {error: "Cannot delete account with positive balance"},
        {status: 400},
      );
    }

    const {error} = await supabase.from("accounts").update({status: "closed"}).eq("id", accountId);

    if (error) throw error;

    return NextResponse.json({success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{userId: string; accountId: string}>},
) {
  try {
    const supabase = await createClient();
    const {userId, accountId} = await params;
    const body = await req.json();
    const {amount, type, description} = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({error: "Invalid amount"}, {status: 400});
    }

    // Get the user's account
    const {data: userAccount, error: accountError} = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    if (accountError || !userAccount) {
      return NextResponse.json({error: "Account not found"}, {status: 404});
    }

    // For deposits, get system reserve account
    const {data: systemAccount, error: systemError} = await supabase
      .from("accounts")
      .select("*")
      .eq("account_type", "system_reserve")
      .single();

    if (systemError || !systemAccount) {
      return NextResponse.json({error: "System account not found"}, {status: 500});
    }

    // Process based on transaction type
    let result;
    if (type === "deposit" || type === "admin_funding") {
      // Transfer from system to user account
      result = await supabase.rpc("process_transfer", {
        p_from_account_id: systemAccount.id,
        p_to_account_id: userAccount.id,
        p_amount: amount,
        p_initiated_by: (await supabase.auth.getUser()).data.user?.id,
        p_type: type,
        p_description: description || `${type} transaction`,
        p_fee: 0,
        p_metadata: {
          funding_type: type,
          source_account_type: systemAccount.account_type,
          timestamp: new Date().toISOString(),
          user_id: systemAccount.id,
          account_id: systemAccount.id,
        },
      });
    } else if (type === "withdrawal") {
      // Transfer from user to system account
      result = await supabase.rpc("process_transfer", {
        p_from_account_id: userAccount.id,
        p_to_account_id: systemAccount.id,
        p_amount: amount,
        p_initiated_by: (await supabase.auth.getUser()).data.user?.id,
        p_type: type,
        p_description: description || `${type} transaction`,
        p_fee: 0,
        p_metadata: {
          funding_type: type,
          source_account_type: userAccount.account_type,
          timestamp: new Date().toISOString(),
          user_id: userId,
          account_id: accountId,
        },
      });
    } else {
      return NextResponse.json({error: "Unsupported transaction type"}, {status: 400});
    }

    if (result.error) throw result.error;

    return NextResponse.json({success: true, transactionId: result.data});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
