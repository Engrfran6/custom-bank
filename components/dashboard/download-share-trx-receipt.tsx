// import { useUserAccountIds } from "@/lib/hooks/use-user-accountIds";
// import { Transaction } from "@/types/database";
// import jsPDF from "jspdf";
// import {toast} from "sonner";

// const generateReceiptPDF = (
//   t: Transaction,
//   formattedDate: string,
//   getTransactionTypeLabel: (type: string) => string,
//   accountIds: string[]
// ): jsPDF => {

//   const tx = t;
//   const credit =  accountIds.includes(t.from_account_id) ? "debit" : "credit";

//   const amount = new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: tx.currency ?? "USD",
//   }).format(Number(tx.amount));

//   const fee = new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: tx.currency ?? "USD",
//   }).format(Number(tx.fee ?? 0));

//   const doc = new jsPDF({unit: "pt", format: "a5"});
//   const W = doc.internal.pageSize.getWidth();
//   let y = 0;

//   // ── Header background ──────────────────────────────────
//   doc.setFillColor(15, 23, 42);
//   doc.rect(0, 0, W, 160, "F");

//   // Bank name
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(8);
//   doc.setTextColor(148, 163, 184);
//   doc.setCharSpace(2);
//   doc.text("NEOBANK · TRANSACTION RECEIPT", W / 2, 36, {align: "center"});
//   doc.setCharSpace(0);

//   // Status badge
//   const statusColor = tx.status === "completed" ? [52, 211, 153] : [251, 191, 36];
//   doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
//   doc.roundedRect(W / 2 - 36, 44, 72, 16, 8, 8, "F");
//   doc.setFontSize(7.5);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(15, 23, 42);
//   doc.text(tx.status.toUpperCase(), W / 2, 55, {align: "center"});

//   // Amount
//   doc.setFontSize(32);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(credit ? 52 : 255, credit ? 211 : 255, credit ? 153 : 255);
//   doc.text(`${credit ? "+" : "−"}${amount}`, W / 2, 100, {align: "center"});

//   // Direction label
//   doc.setFontSize(8);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(100, 116, 139);
//   doc.setCharSpace(1.5);
//   doc.text(credit ? "MONEY RECEIVED" : "MONEY SENT", W / 2, 118, {align: "center"});
//   doc.setCharSpace(0);

//   // Credit/Debit badge
//   // Credit/Debit badge
//   doc.setFillColor(credit ? 209 : 254, credit ? 250 : 243, credit ? 229 : 232);
//   doc.roundedRect(W / 2 - 24, 126, 48, 14, 7, 7, "F");
//   doc.setFontSize(7);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(credit ? 16 : 185, credit ? 185 : 28, credit ? 129 : 28);
//   doc.text(credit ? "CREDIT" : "DEBIT", W / 2, 136, {align: "center"});

//   y = 172;

//   // ── Helper functions ────────────────────────────────────
//   const drawSectionTitle = (title: string) => {
//     doc.setFontSize(7.5);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(148, 163, 184);
//     doc.setCharSpace(1.5);
//     doc.text(title, 28, y);
//     doc.setCharSpace(0);
//     y += 14;
//   };

//   const drawRow = (label: string, value: string, bold = false, valueColor?: number[]) => {
//     doc.setFontSize(9.5);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(100, 116, 139);
//     doc.text(label, 28, y);

//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     if (valueColor) doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
//     else doc.setTextColor(15, 23, 42);

//     // Wrap long values
//     const maxW = W - 28 - 28;
//     const lines = doc.splitTextToSize(value, maxW * 0.55);
//     doc.text(lines, W - 28, y, {align: "right"});

//     y += Math.max(lines.length * 13, 13);

//     // Divider
//     doc.setDrawColor(241, 245, 249);
//     doc.setLineWidth(0.5);
//     doc.line(28, y, W - 28, y);
//     y += 8;
//   };

