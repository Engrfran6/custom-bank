"use client";

import {useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Mail,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {cn} from "@/lib/utils/utils";
import type {Account, Transaction} from "@/types/database";

interface AccountDetailsDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions?: Transaction[];
}

const dateRanges = [
  {label: "Last 30 days", value: "30", days: 30},
  {label: "Last 3 months", value: "90", days: 90},
  {label: "Last 6 months", value: "180", days: 180},
  {label: "Last year", value: "365", days: 365},
  {label: "All time", value: "all", days: 0},
];

const fileFormats = [
  {label: "PDF", value: "pdf", icon: FileText},
  {label: "CSV", value: "csv", icon: FileText},
  {label: "Excel", value: "xlsx", icon: FileText},
];

export function AccountDetailsDialog({
  account,
  open,
  onOpenChange,
  transactions = [],
}: AccountDetailsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [selectedRange, setSelectedRange] = useState("30");
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);

  const handleCopyAccountNumber = async () => {
    if (account) {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadStatement = async () => {
    setGenerating(true);
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Here you would call your API to generate the statement
    console.log("Downloading statement:", {
      accountId: account?.id,
      range: selectedRange,
      format: selectedFormat,
    });

    setGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!account) return null;

  // Calculate stats from transactions
  const accountTransactions = transactions.filter(
    (t) => t.from_account_id === account.id || t.to_account_id === account.id,
  );

  const totalCredits = accountTransactions
    .filter((t) => t.to_account_id === account.id && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = accountTransactions
    .filter((t) => t.from_account_id === account.id && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: account.currency ?? "USD",
  }).format(Number(account.balance));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Account Details</DialogTitle>
          <DialogDescription>
            View account information, download statements, and manage your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Overview Card */}
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Account Type</p>
                <p className="font-semibold text-lg capitalize">{account.account_type}</p>
              </div>
              <Badge variant={account.status === "active" ? "default" : "secondary"}>
                {account.status}
              </Badge>
            </div>

            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Account Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-mono text-sm">{account.account_number}</p>
                <button
                  onClick={handleCopyAccountNumber}
                  className="rounded p-0.5 hover:bg-muted transition-colors">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold mt-0.5">{formattedBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">
                as of {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-emerald-500/10 p-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Credits</p>
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: account.currency ?? "USD",
                    }).format(totalCredits)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-500/10 p-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Debits</p>
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: account.currency ?? "USD",
                    }).format(totalDebits)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statement Download Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Statement
            </h3>

            <div className="space-y-4">
              {/* Date Range Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Select Date Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {dateRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedRange(range.value)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all",
                        selectedRange === range.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Format Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  File Format
                </label>
                <div className="flex gap-2">
                  {fileFormats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                        selectedFormat === format.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30",
                      )}>
                      <format.icon className="h-3.5 w-3.5" />
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDownloadStatement}
                  disabled={generating}
                  className="flex-1 gap-2">
                  {generating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Statement
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm transition-all hover:bg-muted/20">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Send Money</p>
                  <p className="text-[10px] text-muted-foreground">Transfer to another account</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm transition-all hover:bg-muted/20">
                <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Receive Money</p>
                  <p className="text-[10px] text-muted-foreground">Get payment details</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm transition-all hover:bg-muted/20">
                <Mail className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="font-medium">Email Statement</p>
                  <p className="text-[10px] text-muted-foreground">Send to your email</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm transition-all hover:bg-muted/20">
                <ExternalLink className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">Account Services</p>
                  <p className="text-[10px] text-muted-foreground">Manage account settings</p>
                </div>
              </button>
            </div>
          </div>

          {/* Important Notice */}
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Statements are generated in real-time. For official bank statements with stamp,
                please contact customer support.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
