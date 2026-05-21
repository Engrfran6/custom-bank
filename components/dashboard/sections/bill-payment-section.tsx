import {ChevronRight, Receipt} from "lucide-react";
import {BillDetailDialog} from "../bill-detail-dialog";
import {BillHistory} from "../bill-history";
import Link from "next/link";
import {useState} from "react";
import {BillPayment} from "@/types/database";

interface BillPaymentSectionProps {
  onBillClick?: (bill: BillPayment) => void;
}

function BillPaymentSection({onBillClick}: BillPaymentSectionProps) {
  const [selectedBill, setSelectedBill] = useState<BillPayment | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  const handleBillClick = (bill: BillPayment) => {
    setSelectedBill(bill);
    setBillDialogOpen(true);
    if (onBillClick) {
      onBillClick(bill);
    }
  };

  return (
    <div className="col-span-2 rounded-2xl border border-border bg-card p-6">
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

      <Link
        href="/dashboard/bill-payment-history"
        className="flex items-center justify-center gap-1 mt-4 pt-4 text-sm text-primary hover:underline">
        View Payment History <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default BillPaymentSection;
