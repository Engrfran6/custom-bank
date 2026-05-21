import {createAdminClient as createClient} from "./supabase/admin";

type NotificationType = "info" | "success" | "warning" | "error";

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  is_read?: boolean;
  created_at?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const supabase = createClient();
  const {error} = await supabase.from("notifications").insert(payload);

  if (error) console.error("[notify]", error.message);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

export const notify = {
  transferSuccess: (user_id: string, amount: number, recipient?: string) =>
    createNotification({
      user_id,
      title: "Transfer Successful",
      body: `Your transfer of ${fmt(amount)}${recipient ? ` to ${recipient}` : ""} was completed.`,
      type: "success",
      metadata: {amount},
    }),

  transferFailed: (user_id: string, amount: number, reason?: string | Error) => {
    // Handle both string and Error objects
    const errorMessage = reason instanceof Error ? reason.message : reason;
    return createNotification({
      user_id,
      title: "Transfer Failed",
      body: `Your transfer of ${fmt(amount)} could not be completed.${errorMessage ? ` Reason: ${errorMessage}` : ""}`,
      type: "error",
      metadata: {amount, reason: errorMessage},
    });
  },

  depositSuccess: (user_id: string, amount: number, sendersName?: string) =>
    createNotification({
      user_id,
      title: "Deposit Received",
      body: `${fmt(amount)} has been deposited into your account by ${sendersName}.`,
      type: "success",
      metadata: {amount},
    }),
  depositFailed: (user_id: string, amount: number, reason?: string | Error) => {
    const errorMessage = reason instanceof Error ? reason.message : reason;
    return createNotification({
      user_id,
      title: "Deposit Failed",
      body: `Your deposit of ${fmt(amount)} could not be completed.${errorMessage ? ` Reason: ${errorMessage}` : ""}`,
      type: "error",
      metadata: {amount, reason: errorMessage},
    });
  },

  billPaymentSuccess: (user_id: string, amount: number, biller: string) =>
    createNotification({
      user_id,
      title: "Bill Payment Successful",
      body: `Payment of ${fmt(amount)} to ${biller} was processed successfully.`,
      type: "success",
      metadata: {amount, biller},
    }),

  billPaymentFailed: (user_id: string, amount: number, biller: string) =>
    createNotification({
      user_id,
      title: "Bill Payment Failed",
      body: `Payment of ${fmt(amount)} to ${biller} failed. Please try again.`,
      type: "error",
      metadata: {amount, biller},
    }),

  lowBalance: (user_id: string, balance: number, accountType: string) =>
    createNotification({
      user_id,
      title: "Low Balance Alert",
      body: `Your ${accountType} account balance is ${fmt(balance)}. Consider topping up.`,
      type: "warning",
      metadata: {balance, accountType},
    }),

  loginAlert: (user_id: string, device?: string) =>
    createNotification({
      user_id,
      title: "New Login Detected",
      body: `A new login was detected on your account${device ? ` from ${device}` : ""}.`,
      type: "warning",
      metadata: {device},
    }),

  reportReceived: (user_id: string, reference: string) =>
    createNotification({
      user_id,
      title: "Report Received",
      body: `Your security report ${reference} has been received and is under investigation.`,
      type: "info",
      metadata: {reference},
    }),

  ticketReceived: (user_id: string, reference: string) =>
    createNotification({
      user_id,
      title: "Support Ticket Created",
      body: `Ticket ${reference} has been created. Our team will respond within 24 hours.`,
      type: "info",
      metadata: {reference},
    }),

  ticketReplied: (user_id: string, reference: string) =>
    createNotification({
      user_id,
      title: "Support Ticket Updated",
      body: `Your ticket ${reference} has received a response from our support team.`,
      type: "info",
      metadata: {reference},
    }),

  fraudFlagged: (user_id: string) =>
    createNotification({
      user_id,
      title: "Account Restricted",
      body: "Your account has been temporarily restricted due to suspicious activity. Please contact support.",
      type: "error",
    }),

  // Add these missing ones from your data
  cardCreated: (user_id: string, card_type: string = "virtual debit") =>
    createNotification({
      user_id,
      title: "New Card Created",
      body: `Your virtual ${card_type} card has been created successfully.`,
      type: "success",
      metadata: {card_type},
    }),
  cardCreationFailed: (user_id: string, card_type: string = "virtual debit") =>
    createNotification({
      user_id,
      title: "Card Creation Failed",
      body: `Failed to create your virtual ${card_type} card.`,
      type: "error",
      metadata: {card_type},
    }),

  moneyReceived: (user_id: string, amount: number, fromUser?: string) =>
    createNotification({
      user_id,
      title: "Money Received",
      body: `You received ${fmt(amount)}${fromUser ? ` from ${fromUser}` : ""}.`,
      type: "success",
      metadata: {amount, fromUser},
    }),

  profileUpdated: (user_id: string, updatedFields: string[]) =>
    createNotification({
      user_id,
      title: "Profile Updated",
      body: `Your ${updatedFields.join(", ")} ${updatedFields.length === 1 ? "has" : "have"} been updated successfully.`,
      type: "success",
      metadata: {updatedFields},
    }),

  scheduledPaymentReminder: (user_id: string, amount: number, biller: string) =>
    createNotification({
      user_id,
      title: "Scheduled Payment Reminder",
      body: `You have a payment of ${fmt(amount)} to ${biller} scheduled for tomorrow.`,
      type: "info",
      metadata: {amount, biller},
    }),

  accountStatementReady: (user_id: string, month: string, year: number) =>
    createNotification({
      user_id,
      title: "Account Statement Ready",
      body: `Your ${month} ${year} account statement is now available.`,
      type: "info",
      metadata: {month, year},
    }),

  kycVerified: (user_id: string) =>
    createNotification({
      user_id,
      title: "KYC Verified",
      body: "Your identity has been successfully verified.",
      type: "success",
    }),

  reportStatusChanged: (user_id: string, reference: string, status: string) =>
    createNotification({
      user_id,
      title: "Report Status Updated",
      body: `Your report ${reference} status has been updated to: ${status.replace("_", " ")}.`,
      type: status === "resolved" ? "success" : "info",
      metadata: {reference, status},
    }),
};
