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
import {Loader2, Save, Globe, Landmark, Bitcoin} from "lucide-react";
import {useUniversalPaymentDetails} from "@/lib/hooks/use-payment-requests";
import {toast} from "sonner";
import type {UniversalPaymentDetails} from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ✅ Inner form gets universalDetails as a prop and initialises state once
// Re-mounts via key={universalDetails?.id} when data loads
function UniversalPaymentForm({
  universalDetails,
  saving,
  saveUniversal,
  onClose,
}: {
  universalDetails: UniversalPaymentDetails | null | undefined;
  saving: boolean;
  saveUniversal: (payload: Partial<UniversalPaymentDetails>) => Promise<void>;
  onClose: () => void;
}) {
  const [bankDetails, setBankDetails] = useState({
    bank_name: universalDetails?.bank_name ?? "",
    account_name: universalDetails?.account_name ?? "",
    account_number: universalDetails?.account_number ?? "",
    routing_number: universalDetails?.routing_number ?? "",
    swift_code: universalDetails?.swift_code ?? "",
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    crypto_address: universalDetails?.crypto_address ?? "",
    crypto_network: universalDetails?.crypto_network ?? "",
  });
  const [instructions, setInstructions] = useState(universalDetails?.payment_instructions ?? "");
  const [isActive, setIsActive] = useState(universalDetails?.is_active ?? true);

  const handleSave = async () => {
    try {
      await saveUniversal({
        ...bankDetails,
        ...cryptoDetails,
        payment_instructions: instructions,
        is_active: isActive,
      });
      toast.success("Universal payment details saved!");
      onClose();
    } catch {
      toast.error("Failed to save universal payment details");
    }
  };

  return (
    <>
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
        <Label>Default Payment Instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="universalActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="universalActive" className="text-sm font-normal">
          Enable universal payment details as fallback
        </Label>
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </>
  );
}

export function UniversalPaymentDialog({open, onOpenChange}: Props) {
  const {universalDetails, saving, saveUniversal} = useUniversalPaymentDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Universal Payment Settings
          </DialogTitle>
          <DialogDescription>
            Fallback payment details used for any request without its own configuration.
          </DialogDescription>
        </DialogHeader>

        {/* ✅ key forces re-mount when data loads — no useEffect needed */}
        <UniversalPaymentForm
          key={universalDetails?.id ?? "empty"}
          universalDetails={universalDetails}
          saving={saving}
          saveUniversal={saveUniversal}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