//   // ── Transaction Details ─────────────────────────────────
//   drawSectionTitle("TRANSACTION DETAILS");
//   drawRow("Reference", tx.reference);
//   drawRow("Date & Time", formattedDate);
//   drawRow("Type", getTransactionTypeLabel(tx.type ?? ""));
//   if (tx.description) drawRow("Description", tx.description);

//   y += 8;

//   // ── Amount Breakdown ────────────────────────────────────
//   drawSectionTitle("AMOUNT BREAKDOWN");
//   drawRow("Subtotal", amount);
//   drawRow("Fee", fee);

//   // Total row — no divider, styled
//   doc.setFontSize(10);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(15, 23, 42);
//   doc.text("Total", 28, y);
//   doc.setTextColor(credit ? 16 : 15, credit ? 185 : 23, credit ? 129 : 42);
//   doc.text(`${credit ? "+" : "−"}${amount}`, W - 28, y, {align: "right"});
//   y += 20;

//   // ── Account Details ─────────────────────────────────────
//   if (tx.from_account || tx.to_account) {
//     y += 8;
//     drawSectionTitle("ACCOUNT DETAILS");
//     if (tx.from_account) {
//       drawRow(
//         "From",
//         `••••${tx.from_account.account_number.slice(-4)} · ${tx.from_account.account_type}`,
//       );
//     }
//     if (tx.to_account) {
//       drawRow(
//         "To",
//         `••••${tx.to_account.account_number.slice(-4)} · ${tx.to_account.account_type}`,
//       );
//     }
//   }

//   // ── Footer ──────────────────────────────────────────────
//   const pageH = doc.internal.pageSize.getHeight();
//   doc.setFillColor(248, 250, 252);
//   doc.rect(0, pageH - 52, W, 52, "F");
//   doc.setDrawColor(226, 232, 240);
//   doc.setLineWidth(0.5);
//   doc.line(0, pageH - 52, W, pageH - 52);

//   doc.setFontSize(7.5);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(100, 116, 139);
//   doc.text("Generated by NeoBank", W / 2, pageH - 36, {align: "center"});
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(148, 163, 184);
//   doc.text(new Date().toLocaleString(), W / 2, pageH - 24, {align: "center"});
//   doc.text("This is an official transaction receipt. Keep for your records.", W / 2, pageH - 12, {
//     align: "center",
//   });

//   return doc;
// };

// export const handleDownloadReceipt = (
//   t: Transaction,
//   formattedDate: string,
//   getTransactionTypeLabel: (type: string) => string,
// ) => {
//   const toastId = toast.loading("Generating receipt...");
//   try {
//     const doc = generateReceiptPDF(t, formattedDate, getTransactionTypeLabel);
//     doc.save(`receipt-${t.transaction.reference}.pdf`);
//     toast.success("Receipt downloaded", {id: toastId});
//   } catch (err) {
//     console.error("download error", err);
//     toast.error("Failed to generate receipt", {id: toastId});
//   }
// };

// export const handleShareReceipt = async (
//   t: Transaction,
//   formattedDate: string,
//   getTransactionTypeLabel: (type: string) => string,
// ) => {
//   const toastId = toast.loading("Preparing share...");
//   try {
//     const doc = generateReceiptPDF(t, formattedDate, getTransactionTypeLabel);
//     const pdfBlob = doc.output("blob");
//     const file = new File([pdfBlob], `receipt-${t.transaction.reference}.pdf`, {
//       type: "application/pdf",
//     });

//     if (navigator.share && navigator.canShare?.({files: [file]})) {
//       toast.dismiss(toastId);
//       await navigator.share({
//         title: `Receipt · ${t.transaction.reference}`,
//         files: [file],
//       });
//       return;
//     }

//     // Fallback: download
//     doc.save(`receipt-${t.transaction.reference}.pdf`);
//     toast.success("Receipt saved — share from your downloads", {id: toastId});
//   } catch (err: unknown) {
//     toast.dismiss(toastId);
//     if (err instanceof Error && err.name !== "AbortError") {
//       console.error("share error", err);
//       toast.error("Failed to share receipt");
//     }
//   }
// };
