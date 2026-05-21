// components/fraud/fraud-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {AlertTriangle, Shield, Mail, Calendar, Phone, FileText, Ban} from "lucide-react";
import {FraudDetails} from "@/types/database";

interface FraudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fraudDetails: FraudDetails;
  actionName?: string;
}

export function FraudDialog({
  open,
  onOpenChange,
  fraudDetails,
  actionName = "this action",
}: FraudDialogProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:fraud@neobank.dev?subject=Fraud%20Flag%20Appeal";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Ban className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl">Account Restricted</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been restricted due to suspicious activity. You cannot perform{" "}
            {actionName} at this time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Action Blocked
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This action has been blocked because your account is under fraud review.
                </p>
              </div>
            </div>
          </div>

          {/* Fraud Reason */}
          {fraudDetails.fraud_reason && (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-semibold mb-1">Reason for Restriction</p>
              <p className="text-sm text-muted-foreground">{fraudDetails.fraud_reason}</p>
            </div>
          )}

          {/* Additional Details */}
          {fraudDetails.fraud_details && (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-semibold mb-1">Additional Details</p>
              <p className="text-sm text-muted-foreground">{fraudDetails.fraud_details}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2 text-sm border-t pt-4">
            {fraudDetails.fraud_flagged_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Flagged on: {formatDate(fraudDetails.fraud_flagged_at)}</span>
              </div>
            )}
            {fraudDetails.fraud_flagged_by && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Flagged by: {fraudDetails.fraud_flagged_by}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold mb-2">What to do next?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Contact our fraud investigation team</li>
              <li>Provide any requested documentation</li>
              <li>Wait for review completion (typically 24-48 hours)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContactSupport} className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Fraud Team
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="default">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
