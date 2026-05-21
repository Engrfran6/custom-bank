"use client";

import {useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import {toast} from "sonner";
import type {PaymentRequest} from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    requester_name: string;
    amount: string;
    currency: string;
    purpose: string;
    expires_in_days: string;
  }) => Promise<PaymentRequest>;
  creating: boolean;
  onCreated: (request: PaymentRequest) => void;
}

const EMPTY_FORM = {
  requester_name: "",
  amount: "",
  currency: "USD",
  purpose: "",
  expires_in_days: "7",
};

export function CreateRequestDialog({open, onOpenChange, onCreate, creating, onCreated}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);

  const handleCreate = async () => {
    if (!form.requester_name || !form.amount || !form.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const created = await onCreate(form);
      toast.success("Payment request created!");
      setForm(EMPTY_FORM);
      onOpenChange(false);
      onCreated(created);
    } catch {
      toast.error("Failed to create payment request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Request</DialogTitle>
          <DialogDescription>Create a new payment request with a shareable link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Requester Name *</Label>
            <Input
              value={form.requester_name}
              onChange={(e) => setForm({...form, requester_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              value={form.amount}
              step="0.01"
              onChange={(e) => setForm({...form, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={form.currency}
              onChange={(e) => setForm({...form, currency: e.target.value})}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Textarea
              value={form.purpose}
              rows={3}
              onChange={(e) => setForm({...form, purpose: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Expires In</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={form.expires_in_days}
              onChange={(e) => setForm({...form, expires_in_days: e.target.value})}>
              {["1", "3", "7", "14", "30"].map((d) => (
                <option key={d} value={d}>
                  {d} {d === "1" ? "day" : "days"}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
