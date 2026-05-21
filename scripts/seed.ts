import {config} from "dotenv";
config({path: ".env.local"});

import {createClient} from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// CLIENT  (service role — bypasses RLS)
// ─────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {auth: {autoRefreshToken: false, persistSession: false}},
);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rndAmount(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function rndDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - rnd(0, daysAgo));
  d.setHours(rnd(0, 23), rnd(0, 59), rnd(0, 59));
  return d.toISOString();
}

function accountNumber() {
  return "200" + Array.from({length: 8}, () => rnd(0, 9)).join("");
}

function cardNumber() {
  return [
    "4" + Array.from({length: 3}, () => rnd(0, 9)).join(""),
    Array.from({length: 4}, () => rnd(0, 9)).join(""),
    Array.from({length: 4}, () => rnd(0, 9)).join(""),
    Array.from({length: 4}, () => rnd(0, 9)).join(""),
  ].join(" ");
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

// ─────────────────────────────────────────────────────────────
// DEMO USERS
// ─────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: "admin@neobank.dev",
    password: "Admin1234!",
    full_name: "Alex Morgan",
    phone: "+1 (555) 001-0001",
    role: "admin" as const,
    kyc: "verified" as const,
  },
  {
    email: "alice@neobank.dev",
    password: "Alice1234!",
    full_name: "Alice Johnson",
    phone: "+1 (555) 100-2001",
    role: "user" as const,
    kyc: "verified" as const,
  },
  {
    email: "bob@neobank.dev",
    password: "Bob12345!",
    full_name: "Bob Williams",
    phone: "+1 (555) 100-3002",
    role: "user" as const,
    kyc: "verified" as const,
  },
  {
    email: "carol@neobank.dev",
    password: "Carol123!",
    full_name: "Carol Davis",
    phone: "+1 (555) 100-4003",
    role: "user" as const,
    kyc: "pending" as const,
  },
  {
    email: "dan@neobank.dev",
    password: "Dan12345!",
    full_name: "Dan Martinez",
    phone: "+1 (555) 100-5004",
    role: "user" as const,
    kyc: "rejected" as const,
  },
  {
    email: "eve@neobank.dev",
    password: "Eve12345!",
    full_name: "Eve Thompson",
    phone: "+1 (555) 100-6005",
    role: "user" as const,
    kyc: "verified" as const,
  },
];

// ─────────────────────────────────────────────────────────────
// BILLERS
// ─────────────────────────────────────────────────────────────
const BILLERS = [
  {name: "PowerGrid Electric", type: "electricity"},
  {name: "CityWater Supply", type: "water"},
  {name: "FiberNet ISP", type: "internet"},
  {name: "NatGas Co.", type: "gas"},
  {name: "StreamCable TV", type: "cable"},
  {name: "TeleCom Mobile", type: "phone"},
];

