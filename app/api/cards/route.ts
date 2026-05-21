import {notify} from "@/lib/notifications";
import {createClient} from "@/lib/supabase/server";
import {NextRequest, NextResponse} from "next/server";

function generateCardNumber(): string {
  // Visa-style: starts with 4, 16 digits total
  const groups = [
    "4" + Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join(""),
    Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join(""),
    Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join(""),
    Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join(""),
  ];
  return groups.join(" ");
}

function generateCVV(): string {
  return Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join("");
}

function generateExpiry(): {month: number; year: number} {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear() + 4;
  return {month, year};
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {data: cards, error} = await supabase
      .from("cards")
      .select(
        `
        *,
        account:accounts(account_number, account_type, balance)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", {ascending: false});

    if (error) throw error;
    return NextResponse.json({cards: cards ?? []});
  } catch (err) {
    console.error(err);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {account_id, card_type} = await req.json();
    if (!account_id || !card_type) {
      return NextResponse.json({error: "Missing required fields"}, {status: 400});
    }

    // Verify account ownership
    const {data: account, error: accErr} = await supabase
      .from("accounts")
      .select("id, status")
      .eq("id", account_id)
      .eq("user_id", user.id)
      .single();

    if (accErr || !account) {
      return NextResponse.json({error: "Account not found"}, {status: 404});
    }

    if (account.status !== "active") {
      return NextResponse.json({error: "Account is not active"}, {status: 400});
    }

    // Check max 2 cards per account
    const {count} = await supabase
      .from("cards")
      .select("*", {count: "exact", head: true})
      .eq("account_id", account_id)
      .neq("status", "cancelled");

    if ((count ?? 0) >= 3) {
      return NextResponse.json({error: "Maximum 3 cards allowed per account"}, {status: 400});
    }

    const expiry = generateExpiry();

    const {data: card, error: cardErr} = await supabase
      .from("cards")
      .insert({
        user_id: user.id,
        account_id,
        card_number: generateCardNumber(),
        // card_holder_name: user.user_metadata.full_name || "Cardholder",
        card_type,
        status: "active",
        expiry_month: expiry.month,
        expiry_year: expiry.year,
        cvv: generateCVV(),
        daily_limit: 5000,
      })
      .select()
      .single();

    if (cardErr) {
      notify.cardCreationFailed(user.id, card_type);
      throw cardErr;
    }

    notify.cardCreated(user.id, card_type);

    return NextResponse.json({card}, {status: 201});
  } catch (err) {
    return NextResponse.json({error: `Internal server error: ${err}`}, {status: 500});
  }
}
