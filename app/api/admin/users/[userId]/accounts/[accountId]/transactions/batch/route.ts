// app/api/admin/users/[userId]/accounts/[accountId]/transactions/batch/route.ts
import {metadata} from "@/app/layout";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{userId: string; accountId: string}>},
) {
  try {
    const supabase = await createClient();
    const {userId, accountId} = await params;
    const body = await req.json();
    const {numberOfTransactions, minAmount, maxAmount, type, descriptionPrefix} = body;

    if (numberOfTransactions < 1 || numberOfTransactions > 100) {
      return NextResponse.json(
        {error: "Number of transactions must be between 1 and 100"},
        {status: 400},
      );
    }

    if (minAmount <= 0 || maxAmount <= 0 || minAmount > maxAmount) {
      return NextResponse.json({error: "Invalid amount range"}, {status: 400});
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

    // Get system reserve account
    const {data: systemAccount, error: systemError} = await supabase
      .from("accounts")
      .select("*")
      .eq("account_type", "system_reserve")
      .single();

    if (systemError || !systemAccount) {
      return NextResponse.json({error: "System account not found"}, {status: 500});
    }

    const admin = (await supabase.auth.getUser()).data.user;
    const transactions = [];

    // Generate random transactions
    for (let i = 0; i < numberOfTransactions; i++) {
      const amount = Math.random() * (maxAmount - minAmount) + minAmount;
      const roundedAmount = Math.round(amount * 100) / 100;
      const description = `${descriptionPrefix || "Batch transaction"} ${i + 1}`;

      let result;
      if (type === "deposit" || type === "admin_funding") {
        result = await supabase.rpc("process_transfer", {
          p_from_account_id: systemAccount.id,
          p_to_account_id: userAccount.id,
          p_amount: roundedAmount,
          p_initiated_by: admin?.id,
          p_type: type,
          p_description: description,
          p_fee: 0,
          p_metadata: {
            batchIndex: i + 1,
            totalBatch: numberOfTransactions,
            generatedAt: new Date().toISOString(),
          },
        });
      } else if (type === "withdrawal") {
        result = await supabase.rpc("process_transfer", {
          p_from_account_id: userAccount.id,
          p_to_account_id: systemAccount.id,
          p_amount: roundedAmount,
          p_initiated_by: admin?.id,
          p_type: type,
          p_description: description,
          p_fee: 0,
          p_metadata: {
            batchIndex: i + 1,
            totalBatch: numberOfTransactions,
            generatedAt: new Date().toISOString(),
          },
        });
      }

      if (result?.error) {
        console.error(`Failed to create transaction ${i + 1}:`, result.error);
      } else {
        transactions.push(result?.data);
      }
    }

    return NextResponse.json({
      success: true,
      count: transactions.length,
      totalRequested: numberOfTransactions,
      transactions,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