const TX_DESCRIPTIONS = [
  "Monthly rent",
  "Grocery shopping",
  "Netflix subscription",
  "Spotify premium",
  "Amazon purchase",
  "Gym membership",
  "Coffee shop",
  "Online course",
  "Flight booking",
  "Hotel stay",
  "Restaurant dinner",
  "Gas station",
  "Pharmacy",
  "Clothing store",
  "Tech gadget",
  "Home supplies",
  "Gift transfer",
  "Freelance payment",
  "Salary advance",
  "Investment top-up",
];

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  NeoBank seed script starting...\n");

  // ── 0. Get system accounts ───────────────────────────────
  console.log("📦  Fetching system accounts...");
  const {data: sysAccounts} = await supabase
    .from("accounts")
    .select("id, account_type")
    .in("account_type", ["system_reserve", "system_fees"]);

  const reserveAccountId = sysAccounts?.find((a) => a.account_type === "system_reserve")?.id;
  const feesAccountId = sysAccounts?.find((a) => a.account_type === "system_fees")?.id;

  if (!reserveAccountId || !feesAccountId) {
    console.error("❌  System accounts not found. Run the Phase 1 SQL first.");
    process.exit(1);
  }

  console.log("   ✓ System accounts found\n");

  // ── 1. Create auth users ─────────────────────────────────
  console.log("👤  Creating auth users...");
  const createdUsers: Array<{
    id: string;
    email: string;
    full_name: string;
    role: "user" | "admin";
    kyc: "verified" | "pending" | "rejected";
    phone: string;
  }> = [];

  for (const u of DEMO_USERS) {
    // Check if already exists
    const {data: existing} = await supabase
      .from("profiles")
      .select("id")
      .eq("email", u.email)
      .single();

    if (existing) {
      console.log(`   ↩  Skipping ${u.email} (already exists)`);
      createdUsers.push({id: existing.id, ...u});
      continue;
    }

    const {data, error} = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {full_name: u.full_name},
    });

    if (error || !data.user) {
      console.error(`   ✗  Failed to create ${u.email}:`, error?.message);
      continue;
    }

    createdUsers.push({id: data.user.id, ...u});
    console.log(`   ✓  ${u.full_name} (${u.email})`);
  }

  // ── 2. Upsert profiles ───────────────────────────────────
  console.log("\n📝  Upserting profiles...");
  for (const u of createdUsers) {
    const {error} = await supabase.from("profiles").upsert(
      {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        kyc_status: u.kyc,
        is_suspended: false,
      },
      {onConflict: "id"},
    );

    if (error) console.error(`   ✗  Profile ${u.email}:`, error.message);
    else console.log(`   ✓  ${u.full_name}`);
  }

  // ── 3. Create accounts ───────────────────────────────────
  console.log("\n🏦  Creating bank accounts...");
  const accountMap: Record<string, Record<string, string>> = {};

  const accountTypes: Array<{
    type: "checking" | "savings" | "investment";
    balance: () => number;
  }> = [
    {type: "checking", balance: () => rndAmount(1000, 25000)},
    {type: "savings", balance: () => rndAmount(5000, 80000)},
    {type: "investment", balance: () => rndAmount(10000, 150000)},
  ];

  for (const u of createdUsers) {
    accountMap[u.id] = {};

    for (const at of accountTypes) {
      // Check existing
      const {data: existing} = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", u.id)
        .eq("account_type", at.type)
        .single();

      if (existing) {
        accountMap[u.id][at.type] = existing.id;
        continue;
      }

      const balance = at.balance();
      const {data, error} = await supabase
        .from("accounts")
        .insert({
          user_id: u.id,
          account_number: accountNumber(),
          account_type: at.type,
          currency: "USD",
          balance,
          status: "active",
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error(`   ✗  Account ${at.type} for ${u.email}:`, error?.message);
        continue;
      }

      accountMap[u.id][at.type] = data.id;
      console.log(`   ✓  ${u.full_name} — ${at.type}: ${fmt(balance)}`);
    }
  }

  // ── 4. Create cards ──────────────────────────────────────
  console.log("\n💳  Creating virtual cards...");
  for (const u of createdUsers.filter((u) => u.role === "user")) {
    const checkingId = accountMap[u.id]?.checking;
    if (!checkingId) continue;

    const {data: existingCards} = await supabase.from("cards").select("id").eq("user_id", u.id);

    if (existingCards && existingCards.length > 0) {
      console.log(`   ↩  Cards already exist for ${u.email}`);
      continue;
    }

    const now = new Date();
    for (const cardType of ["debit", "credit"] as const) {
      const {error} = await supabase.from("cards").insert({
        user_id: u.id,
        account_id: checkingId,
        card_number: cardNumber(),
        card_type: cardType,
        status: "active",
        expiry_month: now.getMonth() + 1,
        expiry_year: now.getFullYear() + 4,
        cvv: String(rnd(100, 999)),
        daily_limit: cardType === "debit" ? 5000 : 10000,
      });
      if (error) console.error(`   ✗  Card for ${u.email}:`, error.message);
      else console.log(`   ✓  ${u.full_name} — ${cardType} card`);
    }
  }

  // ── 5. Create beneficiaries ──────────────────────────────
  console.log("\n👥  Creating beneficiaries...");
  const userList = createdUsers.filter((u) => u.role === "user");

  for (const u of userList) {
    const {data: existingBeneficiaries} = await supabase
      .from("beneficiaries")
      .select("id")
      .eq("user_id", u.id);

    if (existingBeneficiaries && existingBeneficiaries.length > 0) {
      console.log(`   ↩  Beneficiaries exist for ${u.email}`);
      continue;
    }

    // Each user saves 2 other users as beneficiaries
    const others = userList.filter((o) => o.id !== u.id).slice(0, 2);
    for (const other of others) {
      const otherCheckingId = accountMap[other.id]?.checking;
      if (!otherCheckingId) continue;

      const {data: otherAccount} = await supabase
        .from("accounts")
        .select("account_number")
        .eq("id", otherCheckingId)
        .single();

      if (!otherAccount) continue;

      await supabase.from("beneficiaries").insert({
        user_id: u.id,
        nickname: other.full_name.split(" ")[0],
        account_number: otherAccount.account_number,
        full_name: other.full_name,
        bank_name: "NeoBank",
        is_internal: true,
      });
      console.log(`   ✓  ${u.full_name} → ${other.full_name}`);
    }
  }

  // ── 6. Seed transactions (double-entry) ──────────────────
  console.log("\n💸  Seeding transactions...");

  // Internal transfers between users
  const transferPairs: Array<{
    from: string;
    to: string;
    fromType: string;
    toType: string;
  }> = [];

  for (let i = 0; i < userList.length; i++) {
    for (let j = i + 1; j < userList.length; j++) {
      transferPairs.push({
        from: userList[i].id,
        to: userList[j].id,
        fromType: "checking",
        toType: "checking",
      });
    }
  }

  let txCount = 0;

  for (const pair of transferPairs) {
    const fromAccountId = accountMap[pair.from]?.[pair.fromType];
    const toAccountId = accountMap[pair.to]?.[pair.toType];
    if (!fromAccountId || !toAccountId) continue;

    // 3–5 transfers per pair
    for (let k = 0; k < rnd(3, 5); k++) {
      const amount = rndAmount(50, 2000);
      const fee = parseFloat((amount * 0.005).toFixed(2));
      const description = pick(TX_DESCRIPTIONS);
      const createdAt = rndDate(60);

      const {data: fromAcc} = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", fromAccountId)
        .single();

      if (!fromAcc || Number(fromAcc.balance) < amount + fee) continue;

      const fromBalance = Number(fromAcc.balance);
      const {data: toAcc} = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", toAccountId)
        .single();

      const toBalance = Number(toAcc?.balance ?? 0);

      // Insert transaction
      const {data: tx, error: txErr} = await supabase
        .from("transactions")
        .insert({
          initiated_by: pair.from,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount,
          fee,
          currency: "USD",
          type: "internal_transfer",
          status: "completed",
          description,
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select("id")
        .single();

      if (txErr || !tx) continue;

      // Insert double entries
      await supabase.from("entries").insert([
        {
          transaction_id: tx.id,
          account_id: fromAccountId,
          type: "debit",
          amount,
          balance_after: parseFloat((fromBalance - amount - fee).toFixed(2)),
          created_at: createdAt,
        },
        {
          transaction_id: tx.id,
          account_id: toAccountId,
          type: "credit",
          amount,
          balance_after: parseFloat((toBalance + amount).toFixed(2)),
          created_at: createdAt,
        },
        {
          transaction_id: tx.id,
          account_id: fromAccountId,
          type: "debit",
          amount: fee,
          balance_after: parseFloat((fromBalance - amount - fee).toFixed(2)),
          created_at: createdAt,
        },
        {
          transaction_id: tx.id,
          account_id: feesAccountId,
          type: "credit",
          amount: fee,
          balance_after: 0,
          created_at: createdAt,
        },
      ]);

      // Update balances
      await supabase
        .from("accounts")
        .update({balance: parseFloat((fromBalance - amount - fee).toFixed(2))})
        .eq("id", fromAccountId);

      await supabase
        .from("accounts")
        .update({balance: parseFloat((toBalance + amount).toFixed(2))})
        .eq("id", toAccountId);

      txCount++;
    }
  }

  // Deposits from reserve into each user's savings
  console.log("   💰  Seeding deposits...");
  for (const u of userList) {
    const savingsId = accountMap[u.id]?.savings;
    if (!savingsId) continue;

    for (let k = 0; k < rnd(2, 4); k++) {
      const amount = rndAmount(500, 5000);
      const createdAt = rndDate(90);

      const {data: savingsAcc} = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", savingsId)
        .single();

      const {data: reserveAcc} = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", reserveAccountId)
        .single();

      const savingsBalance = Number(savingsAcc?.balance ?? 0);
      const reserveBalance = Number(reserveAcc?.balance ?? 0);

      const {data: tx} = await supabase
        .from("transactions")
        .insert({
          initiated_by: u.id,
          from_account_id: reserveAccountId,
          to_account_id: savingsId,
          amount,
          fee: 0,
          currency: "USD",
          type: "deposit",
          status: "completed",
          description: "Account deposit",
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select("id")
        .single();

      if (!tx) continue;

      await supabase.from("entries").insert([
        {
          transaction_id: tx.id,
          account_id: reserveAccountId,
          type: "debit",
          amount,
          balance_after: parseFloat((reserveBalance - amount).toFixed(2)),
          created_at: createdAt,
        },
        {
          transaction_id: tx.id,
          account_id: savingsId,
          type: "credit",
          amount,
          balance_after: parseFloat((savingsBalance + amount).toFixed(2)),
          created_at: createdAt,
        },
      ]);

      await supabase
        .from("accounts")
        .update({balance: parseFloat((savingsBalance + amount).toFixed(2))})
        .eq("id", savingsId);

      await supabase
        .from("accounts")
        .update({balance: parseFloat((reserveBalance - amount).toFixed(2))})
        .eq("id", reserveAccountId);

      txCount++;
    }
  }

  console.log(`   ✓  ${txCount} transactions created`);

  // ── 7. Bill payments ─────────────────────────────────────
  console.log("\n🧾  Seeding bill payments...");
  let billCount = 0;

  for (const u of userList) {
    const checkingId = accountMap[u.id]?.checking;
    if (!checkingId) continue;

    for (let k = 0; k < rnd(3, 6); k++) {
      const biller = pick(BILLERS);
      const amount = rndAmount(30, 350);
      const createdAt = rndDate(60);
      const isRecurring = Math.random() > 0.6;

      const {data: checkingAcc} = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", checkingId)
        .single();

      const checkingBalance = Number(checkingAcc?.balance ?? 0);
      if (checkingBalance < amount) continue;

      const {data: tx} = await supabase
        .from("transactions")
        .insert({
          initiated_by: u.id,
          from_account_id: checkingId,
          to_account_id: feesAccountId,
          amount,
          fee: 0,
          currency: "USD",
          type: "bill_payment",
          status: "completed",
          description: `${biller.name} — utility payment`,
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select("id")
        .single();

      if (!tx) continue;

      await supabase.from("entries").insert([
        {
          transaction_id: tx.id,
          account_id: checkingId,
          type: "debit",
          amount,
          balance_after: parseFloat((checkingBalance - amount).toFixed(2)),
          created_at: createdAt,
        },
        {
          transaction_id: tx.id,
          account_id: feesAccountId,
          type: "credit",
          amount,
          balance_after: 0,
          created_at: createdAt,
        },
      ]);

      await supabase
        .from("accounts")
        .update({balance: parseFloat((checkingBalance - amount).toFixed(2))})
        .eq("id", checkingId);

      await supabase.from("bill_payments").insert({
        user_id: u.id,
        transaction_id: tx.id,
        biller_name: biller.name,
        biller_type: biller.type,
        account_ref: String(rnd(100000, 999999)),
        amount,
        is_recurring: isRecurring,
        status: "completed",
        created_at: createdAt,
      });

      billCount++;
    }

    // Add 1–2 scheduled bills
    for (let k = 0; k < rnd(1, 2); k++) {
      const biller = pick(BILLERS);
      const amount = rndAmount(30, 200);
      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + rnd(1, 30));

      await supabase.from("bill_payments").insert({
        user_id: u.id,
        biller_name: biller.name,
        biller_type: biller.type,
        account_ref: String(rnd(100000, 999999)),
        amount,
        is_recurring: Math.random() > 0.5,
        scheduled_at: scheduled.toISOString(),
        status: "pending",
      });
      billCount++;
    }
  }

  console.log(`   ✓  ${billCount} bill payments created`);

  // ── 8. Notifications ─────────────────────────────────────
  console.log("\n🔔  Seeding notifications...");
  const notifTemplates = [
    {
      title: "Welcome to NeoBank!",
      body: "Your account is ready. Start sending and receiving money.",
      type: "info",
    },
    {
      title: "Money Received",
      body: `You received ${fmt(rndAmount(50, 500))} from a transfer.`,
      type: "success",
    },
    {
      title: "Transfer Successful",
      body: `Your transfer of ${fmt(rndAmount(50, 1000))} was completed.`,
      type: "success",
    },
    {
      title: "Bill Payment Successful",
      body: `Your utility payment of ${fmt(rndAmount(30, 200))} was processed.`,
      type: "success",
    },
    {title: "Card Created", body: "Your new virtual debit card is ready to use.", type: "success"},
    {
      title: "Security Alert",
      body: "A new sign-in was detected from a new device.",
      type: "warning",
    },
    {
      title: "Low Balance Warning",
      body: "Your checking account balance is below $500.",
      type: "warning",
    },
    {
      title: "Scheduled Payment Reminder",
      body: "You have a bill payment scheduled for tomorrow.",
      type: "info",
    },
    {title: "KYC Verified", body: "Your identity has been successfully verified.", type: "success"},
    {
      title: "Account Statement Ready",
      body: "Your monthly statement for last month is available.",
      type: "info",
    },
  ];

  let notifCount = 0;
  for (const u of userList) {
    const count = rnd(4, 10);
    for (let k = 0; k < count; k++) {
      const tmpl = pick(notifTemplates);
      const createdAt = rndDate(30);

      await supabase.from("notifications").insert({
        user_id: u.id,
        title: tmpl.title,
        body: tmpl.body,
        is_read: Math.random() > 0.4,
        type: tmpl.type,
        created_at: createdAt,
      });
      notifCount++;
    }
  }
  console.log(`   ✓  ${notifCount} notifications created`);

  // ── 9. Summary ───────────────────────────────────────────
  console.log("\n────────────────────────────────────────");
  console.log("✅  Seed complete!\n");
  console.log("📋  Demo accounts:\n");

  for (const u of DEMO_USERS) {
    console.log(`   ${u.role === "admin" ? "🔑" : "👤"}  ${u.full_name}`);
    console.log(`       Email:    ${u.email}`);
    console.log(`       Password: ${u.password}`);
    console.log(`       KYC:      ${u.kyc}`);
    console.log();
  }

  console.log("────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
