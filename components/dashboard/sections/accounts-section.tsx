"use client";

import {useMounted} from "@/lib/hooks/use-mounted"; // ← replaces useState+useEffect
import {AccountCard} from "../account-card";
import {AccountCardMobile} from "../account-card-mobile";
import {AccountCardSkeleton} from "../skeleton";
import {Wallet, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import type {Account} from "@/types/database";

interface Props {
  accounts: Account[];
  loading: boolean;
}

function AccountsSkeleton() {
  return (
    <>
      <AccountCardSkeleton />
      <AccountCardSkeleton />
      <AccountCardSkeleton />
    </>
  );
}

export function AccountsSection({accounts, loading}: Props) {
  const mounted = useMounted();

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Your Accounts</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {!mounted || loading ? (
          <AccountsSkeleton />
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No accounts found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block space-y-3">
              {accounts.slice(0, 3).map((a) => (
                <AccountCard key={a.id} account={a} />
              ))}
            </div>
            <div className="md:hidden space-y-3">
              {accounts.slice(0, 3).map((a) => (
                <AccountCardMobile key={a.id} account={a} />
              ))}
            </div>
          </>
        )}
        {mounted && accounts.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View All Accounts →
          </Button>
        )}
      </div>
    </div>
  );
}
