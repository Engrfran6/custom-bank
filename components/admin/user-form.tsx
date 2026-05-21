// components/admin/UserForm.tsx
"use client";

import {useState, useEffect} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Loader2} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import type {Profile} from "@/types/database";

interface UserFormProps {
  user: Profile | null;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

export function UserForm({
  user,
  onSubmit,
  onCancel,
  loading = false,
  readOnly = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (user) {
      const data = () => {
        setFormData(user);
      };
      data();
    }
  }, [user]);

  const handleChange = (
    field: keyof Profile,
    value: string | number | boolean | Date | null | undefined,
  ) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!user) return null;

  const getKycBadge = (status: string) => {
    const colors = {
      verified: "bg-emerald-100 text-emerald-700",
      pending: "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-7">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="id">ID/KYC</TabsTrigger>
          <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
          <TabsTrigger value="employment" className="hidden lg:block">
            Employment
          </TabsTrigger>
          <TabsTrigger value="compliance" className="hidden lg:block">
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name || ""}
                onChange={(e) => handleChange("full_name", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={formData.email || ""} readOnly disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role || "user"}
                onValueChange={(value) => handleChange("role", value)}
                disabled={readOnly}>
                <SelectTrigger className={readOnly ? "bg-muted" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="fraud_analyst">Fraud Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>KYC Status</Label>
              <Select
                value={formData.kyc_status || "pending"}
                onValueChange={(value) => handleChange("kyc_status", value)}
                disabled={readOnly}>
                <SelectTrigger className={readOnly ? "bg-muted" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <Badge
                className={cn("w-fit", formData.is_suspended ? "bg-red-500" : "bg-emerald-500")}>
                {formData.is_suspended ? "Suspended" : "Active"}
              </Badge>
            </div>
          </div>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state || ""}
                onChange={(e) => handleChange("state", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country || ""}
                onChange={(e) => handleChange("country", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={formData.postal_code || ""}
                onChange={(e) => handleChange("postal_code", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          </div>
        </TabsContent>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth?.split("T")[0] || ""}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>SSN (Last 4 digits)</Label>
              <Input
                type="password"
                value={formData.ssn || ""}
                onChange={(e) => handleChange("ssn", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
                placeholder="XXX-XX-1234"
              />
            </div>
            <div className="space-y-2">
              <Label>US Citizen</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={formData.is_us_citizen || false}
                  onCheckedChange={(checked) => handleChange("is_us_citizen", checked)}
                  disabled={readOnly}
                />
                <Label>{formData.is_us_citizen ? "Yes" : "No"}</Label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ID/KYC Tab */}
        <TabsContent value="id" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select
                value={formData.id_type || ""}
                onValueChange={(value) => handleChange("id_type", value)}
                disabled={readOnly}>
                <SelectTrigger className={readOnly ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={formData.id_number || ""}
                onChange={(e) => handleChange("id_number", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ID Document URL</Label>
              <Input
                value={formData.id_document_url || ""}
                onChange={(e) => handleChange("id_document_url", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
                placeholder="https://..."
              />
            </div>
            {formData.id_verified_at && (
              <div className="space-y-2">
                <Label>ID Verified At</Label>
                <Input
                  value={new Date(formData.id_verified_at).toLocaleString()}
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Next of Kin Tab */}
        <TabsContent value="nextofkin" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.next_of_kin_name || ""}
                onChange={(e) => handleChange("next_of_kin_name", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input
                value={formData.next_of_kin_relationship || ""}
                onChange={(e) => handleChange("next_of_kin_relationship", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.next_of_kin_phone || ""}
                onChange={(e) => handleChange("next_of_kin_phone", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.next_of_kin_email || ""}
                onChange={(e) => handleChange("next_of_kin_email", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={formData.next_of_kin_address || ""}
                onChange={(e) => handleChange("next_of_kin_address", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
                rows={2}
              />
            </div>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select
                value={formData.employment_status || ""}
                onValueChange={(value) => handleChange("employment_status", value)}
                disabled={readOnly}>
                <SelectTrigger className={readOnly ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employer Name</Label>
              <Input
                value={formData.employer_name || ""}
                onChange={(e) => handleChange("employer_name", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Income</Label>
              <Select
                value={formData.annual_income || ""}
                onValueChange={(value) => handleChange("annual_income", value)}
                disabled={readOnly}>
                <SelectTrigger className={readOnly ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<50k">&lt; $50,000</SelectItem>
                  <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                  <SelectItem value="100k-200k">$100,000 - $200,000</SelectItem>
                  <SelectItem value=">200k">&gt; $200,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source of Funds</Label>
              <Input
                value={formData.source_of_funds || ""}
                onChange={(e) => handleChange("source_of_funds", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>PEP Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={formData.pep_status || false}
                  onCheckedChange={(checked) => handleChange("pep_status", checked)}
                  disabled={readOnly}
                />
                <Label>{formData.pep_status ? "Yes" : "No"}</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tax Residence Country</Label>
              <Input
                value={formData.tax_residence_country || ""}
                onChange={(e) => handleChange("tax_residence_country", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>TIN (Tax ID Number)</Label>
              <Input
                value={formData.tin || ""}
                onChange={(e) => handleChange("tin", e.target.value)}
                readOnly={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </form>
  );
}
