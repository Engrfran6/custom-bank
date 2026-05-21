"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {TransferDialog} from "@/components/dashboard/transfer-dialog";
import {useState} from "react";
import {ArrowLeft} from "lucide-react";
import Link from "next/link";

export default function TransferPage() {
  const searchParams = useSearchParams();
  const fromAccountId = searchParams.get("from");
  const amount = searchParams.get("amount");
  const [open, setOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <TransferDialog
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) {
              router.back();
            }
          }}
          fromAccountId={fromAccountId || undefined}
          // toAccountId={toAccountId || undefined}
          preselectedAmount={amount ? parseFloat(amount) : undefined}
          onSuccess={() => {
            // Optional: Add success tracking or redirect with success message
            setTimeout(() => {
              window.location.href = "/dashboard?transfer=success";
            }, 1500);
          }}
        />
      </div>
    </div>
  );
}
