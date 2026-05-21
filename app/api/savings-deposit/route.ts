import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";
import {notify} from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  const {from_account_id, goal_id, goal_name, current_goal_amount, amount, description} =
    await req.json();

  // 1. Insert transaction
  const {error: txError} = await supabase.from("transactions").insert({
    initiated_by: user.id,
    from_account_id,
    to_account_id: from_account_id,
    type: "savings_deposit",
    amount,
    status: "completed",
    description: description || `Savings: ${goal_name}`,
    metadata: {savings_goal_id: goal_id},
  });

  if (txError) {
    return NextResponse.json({error: txError.message}, {status: 500});
  }

  // 2. Decrement balance
  const {error: balanceError} = await supabase.rpc("decrement_balance", {
    p_account_id: from_account_id,
    p_amount: amount,
  });

  if (balanceError) {
    await notify.depositFailed(user.id, amount, balanceError.message);
    return NextResponse.json({error: balanceError.message}, {status: 500});
  }

  // 3. Update goal current_amount
  const {error: goalError} = await supabase
    .from("savings_goals")
    .update({
      current_amount: current_goal_amount + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goal_id);

  if (goalError) {
    await notify.depositFailed(user.id, amount, goalError.message);
    return NextResponse.json({error: goalError.message}, {status: 500});
  }

  // 4. Notify success
  await notify.depositSuccess(user.id, amount);

  return NextResponse.json({ok: true});
}
