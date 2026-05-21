import {Badge} from "@/components/ui/badge";
import {fmt} from "@/lib/helper";
import {Calendar, Clock} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";

interface UpcomingBillProps {
  guardAction: (action: () => void, actionName: string) => void; // Fixed: changed return type from string to void
}

const upcomingBills = [
  {id: 1, name: "Netflix", amount: 15.99, dueDate: "2024-01-15", category: "Entertainment"},
  {id: 2, name: "Electric Bill", amount: 89.5, dueDate: "2024-01-18", category: "Utilities"},
  {id: 3, name: "Internet", amount: 65.0, dueDate: "2024-01-20", category: "Utilities"},
];

const UpcomingBillSection = ({guardAction}: UpcomingBillProps) => {
  const router = useRouter();

  return (
    <div className="hidden md:block rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Upcoming Bills</h3>
        </div>
        <Link href="/dashboard/bills" className="text-xs text-primary hover:underline">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {upcomingBills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            onClick={() => guardAction(() => router.push("/dashboard/payments"), "pay bills")}>
            <div className="flex-1">
              <p className="font-medium text-sm">{bill.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {bill.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due{" "}
                  {new Date(bill.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{fmt(bill.amount)}</p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                Upcoming
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingBillSection;
