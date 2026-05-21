"use client";

import {useState} from "react";
import {
  Shield,
  AlertTriangle,
  CreditCard,
  Lock,
  Mail,
  Scale,
  Smartphone,
  User,
  Flag,
  ChevronRight,
  Upload,
  X,
  CheckCircle2,
  Phone,
  Clock,
  Eye,
  ArrowLeft,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {useReports} from "@/lib/hooks/use-reports";
import {useProfile} from "@/lib/hooks/use-profile";

const reportCategories = [
  {
    id: "fraud",
    label: "Report Fraud",
    description: "Unauthorized account access",
    icon: Shield,
    color: "bg-red-500",
    urgency: "Urgent",
  },
  {
    id: "unauthorized_transaction",
    label: "Unauthorized Transaction",
    description: "Transaction you didn't authorize",
    icon: CreditCard,
    color: "bg-orange-500",
    urgency: "High",
  },
  {
    id: "suspicious_activity",
    label: "Suspicious Activity",
    description: "Unusual behavior on your account",
    icon: AlertTriangle,
    color: "bg-yellow-500",
    urgency: "Medium",
  },
  {
    id: "account_takeover",
    label: "Account Takeover",
    description: "Someone else accessed your account",
    icon: Lock,
    color: "bg-red-600",
    urgency: "Urgent",
  },
  {
    id: "phishing",
    label: "Phishing Attempt",
    description: "Suspicious emails or messages",
    icon: Mail,
    color: "bg-purple-500",
    urgency: "Medium",
  },
  {
    id: "dispute",
    label: "Transaction Dispute",
    description: "Charge not recognized",
    icon: Scale,
    color: "bg-blue-500",
    urgency: "Medium",
  },
  {
    id: "lost_stolen_card",
    label: "Lost/Stolen Card",
    description: "Physical card lost or stolen",
    icon: Smartphone,
    color: "bg-cyan-500",
    urgency: "Urgent",
  },
  {
    id: "identity_theft",
    label: "Identity Theft",
    description: "Someone using your identity",
    icon: User,
    color: "bg-indigo-500",
    urgency: "High",
  },
  {
    id: "other",
    label: "Other Security Concern",
    description: "Other security issues",
    icon: Flag,
    color: "bg-gray-500",
    urgency: "Low",
  },
];

export default function ReportPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("fraud");
  const {reports, loading, submitReport} = useReports();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    category: "fraud" as string,
    description: "",
    amount: "",
    transactionId: "",
    dateOccurred: "",
    urgentContact: false,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const {user} = useProfile();

  const handleSubmitReport = async () => {
    // Fix validation logic
    if (!user) {
      setSubmitError("You must be logged in to submit a report");
      return;
    }

    if (!newReport.description || !newReport.dateOccurred) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const {error} = await submitReport({
      category: selectedCategory,
      description: newReport.description,
      amount: newReport.amount ? parseFloat(newReport.amount) : undefined,
      transaction_id: newReport.transactionId || undefined,
      date_occurred: newReport.dateOccurred,
      urgent_contact: newReport.urgentContact,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    // Success - reset form
    setSubmitSuccess(true);
    setNewReport({
      category: "fraud",
      description: "",
      amount: "",
      transactionId: "",
      dateOccurred: "",
      urgentContact: false,
    });
    setAttachments([]);

    // Don't call notify.reportReceived here - it should be handled server-side
    // or you need to implement it properly

    setTimeout(() => {
      setSubmitSuccess(false);
      setShowForm(false);
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === "Urgent") return "bg-red-500/10 text-red-600";
    if (urgency === "High") return "bg-orange-500/10 text-orange-600";
    if (urgency === "Medium") return "bg-yellow-500/10 text-yellow-600";
    return "bg-blue-500/10 text-blue-600";
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 mx-auto">
      {/* Emergency Banner */}
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-600">Security Emergency?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Call our 24/7 Fraud Hotline immediately:{" "}
              <strong className="text-red-600">+1 (555) 123-4567</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Security Report Center</h1>
        <p className="text-sm text-muted-foreground">
          Report fraud, disputes, and security incidents
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-lg bg-red-500 p-2">
            <Phone className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Emergency Hotline</p>
            <p className="text-sm font-semibold">+1 (555) 123-4567</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-red-500">
            <Clock className="h-3 w-3" />
            24/7
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-lg bg-blue-500 p-2">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Security Email</p>
            <p className="text-sm font-semibold">security@neobank.com</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!showForm && (
        <>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setShowForm(true);
                  }}
                  className="group rounded-lg border border-border bg-card p-4 text-left hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-lg p-2", category.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{category.label}</p>
                        <span
                          className={cn(
                            "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                            getUrgencyColor(category.urgency),
                          )}>
                          {category.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
            <div className="flex gap-2">
              <Eye className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                All reports are confidential and investigated by our security team within 24 hours.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {loading && !showForm && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Report Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {submitSuccess ? (
            <div className="flex flex-col items-center p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="mt-3 font-semibold">Report Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Our security team will investigate and contact you within 24 hours.
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm">
                Back to Report Center
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">File a Report</h2>
                  <p className="text-xs text-muted-foreground">Provide details for investigation</p>
                </div>
                <div
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    getUrgencyColor(
                      reportCategories.find((c) => c.id === selectedCategory)?.urgency || "Low",
                    ),
                  )}>
                  {reportCategories.find((c) => c.id === selectedCategory)?.urgency} Priority
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Transaction ID (conditional) */}
              {(selectedCategory === "unauthorized_transaction" ||
                selectedCategory === "dispute") && (
                <div>
                  <label className="text-sm font-medium">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={newReport.transactionId}
                    onChange={(e) => setNewReport({...newReport, transactionId: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., TXN-123456789"
                  />
                </div>
              )}

              {/* Amount (conditional) */}
              {(selectedCategory === "unauthorized_transaction" ||
                selectedCategory === "dispute" ||
                selectedCategory === "fraud") && (
                <div>
                  <label className="text-sm font-medium">Amount Involved (Optional)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={newReport.amount}
                      onChange={(e) => setNewReport({...newReport, amount: e.target.value})}
                      className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Date Occurred */}
              <div>
                <label className="text-sm font-medium">Date of Incident *</label>
                <input
                  type="date"
                  value={newReport.dateOccurred}
                  onChange={(e) => setNewReport({...newReport, dateOccurred: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">Detailed Description *</label>
                <textarea
                  rows={6}
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                  placeholder="Please provide as much detail as possible..."
                  required
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="text-sm font-medium">Supporting Evidence</label>
                <div className="mt-1 rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachments"
                    className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload evidence</p>
                    <p className="text-xs text-muted-foreground">
                      Screenshots, PDFs, or images (max 10MB)
                    </p>
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm bg-background p-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <button
                            onClick={() =>
                              setAttachments(attachments.filter((_, i) => i !== index))
                            }
                            className="text-red-500 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Urgent Contact */}
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newReport.urgentContact}
                  onChange={(e) => setNewReport({...newReport, urgentContact: e.target.checked})}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div>
                  <p className="text-sm font-medium">Request urgent contact</p>
                  <p className="text-xs text-muted-foreground">
                    Security team will call within 30 minutes
                  </p>
                </div>
              </label>

              <button
                onClick={handleSubmitReport}
                disabled={!newReport.description || !newReport.dateOccurred || submitting}
                className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Existing Reports */}
      {reports.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Your Reports</h3>
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-xs text-muted-foreground">{report.reference}</p>
                  <p className="mt-1 text-sm line-clamp-2">{report.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reported {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium ml-4",
                    report.status === "under_review" && "bg-yellow-500/10 text-yellow-600",
                    report.status === "investigating" && "bg-red-500/10 text-red-600",
                    report.status === "resolved" && "bg-green-500/10 text-green-600",
                  )}>
                  {report.status === "under_review" && "Under Review"}
                  {report.status === "investigating" && "Investigating"}
                  {report.status === "resolved" && "Resolved"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
