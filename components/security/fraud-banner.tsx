// components/fraud/fraud-banner.tsx
"use client";

import {AlertTriangle, Mail} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {useProfile} from "@/lib/hooks/use-profile";

export function FraudBanner() {
  const {isFraudFlagged, fraudInfo} = useProfile();

  if (!isFraudFlagged) return null;

  return (
    <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/20">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Account Restricted</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Your account has been restricted due to suspicious activity. Financial actions are
          temporarily disabled.
        </p>
        {fraudInfo?.fraud_reason && (
          <p className="text-sm mt-1">
            <strong>Reason:</strong> {fraudInfo.fraud_reason}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() =>
              (window.location.href = `mailto:${process.env.NEXT_PUBLIC_FRAUD_EMAIL}`)
            }>
            <Mail className="h-3 w-3" />
            Contact Fraud Team
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
