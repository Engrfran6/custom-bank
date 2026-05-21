// components/dashboard/transaction-detail-dialog.tsx
import {useState} from "react";
import {cn} from "@/lib/utils/utils";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Calendar,
  Hash,
  FileText,
  Building2,
  AlertCircle,
  Download,
  Share2,
  X,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {TransactionHistory} from "@/lib/requests/fetch-transactions";
import {toast} from "sonner";
import {handleDownloadReceipt, handleShareReceipt} from "./download-share-trx-receipt";

const typeIcon: Record<string, React.ReactNode> = {
  internal_transfer: <ArrowUpRight className="h-5 w-5" />,
  external_transfer: <ArrowUpRight className="h-5 w-5" />,
  bill_payment: <Receipt className="h-5 w-5" />,
  deposit: <ArrowDownLeft className="h-5 w-5" />,
  withdrawal: <ArrowUpRight className="h-5 w-5" />,
  fee: <RefreshCw className="h-5 w-5" />,
};

const typeColor: Record<string, string> = {
  internal_transfer: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  external_transfer: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  bill_payment: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  deposit: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  withdrawal: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  fee: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusConfig: Record<
  string,
  {label: string; icon: React.ReactNode; color: string; bg: string}
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  },
  processing: {
    label: "Processing",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  },
  reversed: {
    label: "Reversed",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800",
  },
};

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    internal_transfer: "Internal Transfer",
    external_transfer: "External Transfer",
    bill_payment: "Bill Payment",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    fee: "Fee",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

interface TransactionDetailDialogProps {
  transaction: TransactionHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function TransactionDetailDialog({
  transaction: t,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!t) return null;

  const credit = t.type === "credit";
  const status = statusConfig[t.transaction.status];
  const typeLabel = getTransactionTypeLabel(t.type);

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: t.transaction.currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(t.transaction.amount));

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(t.created_at));

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${text} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    handleDownloadReceipt(t, formattedDate, getTransactionTypeLabel);
  };

  const handleShare = async () => {
    handleShareReceipt(t, formattedDate, getTransactionTypeLabel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" showCloseButton={false}>
        {/* Header with gradient */}
        <div className={cn("relative p-6 pb-4", status.bg, "border-b")}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-full p-2.5", typeColor[t.type])}>{typeIcon[t.type]}</div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {t.transaction.description || typeLabel}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">{typeLabel}</DialogDescription>
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
            <p className="text-sm text-muted-foreground mb-1">Amount</p>
            <p
              className={cn(
                "text-4xl font-bold font-mono",
                credit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}>
              {credit ? "+" : "-"}
              {amount}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className={cn("gap-1.5", status.color)}>
                {status.icon}
                {status.label}
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                {credit ? "Credit" : "Debit"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          {/* Transaction Reference */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Transaction Reference</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                {t.transaction.reference}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(t.transaction.reference, "reference")}>
                {copied === "reference" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date & Time</span>
            </div>
            <span className="text-sm">{formattedDate}</span>
          </div>

          {/* Description */}
          {t.transaction.description && (
            <div className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Description</span>
              </div>
              <span className="text-sm max-w-[60%] text-right">{t.transaction.description}</span>
            </div>
          )}

          {/* Account Details */}
          {(t.transaction.from_account || t.transaction.to_account) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Account Details
                </h4>

                {t.transaction.from_account && (
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">From Account</span>
                      <Badge variant="outline" className="text-xs">
                        {t.transaction.from_account.account_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        ••••{t.transaction.from_account.account_number.slice(-4)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(t.transaction.from_account!.account_number, "fromAccount")
                        }>
                        {copied === "fromAccount" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {t.transaction.to_account && (
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">To Account</span>
                      <Badge variant="outline" className="text-xs">
                        {t.transaction.to_account.account_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        ••••{t.transaction.to_account.account_number.slice(-4)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(t.transaction.to_account!.account_number, "toAccount")
                        }>
                        {copied === "toAccount" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata if available */}
          {t.transaction.metadata && Object.keys(t.transaction.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Additional Information
                </h4>
                <div className="grid gap-2">
                  {Object.entries(t.transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 pt-0 border-t mt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
