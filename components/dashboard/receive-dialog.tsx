"use client";

import {useState, useEffect} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  Landmark,
  Bitcoin,
  DollarSign,
  Mail,
  ChevronRight,
  Copy,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowLeft,
  X,
  QrCode,
  Share2,
} from "lucide-react";
import {QRCodeSVG} from "qrcode.react";
import {cn} from "@/lib/utils/utils";

// Types
type MethodType = "crypto" | "cash" | "wallets";
type Step = "select" | "subselect" | "details" | "upload" | "done";

interface CryptoOption {
  id: string;
  label: string;
  network: string;
  minAmount: string;
  depositMethod: MethodType;
}

interface CashOption {
  id: string;
  label: string;
  code: string;
  instructions: string;
  depositMethod: MethodType;
}

interface WalletOption {
  id: string;
  label: string;
  type: string;
  instructions: string;
  depositMethod: MethodType;
}

type MethodOption = CryptoOption | CashOption | WalletOption;

interface DepositMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  processingTime: string;
  minAmount: string;
  maxAmount: string;
}

// Deposit Methods Data
const depositMethods: DepositMethod[] = [
  {
    id: "check",
    title: "Mobile Check Deposit",
    description: "Upload a check using your camera",
    icon: Upload,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    processingTime: "1-3 business days",
    minAmount: "$0.01",
    maxAmount: "$10,000",
  },
  {
    id: "cash",
    title: "Cash Deposit",
    description: "Western Union, MoneyGram, Ria",
    icon: Landmark,
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    processingTime: "Same day",
    minAmount: "$10",
    maxAmount: "$5,000",
  },
  {
    id: "crypto",
    title: "Crypto Deposit",
    description: "Bitcoin, USDT, Ethereum",
    icon: Bitcoin,
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
    processingTime: "1-2 hours",
    minAmount: "$10 equivalent",
    maxAmount: "No limit",
  },
  {
    id: "wallets",
    title: "Digital Wallets",
    description: "PayPal, Cash App",
    icon: DollarSign,
    color: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
    processingTime: "Instant - 1 hour",
    minAmount: "$5",
    maxAmount: "$3,000",
  },
  {
    id: "money_order",
    title: "Money Order",
    description: "Mail a certified money order",
    icon: Mail,
    color: "bg-slate-500",
    gradient: "from-slate-500 to-slate-600",
    processingTime: "5-7 business days",
    minAmount: "$20",
    maxAmount: "$2,000",
  },
];

const methodOptions: Record<MethodType, MethodOption[]> = {
  crypto: [
    {
      id: "usdt",
      label: "USDT (TRC20)",
      network: "TRC20",
      minAmount: "$10",
      depositMethod: "crypto",
    },
    {
      id: "btc",
      label: "Bitcoin",
      network: "BTC Network",
      minAmount: "$20",
      depositMethod: "crypto",
    },
    {id: "eth", label: "Ethereum", network: "ERC20", minAmount: "$15", depositMethod: "crypto"},
  ],
  cash: [
    {
      id: "wu",
      label: "Western Union",
      code: "WU",
      instructions: "Visit any Western Union agent",
      depositMethod: "cash",
    },
    {
      id: "mg",
      label: "MoneyGram",
      code: "MG",
      instructions: "Visit any MoneyGram location",
      depositMethod: "cash",
    },
    {
      id: "ria",
      label: "Ria",
      code: "RIA",
      instructions: "Visit any Ria partner location",
      depositMethod: "cash",
    },
  ],
  wallets: [
    {
      id: "paypal",
      label: "PayPal",
      type: "email",
      instructions: "Send to our PayPal email",
      depositMethod: "wallets",
    },
    {
      id: "cashapp",
      label: "Cash App",
      type: "tag",
      instructions: "Send to our Cash App $tag",
      depositMethod: "wallets",
    },
  ],
};

interface PaymentInfo {
  address: string;
  memo?: string;
}

