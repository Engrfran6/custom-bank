// components/dashboard/settings-profile.tsx
"use client";

import {useState} from "react";
import {useProfile} from "@/lib/hooks/use-profile";
import {useUpdateProfile} from "@/lib/hooks/use-settings";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {CheckCircle2, Loader2, User} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {countries} from "@/lib/constants";
import {AvatarUpload} from "../avartar-upload";

export function SettingsProfile() {
  // const [profileLoading, setProfileLoading] = useState(false);
  const {profile, isLoading} = useProfile();
  const {update, loading, error, success} = useUpdateProfile();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    date_of_birth: "",
  });

  // Sync profile into form once it loads — using key prop on the form instead of useEffect
  const initialised = profile != null;

  const values = initialised
    ? {
        full_name: form.full_name || profile.full_name || "",
        phone: form.phone || profile.phone || "",
        address: form.address || profile.address || "",
        city: form.city || profile.city || "",
        state: form.state || profile.state || "",
        country: form.country || profile.country || "",
        postal_code: form.postal_code || profile.postal_code || "",
        date_of_birth: form.date_of_birth || profile.date_of_birth || "",
      }
    : form;

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({...prev, [field]: e.target.value}));

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Avatar */}

      <AvatarUpload />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={values.full_name}
            onChange={set("full_name")}
            placeholder="Your full name"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? ""} disabled className="opacity-60" />
          <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={values.phone}
            onChange={set("phone")}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={values.date_of_birth}
            onChange={set("date_of_birth")}
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={values.address}
            onChange={set("address")}
            placeholder="Street address"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={values.city} onChange={set("city")} placeholder="City" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="state">State/Province</Label>
          <Input id="state" value={values.state} onChange={set("state")} placeholder="State" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.country}
            onChange={set("country")}>
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={values.postal_code}
            onChange={set("postal_code")}
            placeholder="Postal code"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <User className="mr-2 h-4 w-4" />
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
