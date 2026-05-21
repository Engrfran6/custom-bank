import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {CreditCard} from "lucide-react";
import {VirtualCard} from "../virtual-card";
import {useRouter} from "next/navigation";
import {CardWithAccount} from "@/lib/hooks/use-card";

interface VirtualCardProps {
  cardLoading: boolean;
  cards: CardWithAccount[];
}

const VirtualCardSection = ({cardLoading, cards}: VirtualCardProps) => {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Your Cards</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {cards.length} Active
        </Badge>
      </div>
      <div className="space-y-3">
        {cardLoading ? (
          <>
            <div className="h-32 rounded-xl bg-muted/20 animate-pulse" />
            <div className="h-32 rounded-xl bg-muted/20 animate-pulse" />
          </>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No cards available</p>
          </div>
        ) : (
          cards.slice(0, 2).map((card) => <VirtualCard key={card.id} card={card} />)
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => router.push("/dashboard/cards")}>
          Manage Cards →
        </Button>
      </div>
    </div>
  );
};
export default VirtualCardSection;
