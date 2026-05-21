// components/auth/suspension-dialog.tsx
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
import {AlertCircle, Shield, Mail, Calendar} from "lucide-react";
import {SuspensionDetails} from "@/types/database";

interface SuspensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspensionDetails: SuspensionDetails;
  email?: string;
}

export function SuspensionDialog({
  open,
  onOpenChange,
  suspensionDetails,
  email,
}: SuspensionDialogProps) {
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

  if (!suspensionDetails) return null;

  const handleContactSupport = () => {
    window.location.href = `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}?subject=Account%20Suspension%20Appeal`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl">Account Suspended</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been temporarily suspended. Please contact support for assistance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason */}
          {suspensionDetails?.suspension_reason && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Reason for Suspension
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {suspensionDetails.suspension_reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          {suspensionDetails.suspension_details && (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium mb-1">Additional Details</p>
              <p className="text-sm text-muted-foreground">
                {suspensionDetails.suspension_details}
              </p>
            </div>
          )}

          {/* Account Info */}
          <div className="space-y-2 text-sm">
            {email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
            )}
            {suspensionDetails.suspended_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Suspended on: {formatDate(suspensionDetails.suspended_at)}</span>
              </div>
            )}
            {suspensionDetails.suspended_by && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Suspended by: {suspensionDetails.suspended_by}</span>
              </div>
            )}
          </div>

          {/* Appeal Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold mb-2">How to appeal?</p>
            <p className="text-sm text-muted-foreground mb-3">
              If you believe this suspension was made in error, please contact our support team to
              appeal this decision. Provide your account email and any relevant information.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContactSupport} className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="default">
            Return to Home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