const paymentDetails: Record<string, Record<string, PaymentInfo>> = {
  crypto: {
    usdt: {address: "TRC20: TXYZ-123-FAKE-USDT-ADDRESS", memo: "Memo: Your Account ID"},
    btc: {address: "bc1qexamplebitcoinaddress12345"},
    eth: {address: "0xEXAMPLEethereumaddress12345", memo: "Gas Fee: ~$2-5"},
  },
  cash: {
    wu: {address: "Western Union Agent: GLOBAL PAY LTD", memo: "Receiver: NeoBank"},
    mg: {address: "MoneyGram Receiver: NeoBank Finance Desk"},
    ria: {address: "Ria Receiver: Settlement Unit Lagos"},
  },
  wallets: {
    paypal: {address: "payments@neobank.com"},
    cashapp: {address: "$NeoBankFinance"},
  },
};

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  accountNumber?: string;
  onSuccess?: () => void;
}

export function ReceiveDialog({open, onOpenChange, accountNumber, onSuccess}: ReceiveDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [subOption, setSubOption] = useState<MethodOption | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instantDeposit, setInstantDeposit] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const paymentInfo =
    selectedMethod && subOption ? paymentDetails[selectedMethod]?.[subOption.id] : null;

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSelectedMethod(null);
        setSubOption(null);
        setStep("select");
        setFile(null);
        setError(null);
        setInstantDeposit(false);
        setShowQR(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const getMinAmount = (option: MethodOption): string => {
    if ("minAmount" in option) {
      return option.minAmount;
    }
    return "$5";
  };

  const getOptionDisplayText = (option: MethodOption): string => {
    if ("network" in option) {
      return `Network: ${option.network}`;
    }
    if ("instructions" in option) {
      return option.instructions;
    }
    return "";
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (paymentInfo && navigator.share) {
      await navigator.share({
        title: "Payment Details",
        text: paymentInfo.address,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0] || null;
    if (uploadedFile) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!validTypes.includes(uploadedFile.type)) {
        setError("Please upload a valid image or PDF file");
        return;
      }
      if (uploadedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setError(null);
      setFile(uploadedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    setError(null);
    setStep("done");
    setTimeout(() => {
      onOpenChange(false);
      onSuccess?.();
    }, 2000);
  };

  const handleReset = () => {
    setSelectedMethod(null);
    setSubOption(null);
    setStep("select");
    setFile(null);
    setError(null);
    setInstantDeposit(false);
  };

  const getAccountDisplay = () => {
    if (accountNumber) {
      return `•••• ${accountNumber.slice(-4)}`;
    }
    return "Select Account";
  };

  const handleBackNavigation = () => {
    if (step === "details") {
      setStep("subselect");
    } else if (step === "subselect") {
      setStep("select");
    } else if (step === "upload") {
      if (selectedMethod === "check") {
        setStep("select");
      } else {
        setStep("details");
      }
    }
  };

  // Fixed: Properly check if we should show the back button
  const shouldShowBackButton = () => {
    return step === "subselect" || step === "details" || step === "upload";
  };

  // Fixed: Properly check if we should show the close button
  const shouldShowCloseButton = () => {
    return step !== "done";
  };

  const getStepTitle = () => {
    switch (step) {
      case "select":
        return "Receive Money";
      case "subselect":
        return `Deposit via ${selectedMethod || ""}`;
      case "details":
        return "Payment Details";
      case "upload":
        return selectedMethod === "check" ? "Upload Check" : "Upload Receipt";
      case "done":
        return "Deposit Submitted!";
      default:
        return "Receive Money";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md sm:max-w-lg md:max-w-xl",
          "p-0 overflow-hidden",
          step === "upload" && "max-w-md",
          step === "done" && "max-w-sm",
        )}
        showCloseButton={false}>
        {/* Header */}
        <div className={cn("border-b border-border p-4", step === "done" && "border-0")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shouldShowBackButton() && (
                <button
                  onClick={handleBackNavigation}
                  className="rounded-lg p-1 hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg">{getStepTitle()}</DialogTitle>
                {step === "select" && (
                  <DialogDescription>
                    {accountNumber
                      ? `To: ${getAccountDisplay()}`
                      : "Choose a deposit method to add funds"}
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>
            {shouldShowCloseButton() && (
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* STEP 1: SELECT METHOD */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                {depositMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        setStep(method.id === "check" ? "upload" : "subselect");
                      }}
                      className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 text-left transition-all hover:shadow-md hover:border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className={cn("rounded-lg p-2 text-white", method.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{method.title}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Account Info */}
              {accountNumber && (
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Your Account Number</p>
                  <p className="font-mono text-sm font-semibold mt-0.5">{getAccountDisplay()}</p>
                </div>
              )}

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <div className="flex gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    All deposits are secure and insured. Processing times vary by method.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUB-SELECTION */}
          {step === "subselect" && selectedMethod && (
            <div className="space-y-3">
              <div className="space-y-2">
                {(methodOptions[selectedMethod as MethodType] || []).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSubOption(opt);
                      setStep("details");
                    }}
                    className="w-full rounded-lg border border-border p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5">
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getOptionDisplayText(opt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT DETAILS */}
          {step === "details" && selectedMethod && subOption && paymentInfo && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex flex-col items-center gap-1">
                  <div className="rounded-xl bg-white p-3 shadow-lg">
                    {showQR ? (
                      <QRCodeSVG value={paymentInfo.address} size={120} />
                    ) : (
                      <QrCode className="h-20 w-20 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {showQR ? "Hide QR" : "Show QR Code"}
                  </span>
                </button>
              </div>

              {/* Payment Details */}
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Send to:</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono break-all flex-1">{paymentInfo.address}</code>
                  <button
                    onClick={() => handleCopy(paymentInfo.address)}
                    className="shrink-0 p-1.5 hover:bg-muted rounded-lg transition-colors">
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {paymentInfo.memo && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">{paymentInfo.memo}</p>
                  </div>
                )}
              </div>

              {/* Share Button */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleShare}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm hover:bg-muted/20 transition-colors">
                  <Share2 className="h-4 w-4" />
                  Share Details
                </button>
              )}

              {/* Important Info */}
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    <p className="font-medium">Important:</p>
                    <p className="mt-1">Minimum: {getMinAmount(subOption)}</p>
                    {"network" in subOption && <p>Only send {subOption.label} to this address</p>}
                  </div>
                </div>
              </div>

              {/* Instant Deposit Option */}
              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/20 transition-colors">
                <div>
                  <span className="text-sm font-medium">Instant Deposit</span>
                  <p className="text-xs text-muted-foreground">Priority processing</p>
                </div>
                <input
                  type="checkbox"
                  checked={instantDeposit}
                  onChange={(e) => setInstantDeposit(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <button
                onClick={() => setStep("upload")}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all">
                I have made payment
              </button>
            </div>
          )}

          {/* UPLOAD STEP */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-base">
                  {selectedMethod === "check" ? "Upload Check" : "Upload Receipt"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMethod === "check"
                    ? "Upload a clear image of your endorsed check"
                    : "Upload payment receipt for verification"}
                </p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  error
                    ? "border-red-500 bg-red-500/5"
                    : "border-border hover:border-primary/50 hover:bg-primary/5",
                )}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receive-file-upload"
                />
                <label
                  htmlFor="receive-file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {file ? file.name : "Click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF (max 5MB)</p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!file}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {selectedMethod === "check" ? "Submit Check" : "Submit Receipt"}
              </button>
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Deposit Submitted!</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your deposit is being reviewed</p>
              {instantDeposit && (
                <p className="text-xs text-primary mt-2">Priority processing enabled</p>
              )}
              <button
                onClick={handleReset}
                className="mt-6 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                Make Another Deposit
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
