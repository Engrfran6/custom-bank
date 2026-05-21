"use client";

import {useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Loader2, Save, Copy, Landmark, Bitcoin} from "lucide-react";
import {usePaymentDetails, useUniversalPaymentDetails} from "@/lib/hooks/use-payment-requests";
import {toast} from "sonner";
import type {PaymentRequest, PaymentDetails, UniversalPaymentDetails} from "@/types/database";

interface Props {
  request: PaymentRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaymentDetailsForm({
  requestId,
  source, // paymentDetails if exists, otherwise universalDetails
  isUsingUniversal,
  saving,
  saveDetails,
  copyLink,
}: {
  requestId: string;
  source: Partial<PaymentDetails> | Partial<UniversalPaymentDetails> | null;
  isUsingUniversal: boolean;
  saving: boolean;
  saveDetails: (
    payload: Omit<PaymentDetails, "id" | "created_at" | "payment_request_id">,
  ) => Promise<void>;
  copyLink: () => void;
}) {
  const [bankDetails, setBankDetails] = useState({
    bank_name: source?.bank_name ?? "",
    account_name: source?.account_name ?? "",
    account_number: source?.account_number ?? "",
    routing_number: source?.routing_number ?? "",
    swift_code: source?.swift_code ?? "",
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    crypto_address: source?.crypto_address ?? "",
    crypto_network: source?.crypto_network ?? "",
  });
  const [instructions, setInstructions] = useState(source?.payment_instructions ?? "");

  const handleSave = async () => {
    try {
      await saveDetails({
        ...bankDetails,
        ...cryptoDetails,
        payment_instructions: instructions,
      });
      toast.success("Payment details saved!");
    } catch {
      toast.error("Failed to save payment details");
    }
  };

  return (
    <>
      {isUsingUniversal && (
        <Badge variant="outline" className="text-xs mb-2 w-fit">
          Pre-filled from universal defaults
        </Badge>
      )}

      <Tabs defaultValue="bank">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" /> Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4" /> Cryptocurrency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                "bank_name",
                "account_name",
                "account_number",
                "routing_number",
                "swift_code",
              ] as const
            ).map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
                <Input
                  value={bankDetails[field]}
                  onChange={(e) => setBankDetails({...bankDetails, [field]: e.target.value})}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <Textarea
              value={cryptoDetails.crypto_address}
              onChange={(e) => setCryptoDetails({...cryptoDetails, crypto_address: e.target.value})}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Network</Label>
            <Input
              value={cryptoDetails.crypto_network}
              onChange={(e) => setCryptoDetails({...cryptoDetails, crypto_network: e.target.value})}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2 mt-4">
        <Label>Additional Payment Instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Payment Details
        </Button>
        <Button variant="outline" onClick={() => {}}>
          Close
        </Button>
      </div>

      <Alert className="mt-4">
        <Copy className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          {typeof window !== "undefined" && `${window.location.origin}/pay/${requestId}`}
          <Button variant="link" size="sm" onClick={copyLink}>
            Copy Link
          </Button>
        </AlertDescription>
      </Alert>
    </>
  );
}

export function PaymentDetailsDialog({request, open, onOpenChange}: Props) {
  const {paymentDetails, saving, saveDetails} = usePaymentDetails(request?.id ?? null);
  const {universalDetails} = useUniversalPaymentDetails();

  const source = paymentDetails ?? universalDetails;
  const isUsingUniversal = !paymentDetails && !!universalDetails?.is_active;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${request?.request_id}`);
    toast.success("Payment link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Payment Details</DialogTitle>
          <DialogDescription>
            {request?.request_id} — {request?.currency} {request?.amount}
          </DialogDescription>
        </DialogHeader>

        {/* ✅ key = paymentDetails?.id + requestId — re-mounts form when request or data changes */}
        {request && (
          <PaymentDetailsForm
            key={`${request.id}-${paymentDetails?.id ?? "universal"}`}
            requestId={request.request_id}
            source={source!}
            isUsingUniversal={isUsingUniversal}
            saving={saving}
            saveDetails={saveDetails}
            copyLink={copyLink}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
