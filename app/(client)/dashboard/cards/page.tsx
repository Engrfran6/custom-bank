"use client";

import {useState} from "react";
import {useCards} from "@/lib/hooks/use-card";
import {VirtualCard} from "@/components/dashboard/virtual-card";
import {CardControls} from "@/components/dashboard/card-controls";
import {IssueCardDialog} from "@/components/dashboard/issue-card-dialog";
import {Skeleton} from "@/components/dashboard/skeleton";
import {Button} from "@/components/ui/button";
import {Plus, CreditCard} from "lucide-react";
import {cn} from "@/lib/utils/utils";

export default function CardsPage() {
  const {cards, loading, createCard, updateCard, cancelCard} = useCards();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);

  const selectedCard = cards.find((c) => c.id === selectedId) ?? cards[0] ?? null;

  return (
    <div className="flex flex-col gap-6 px-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
          <p className="text-sm text-muted-foreground">
            Manage your virtual debit and credit cards
          </p>
        </div>
        <Button onClick={() => setIssueOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Card
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 2}).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No cards yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Issue a virtual card to get started</p>
          <Button className="mt-5" onClick={() => setIssueOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-7">
          {/* Card carousel */}
          <div className="flex flex-col gap-4 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Cards ({cards.length})
            </p>
            <div className="flex flex-col gap-4">
              {cards.map((card) => (
                <VirtualCard
                  key={card.id}
                  card={card}
                  selected={selectedCard?.id === card.id}
                  onClick={() => setSelectedId(card.id)}
                />
              ))}
            </div>

            {/* Card type legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                Debit
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-violet-700" />
                Credit
              </div>
            </div>
          </div>

          {/* Controls panel */}
          <div className="rounded-xl border border-border bg-card p-6 xl:col-span-5">
            {selectedCard ? (
              <>
                <h2 className="mb-5 text-sm font-semibold">Card Controls</h2>
                <CardControls card={selectedCard} onUpdate={updateCard} onCancel={cancelCard} />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a card to manage it
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue card dialog */}
      <IssueCardDialog open={issueOpen} onOpenChange={setIssueOpen} onCreate={createCard} />
    </div>
  );
}
