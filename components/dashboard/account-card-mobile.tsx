"use client";

import type {Account, Transaction} from "@/types/database";
import {Eye, EyeOff, Send, Wallet, Copy, Check, ArrowDownLeft} from "lucide-react";
import {useState} from "react";
import {useFraud} from "@/lib/context/fraud-context";
import {toast} from "sonner";
import {AccountDetailsDialog} from "@/components/dashboard/account-details-dailog";
import {TransferDialog} from "@/components/dashboard/transfer-dialog";
import {ReceiveDialog} from "@/components/dashboard/receive-dialog";

interface AccountCardProps {
  account: Account;
  transactions?: Transaction[];
}

export function AccountCardMobile({account, transactions = []}: AccountCardProps) {
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const {guardAction} = useFraud();

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: account.currency ?? "USD",
  }).format(Number(account.balance));

  const handleCopyNumber = async () => {
    await navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Number(account.balance) <= 0) {
      toast.warning("Insufficient balance");
      return;
    }
    guardAction(() => setTransferOpen(true), "send money");
  };

  const handleReceive = (e: React.MouseEvent) => {
    e.stopPropagation();
    guardAction(() => setReceiveOpen(true), "receive money");
  };

  return (
    <>
      <div
        className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer"
        onClick={() => setDetailsOpen(true)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Wallet className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-gray-900 truncate">{account.account_type}</p>
              <p className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                ••••{account.account_number.slice(-4)}
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-900">{hidden ? "••••••" : formatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={handleSend} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleReceive}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <ArrowDownLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHidden(!hidden);
            }}
            className="p-1.5 rounded-md text-gray-400">
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyNumber();
            }}
            className="p-1.5 rounded-md text-gray-400">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <AccountDetailsDialog
        account={account}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        transactions={transactions}
      />
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        fromAccountId={account.id}
      />
      <ReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        accountId={account.id}
        accountNumber={account.account_number}
      />
    </>
  );
}
