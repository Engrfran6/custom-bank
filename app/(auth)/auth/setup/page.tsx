"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Progress} from "@/components/ui/progress";
import {ChevronRight, ChevronLeft, FileText, Check} from "lucide-react";
import {countries} from "@/lib/constants";

type OnboardingStep = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [saving, setSaving] = useState(false);

  // Stage 1: Basic Info (already have email, now add personal details)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Stage 2: Employment & Financial Info
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [pepStatus, setPepStatus] = useState(false);
  const [taxResidenceCountry, setTaxResidenceCountry] = useState("");

  // Stage 3: ID & KYC (optional - can be done later)
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [isUSCitizen, setIsUSCitizen] = useState(false);
  const [ssn, setSsn] = useState("");
  const [tin, setTin] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: {user},
        error,
      } = await supabase.auth.getUser();

      // ✅ dont redirect to login if there's NO authenticated user
      if (error || !user) {
        router.push("/auth/sign-up");
        return;
      }

      setUserId(user.id);

      // ✅ Fetch full profile to check onboarding status
      const {data: profile, error: profileError} = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // If no profile exists yet, that's fine - new user
      if (!profile || profileError) {
        console.log("No existing profile, new user");
        setLoading(false);
        return;
      }

      // ✅ Populate form with existing data if any
      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setDateOfBirth(profile.date_of_birth || "");
        setAddress(profile.address || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setCountry(profile.country || "");
        setPostalCode(profile.postal_code || "");

        setEmploymentStatus(profile.employment_status || "");
        setEmployerName(profile.employer_name || "");
        setAnnualIncome(profile.annual_income || "");
        setSourceOfFunds(profile.source_of_funds || "");
        setPepStatus(profile.pep_status || false);
        setTaxResidenceCountry(profile.tax_residence_country || "");

        setIdType(profile.id_type || "");
        setIdNumber(profile.id_number || "");
        setIsUSCitizen(profile.is_us_citizen || false);
        setSsn(profile.ssn || "");
        setTin(profile.tin || "");

        // ✅ Determine which step to start from based on completed sections
        const hasCompletedStage1 =
          profile.full_name &&
          profile.phone &&
          profile.date_of_birth &&
          profile.address &&
          profile.country;
        const hasCompletedStage2 =
          profile.employment_status &&
          profile.annual_income &&
          profile.source_of_funds &&
          profile.tax_residence_country;

        if (hasCompletedStage1 && hasCompletedStage2) {
          // Both stages complete, start from stage 3 (optional)
          setCurrentStep(3);
        } else if (hasCompletedStage1) {
          // Stage 1 complete, start from stage 2
          setCurrentStep(2);
        }

        // ✅ Check if onboarding is complete (stage 1 & 2 required)
        const isOnboardingComplete = hasCompletedStage1 && hasCompletedStage2;

        // ✅ Only redirect to dashboard if onboarding is COMPLETE
        if (isOnboardingComplete) {
          router.push("/dashboard");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate stage 1
      if (!fullName || !phone || !dateOfBirth || !address || !country) {
        // You might want to add a toast notification here
        console.log("Missing required fields");
        return;
      }

      setSaving(true);
      try {
        const {error} = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone,
            date_of_birth: dateOfBirth,
            address,
            city,
            state,
            country,
            postal_code: postalCode,
            profile_updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        setCurrentStep(2);
      } catch (error) {
        console.error("Error saving stage 1:", error);
      } finally {
        setSaving(false);
      }
    } else if (currentStep === 2) {
      // Validate stage 2
      if (!employmentStatus || !annualIncome || !sourceOfFunds || !taxResidenceCountry) {
        console.log("Missing required fields");
        return;
      }

      setSaving(true);
      try {
        const {error} = await supabase
          .from("profiles")
          .update({
            employment_status: employmentStatus,
            employer_name: employerName,
            annual_income: annualIncome,
            source_of_funds: sourceOfFunds,
            pep_status: pepStatus,
            tax_residence_country: taxResidenceCountry,
            profile_updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log("Error saving stage 2:", error);

        if (error) throw error;
        setCurrentStep(3);
      } catch (error) {
        console.log("Error saving stage 2:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const {error} = await supabase
        .from("profiles")
        .update({
          id_type: idType || null,
          id_number: idNumber || null,
          is_us_citizen: isUSCitizen,
          ssn: ssn || null,
          tin: tin || null,
          profile_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      // ✅ Redirect to account setup instead of directly to dashboard
      router.push("/auth/account-setup");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // ✅ Also redirect to account setup when skipping optional KYC
    router.push("/auth/account-setup");
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="mb-4">
              <Progress value={(currentStep / 3) * 100} className="h-2" />
            </div>
            <CardTitle className="text-2xl">
              {currentStep === 1 && "Personal Information"}
              {currentStep === 2 && "Employment & Financial Details"}
              {currentStep === 3 && "Identity Verification (Optional)"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself"}
              {currentStep === 2 && "Help us understand your financial profile"}
              {currentStep === 3 && "Verify your identity to unlock all features"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country *</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="employmentStatus">Employment Status *</Label>
                    <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed Full-time</SelectItem>
                        <SelectItem value="part_time">Employed Part-time</SelectItem>
                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(employmentStatus === "employed" ||
                    employmentStatus === "part_time" ||
                    employmentStatus === "self_employed") && (
                    <div className="grid gap-2">
                      <Label htmlFor="employerName">Employer/Business Name</Label>
                      <Input
                        id="employerName"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="annualIncome">Annual Income Range *</Label>
                    <Select value={annualIncome} onValueChange={setAnnualIncome}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-25000">$0 - $25,000</SelectItem>
                        <SelectItem value="25000-50000">$25,000 - $50,000</SelectItem>
                        <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                        <SelectItem value="100000-200000">$100,000 - $200,000</SelectItem>
                        <SelectItem value="200000+">$200,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sourceOfFunds">Source of Funds *</Label>
                    <Select value={sourceOfFunds} onValueChange={setSourceOfFunds}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source of funds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary/Wages</SelectItem>
                        <SelectItem value="business">Business Income</SelectItem>
                        <SelectItem value="investments">Investments</SelectItem>
                        <SelectItem value="inheritance">Inheritance</SelectItem>
                        <SelectItem value="gift">Gift</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="taxResidenceCountry">Tax Residence Country *</Label>
                    <Select value={taxResidenceCountry} onValueChange={setTaxResidenceCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax residence country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pepStatus"
                      checked={pepStatus}
                      onChange={(e) => setPepStatus(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="pepStatus">I am a Politically Exposed Person (PEP)</Label>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                        <SelectItem value="national_id">National ID Card</SelectItem>
                        <SelectItem value="residence_permit">Residence Permit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Enter your ID number"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isUSCitizen"
                      checked={isUSCitizen}
                      onChange={(e) => setIsUSCitizen(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isUSCitizen">I am a US citizen/resident</Label>
                  </div>

                  {isUSCitizen && (
                    <div className="grid gap-2">
                      <Label htmlFor="ssn">SSN (Last 4 digits)</Label>
                      <Input
                        id="ssn"
                        type="password"
                        value={ssn}
                        onChange={(e) => setSsn(e.target.value)}
                        placeholder="XXXX"
                        maxLength={4}
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                    <Input
                      id="tin"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      placeholder="Enter your TIN"
                    />
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <FileText className="inline h-4 w-4 mr-1" />
                      You can complete KYC verification later in your dashboard settings. This step
                      is optional for now.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as OnboardingStep)}
                    disabled={saving}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}

                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="ghost" onClick={handleSkip} disabled={saving}>
                    Skip for now
                  </Button>

                  {currentStep < 3 ? (
                    <Button onClick={handleNext} disabled={saving}>
                      {saving ? "Saving..." : "Continue"}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleComplete} disabled={saving}>
                      {saving ? "Completing..." : "Complete Setup"}
                      <Check className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
