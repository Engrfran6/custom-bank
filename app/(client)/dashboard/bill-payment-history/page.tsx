"use client";

import {BillDetailDialog} from "@/components/dashboard/bill-detail-dialog";
import {BillHistory} from "@/components/dashboard/bill-history";
import {BillPayment} from "@/types/database";
import {Receipt} from "lucide-react";
import {useState} from "react";

const BillPaymentHistory = () => {
  const [selectedBill, setSelectedBill] = useState<BillPayment | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  const handleBillClick = (bill: BillPayment) => {
    setSelectedBill(bill);
    setBillDialogOpen(true);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">Bills & scheduled payments</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Receipt className="h-5 w-5" />
        </div>
      </div>

      <BillHistory onBillClick={handleBillClick} />

      <BillDetailDialog
        bill={selectedBill}
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
      />
    </div>
  );
};

export default BillPaymentHistory;
