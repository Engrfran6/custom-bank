"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {ReceiveDialog} from "@/components/dashboard/receive-dialog";
import {useState} from "react";
import {ArrowLeft} from "lucide-react";
import Link from "next/link";

export default function ReceivePage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("account");
  const accountNumber = searchParams.get("number");
  const [open, setOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
          GoBack
        </Link>
      </div>

      <ReceiveDialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            router.back();
          }
        }}
        accountId={accountId || undefined}
        accountNumber={accountNumber || undefined}
      />
    </div>
  );
}
