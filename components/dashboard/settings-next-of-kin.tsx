"use client";

import {useState} from "react";
import {useProfile} from "@/lib/hooks/use-profile";
import {useUpdateProfile} from "@/lib/hooks/use-settings";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {CheckCircle2, Loader2, Users} from "lucide-react";

export function SettingsNextOfKin() {
  const {profile, isLoading} = useProfile();
  const {update, loading, error, success} = useUpdateProfile();

  const [form, setForm] = useState({
    next_of_kin_name: "",
    next_of_kin_relationship: "",
    next_of_kin_phone: "",
    next_of_kin_email: "",
    next_of_kin_address: "",
  });

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({...prev, [field]: e.target.value}));

  const values = profile
    ? {
        next_of_kin_name: form.next_of_kin_name || profile.next_of_kin_name || "",
        next_of_kin_relationship:
          form.next_of_kin_relationship || profile.next_of_kin_relationship || "",
        next_of_kin_phone: form.next_of_kin_phone || profile.next_of_kin_phone || "",
        next_of_kin_email: form.next_of_kin_email || profile.next_of_kin_email || "",
        next_of_kin_address: form.next_of_kin_address || profile.next_of_kin_address || "",
      }
    : form;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="next_of_kin_name">Full Name</Label>
          <Input
            id="next_of_kin_name"
            value={values.next_of_kin_name}
            onChange={set("next_of_kin_name")}
            placeholder="John Doe"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="next_of_kin_relationship">Relationship</Label>
          <select
            id="next_of_kin_relationship"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.next_of_kin_relationship}
            onChange={set("next_of_kin_relationship")}>
            <option value="">Select relationship</option>
            <option value="spouse">Spouse</option>
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="sibling">Sibling</option>
            <option value="relative">Relative</option>
            <option value="friend">Friend</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="next_of_kin_phone">Phone Number</Label>
          <Input
            id="next_of_kin_phone"
            value={values.next_of_kin_phone}
            onChange={set("next_of_kin_phone")}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="next_of_kin_email">Email Address</Label>
          <Input
            id="next_of_kin_email"
            type="email"
            value={values.next_of_kin_email}
            onChange={set("next_of_kin_email")}
            placeholder="john@example.com"
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="next_of_kin_address">Address</Label>
          <Input
            id="next_of_kin_address"
            value={values.next_of_kin_address}
            onChange={set("next_of_kin_address")}
            placeholder="Full address"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </span>
        )}
      </div>
    </form>
  );
}
