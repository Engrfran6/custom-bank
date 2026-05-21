"use client";

import {useState} from "react";
import {useProfile} from "@/lib/hooks/use-profile";
import {useUpdateProfile} from "@/lib/hooks/use-settings";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {CheckCircle2, Loader2, Briefcase} from "lucide-react";
import {countries} from "@/lib/constants";

export function SettingsEmployment() {
  const {profile, isLoading} = useProfile();
  const {update, loading, error, success} = useUpdateProfile();

  const [form, setForm] = useState({
    employment_status: "",
    employer_name: "",
    annual_income: "",
    source_of_funds: "",
    pep_status: false,
    tax_residence_country: "",
    tin: "",
  });

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({...prev, [field]: e.target.value}));

  const values = profile
    ? {
        employment_status: form.employment_status || profile.employment_status || "",
        employer_name: form.employer_name || profile.employer_name || "",
        annual_income: form.annual_income || profile.annual_income || "",
        source_of_funds: form.source_of_funds || profile.source_of_funds || "",
        pep_status: form.pep_status || profile.pep_status || false,
        tax_residence_country: form.tax_residence_country || profile.tax_residence_country || "",
        tin: form.tin || profile.tin || "",
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
          <Label htmlFor="employment_status">Employment Status</Label>
          <select
            id="employment_status"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.employment_status}
            onChange={set("employment_status")}>
            <option value="">Select status</option>
            <option value="employed">Employed Full-time</option>
            <option value="part_time">Employed Part-time</option>
            <option value="self_employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="retired">Retired</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="employer_name">Employer/Business Name</Label>
          <Input
            id="employer_name"
            value={values.employer_name}
            onChange={set("employer_name")}
            placeholder="Company name"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="annual_income">Annual Income Range</Label>
          <select
            id="annual_income"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.annual_income}
            onChange={set("annual_income")}>
            <option value="">Select income range</option>
            <option value="0-25000">$0 - $25,000</option>
            <option value="25000-50000">$25,000 - $50,000</option>
            <option value="50000-100000">$50,000 - $100,000</option>
            <option value="100000-200000">$100,000 - $200,000</option>
            <option value="200000+">$200,000+</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="source_of_funds">Source of Funds</Label>
          <select
            id="source_of_funds"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.source_of_funds}
            onChange={set("source_of_funds")}>
            <option value="">Select source</option>
            <option value="salary">Salary/Wages</option>
            <option value="business">Business Income</option>
            <option value="investments">Investments</option>
            <option value="inheritance">Inheritance</option>
            <option value="gift">Gift</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tax_residence_country">Tax Residence Country</Label>
          <select
            id="tax_residence_country"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.tax_residence_country}
            onChange={set("tax_residence_country")}>
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
          <Input id="tin" value={values.tin} onChange={set("tin")} placeholder="TIN" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pep_status"
          checked={values.pep_status}
          onChange={(e) => setForm((prev) => ({...prev, pep_status: e.target.checked}))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="pep_status">I am a Politically Exposed Person (PEP)</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Briefcase className="mr-2 h-4 w-4" />
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
