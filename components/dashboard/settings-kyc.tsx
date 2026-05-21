"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client-with-offline";
import {useProfile} from "@/lib/hooks/use-profile";
import {useUpdateProfile} from "@/lib/hooks/use-settings";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {CheckCircle2, Loader2, FileCheck, Upload} from "lucide-react";

export function SettingsKyc() {
  const supabase = createClient();
  const {profile, isLoading} = useProfile();
  const {update, loading, error, success} = useUpdateProfile();
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    id_type: "",
    id_number: "",
    is_us_citizen: false,
    ssn: "",
  });

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({...prev, [field]: e.target.value}));

  const values = profile
    ? {
        id_type: form.id_type || profile.id_type || "",
        id_number: form.id_number || profile.id_number || "",
        is_us_citizen: form.is_us_citizen || profile.is_us_citizen || false,
        ssn: form.ssn || profile.ssn || "",
      }
    : form;

  const handleIdUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile?.id}/id-document-${Date.now()}.${fileExt}`;

      const {error: uploadError} = await supabase.storage
        .from("kyc-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: {publicUrl},
      } = supabase.storage.from("kyc-documents").getPublicUrl(filePath);

      update({
        id_document_url: publicUrl,
        kyc_submitted_at: new Date().toISOString(),
        kyc_status: "pending",
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({
      ...values,
      kyc_submitted_at: new Date().toISOString(),
      kyc_status: "pending",
    });
  };

  const getKycStatusBadge = () => {
    switch (profile?.kyc_status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Verification Status</p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.kyc_status === "verified"
                  ? "Your identity has been verified"
                  : profile?.kyc_status === "pending"
                    ? "Your documents are being reviewed"
                    : "Complete KYC to unlock all features"}
              </p>
            </div>
            {getKycStatusBadge()}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="id_type">ID Type</Label>
          <select
            id="id_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.id_type}
            onChange={set("id_type")}>
            <option value="">Select ID type</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver&apos;s License</option>
            <option value="national_id">National ID Card</option>
            <option value="residence_permit">Residence Permit</option>
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="id_number">ID Number</Label>
          <Input
            id="id_number"
            value={values.id_number}
            onChange={set("id_number")}
            placeholder="Enter ID number"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_us_citizen"
          checked={values.is_us_citizen}
          onChange={(e) => setForm((prev) => ({...prev, is_us_citizen: e.target.checked}))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_us_citizen">I am a US citizen or resident</Label>
      </div>

      {values.is_us_citizen && (
        <div className="grid gap-1.5">
          <Label htmlFor="ssn">SSN (Last 4 digits)</Label>
          <Input
            id="ssn"
            type="password"
            maxLength={4}
            value={values.ssn}
            onChange={set("ssn")}
            placeholder="XXXX"
          />
        </div>
      )}

      <div className="grid gap-1.5">
        <Label>Upload ID Document</Label>
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" disabled={uploading} className="relative">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Document"}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleIdUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
          {profile?.id_document_url && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Document uploaded
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF. Max 5MB.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || profile?.kyc_status === "verified"}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileCheck className="mr-2 h-4 w-4" />
          )}
          Submit for Verification
        </Button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Submitted successfully
          </span>
        )}
      </div>
    </form>
  );
}
