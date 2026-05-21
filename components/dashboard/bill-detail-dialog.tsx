// components/dashboard/bill-detail-dialog.tsx
"use client";

import {useState} from "react";
import {cn} from "@/lib/utils/utils";
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Hash,
  FileText,
  Building2,
  CreditCard,
  Download,
  Share2,
  X,
  Banknote,
  CalendarDays,
  Repeat,
  Mail,
  Phone,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {BillPayment} from "@/lib/hooks/use-bills";

const statusConfig: Record<
  string,
  {label: string; icon: React.ReactNode; color: string; bg: string}
> = {
  completed: {
    label: "Paid",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Scheduled",
    icon: <Clock className="h-5 w-5" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  },
  processing: {
    label: "Processing",
    icon: <RefreshCw className="h-5 w-5" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  },
};

const billerTypeLabels: Record<string, string> = {
  utility: "Utility Bill",
  internet: "Internet Service",
  mobile: "Mobile Phone",
  streaming: "Streaming Service",
  subscription: "Subscription",
  insurance: "Insurance",
  rent: "Rent",
  loan: "Loan Payment",
  credit_card: "Credit Card",
  other: "Other",
};

interface BillDetailDialogProps {
  bill: BillPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDetailDialog({bill, open, onOpenChange}: BillDetailDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!bill) return null;

  const status = statusConfig[bill.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const billerTypeLabel = billerTypeLabels[bill.biller_type] || bill.biller_type;

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(bill.amount));

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(bill.created_at));

  const scheduledDate = bill.scheduled_at
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(bill.scheduled_at))
    : null;

  const paidDate = bill.created_at
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(bill.created_at))
    : null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadReceipt = () => {
    console.log("Download receipt for bill:", bill.account_ref);
  };

  const handleShare = () => {
    console.log("Share bill payment:", bill.account_ref);
  };

  const handlePayNow = () => {
    console.log("Pay bill now:", bill.id);
  };

  const handleScheduleAgain = () => {
    console.log("Schedule bill again:", bill.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className={cn("relative p-6 pb-4", status.bg, "border-b sticky top-0 z-10")}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {bill.biller_name}
                  {bill.is_recurring && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Repeat className="h-3 w-3" />
                      Recurring
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">{billerTypeLabel}</DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Amount Section */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
            <p className="text-4xl font-bold font-mono text-foreground">-{amount}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className={cn("gap-1.5", status.color)}>
                {status.icon}
                {status.label}
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                Bill Payment
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          {/* Reference Number */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Reference Number</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                {bill.account_ref}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(bill.account_ref, "reference")}>
                {copied === "reference" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Account Reference */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Account Number</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                {bill.account_ref}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(bill.account_ref, "account")}>
                {copied === "account" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <span className="text-sm">{formattedDate}</span>
            </div>

            {scheduledDate && bill.status === "pending" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Scheduled For</span>
                </div>
                <span className="text-sm">{scheduledDate}</span>
              </div>
            )}

            {paidDate && bill.status === "completed" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Paid On</span>
                </div>
                <span className="text-sm">{paidDate}</span>
              </div>
            )}
          </div>

          {/* Biller Details */}
          {(bill.biller_phone || bill.biller_email || bill.biller_address) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Biller Information
                </h4>

                <div className="space-y-2">
                  {bill.biller_phone && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Phone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{bill.biller_phone}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(bill.biller_phone!, "phone")}>
                          {copied === "phone" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {bill.biller_email && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{bill.biller_email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(bill.biller_email!, "email")}>
                          {copied === "email" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {bill.biller_address && (
                    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Address</span>
                      </div>
                      <span className="text-sm max-w-[60%] text-right">{bill.biller_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Payment Method */}
          {bill.payment_method && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <span className="text-sm">{bill.payment_method}</span>
              </div>
            </>
          )}

          {/* Notes */}
          {bill.notes && (
            <div className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <span className="text-sm max-w-[60%] text-right">{bill.notes}</span>
            </div>
          )}

          {/* Recurring Info */}
          {bill.is_recurring && bill.recurring_interval && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recurring</span>
                </div>
                <span className="text-sm capitalize">Every {bill.recurring_interval}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 pt-0 border-t mt-2 sticky bottom-0 bg-background">
          {bill.status === "pending" && (
            <>
              <Button className="flex-1 gap-2" onClick={handlePayNow}>
                <Banknote className="h-4 w-4" />
                Pay Now
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleScheduleAgain}>
                <CalendarDays className="h-4 w-4" />
                Reschedule
              </Button>
            </>
          )}
          {bill.status === "completed" && (
            <>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </>
          )}
          {bill.status === "failed" && (
            <>
              <Button className="flex-1 gap-2" onClick={handlePayNow}>
                <RefreshCw className="h-4 w-4" />
                Retry Payment
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleScheduleAgain}>
                <CalendarDays className="h-4 w-4" />
                Schedule Later
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
