"use client";

import {BillForm} from "@/components/dashboard/bill-form";
import {BillHistory} from "@/components/dashboard/bill-history";
import {StatsCard} from "@/components/dashboard/stats-card";
import {Receipt, Clock, CheckCircle2, TrendingDown} from "lucide-react";
import {useMemo, useState} from "react";
import {BillDetailDialog} from "@/components/dashboard/bill-detail-dialog";
import {useBillHistory} from "@/lib/hooks/use-bills";
import {BillPayment} from "@/types/database";

export default function PaymentsPage() {
  const {bills} = useBillHistory();
  const [selectedBill, setSelectedBill] = useState<BillPayment | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  const handleBillClick = (bill: BillPayment) => {
    setSelectedBill(bill);
    setBillDialogOpen(true);
  };

  const stats = useMemo(() => {
    const completed = bills.filter((b) => b.status === "completed");
    const scheduled = bills.filter((b) => b.status === "pending");
    const totalSpent = completed.reduce((s, b) => s + Number(b.amount), 0);

    return {completed: completed.length, scheduled: scheduled.length, totalSpent};
  }, [bills]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bill Payments</h1>
        <p className="text-sm text-muted-foreground">
          Pay utilities, schedule recurring bills, track history
        </p>
      </div>

      {/* Stats */}
      <div className="hidden md:grid gap-4 grid-cols-3">
        <StatsCard
          label="Total Paid"
          value={fmt(stats.totalSpent)}
          icon={TrendingDown}
          iconClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatsCard
          label="Payments Made"
          value={String(stats.completed)}
          icon={CheckCircle2}
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatsCard
          label="Scheduled"
          value={String(stats.scheduled)}
          icon={Clock}
          iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Bill form */}
        <div className="rounded-xl border border-border bg-card p-6 xl:col-span-2">
          <h2 className="mb-5 text-sm font-semibold">Pay a Bill</h2>
          <BillForm />
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Payment History</h2>
              <p className="text-xs text-muted-foreground">All bills and scheduled payments</p>
            </div>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <BillHistory onBillClick={handleBillClick} />
        </div>
      </div>
      <BillDetailDialog
        bill={selectedBill}
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
      />
    </div>
  );
}
