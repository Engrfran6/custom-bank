"use client";

import {useState} from "react";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  ChevronRight,
  X,
  CheckCircle2,
  HelpCircle,
  FileText,
  Shield,
  CreditCard,
  Smartphone,
  User,
  Upload,
  Search,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";

import {useSupportTickets} from "@/lib/hooks/use-support-tickets";
import {useChatContext} from "@/lib/context/chat-context";

// Types
type TicketCategory = "transaction" | "account" | "card" | "security" | "other";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  message: string;
  attachments?: File[];
  createdAt: Date;
  updatedAt: Date;
  reference: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

// Mock data
const faqs: FAQItem[] = [
  {
    id: "1",
    category: "account",
    question: "How do I reset my password?",
    answer:
      "Go to login page and click 'Forgot Password'. Follow the instructions sent to your email to reset your password.",
    helpful: 128,
    notHelpful: 12,
  },
  {
    id: "2",
    category: "account",
    question: "How do I update my personal information?",
    answer:
      "Navigate to Settings > Profile Information. You can update your name, email, phone number, and address there.",
    helpful: 95,
    notHelpful: 8,
  },
  {
    id: "3",
    category: "transaction",
    question: "Why is my transaction pending?",
    answer:
      "Transactions may be pending for 1-3 business days due to security checks or processing times. Contact support if it exceeds 5 days.",
    helpful: 203,
    notHelpful: 15,
  },
  {
    id: "4",
    category: "transaction",
    question: "How do I cancel a transaction?",
    answer:
      "Only pending transactions can be cancelled. Go to Transactions, find the transaction, and click 'Cancel' if available.",
    helpful: 67,
    notHelpful: 23,
  },
  {
    id: "5",
    category: "card",
    question: "My card was lost/stolen. What should I do?",
    answer:
      "Immediately freeze your card in the app under Cards > Freeze Card. Then report it as lost/stolen to issue a replacement.",
    helpful: 156,
    notHelpful: 9,
  },
  {
    id: "6",
    category: "card",
    question: "How do I increase my daily limit?",
    answer:
      "Go to Cards > Settings > Daily Limit. You can request an increase which will be reviewed within 24 hours.",
    helpful: 89,
    notHelpful: 14,
  },
  {
    id: "7",
    category: "security",
    question: "How do I enable two-factor authentication?",
    answer:
      "Go to Settings > Security > Two-Factor Authentication. Follow the setup guide to add an extra layer of security.",
    helpful: 234,
    notHelpful: 5,
  },
  {
    id: "8",
    category: "security",
    question: "I received a suspicious email. Is it from NeoBank?",
    answer:
      "NeoBank will never ask for your password or PIN via email. Forward suspicious emails to security@neobank.com.",
    helpful: 178,
    notHelpful: 7,
  },
];

const categories = [
  {id: "transaction", label: "Transaction Issue", icon: CreditCard, color: "bg-blue-500"},
  {id: "account", label: "Account Issue", icon: User, color: "bg-emerald-500"},
  {id: "card", label: "Card Issue", icon: Smartphone, color: "bg-violet-500"},
  {id: "security", label: "Security Concern", icon: Shield, color: "bg-amber-500"},
  {id: "other", label: "Other Inquiry", icon: HelpCircle, color: "bg-slate-500"},
];

const priorities = [
  {id: "low", label: "Low", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"},
  {id: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"},
  {id: "high", label: "High", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"},
  {id: "urgent", label: "Urgent", color: "bg-red-500/10 text-red-600 dark:text-red-400"},
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "tickets" | "new">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "transaction" as TicketCategory,
    priority: "medium" as TicketPriority,
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const {tickets, error, submitTicket} = useSupportTickets();
  const {setIsOpen: setChatOpen} = useChatContext();

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFaqHelpful = (faqId: string, helpful: boolean) => {
    // API call would go here
    console.log(`FAQ ${faqId} marked as ${helpful ? "helpful" : "not helpful"}`);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.message) return;
    setSubmitting(true);
    await submitTicket({
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      message: newTicket.message,
    });
    setSubmitting(false);
    if (!error) {
      setSubmitSuccess(true);
      setNewTicket({subject: "", category: "transaction", priority: "medium", message: ""});
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("tickets");
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Help & Support Center</h1>
        <p className="text-sm text-muted-foreground">
          Get help, report issues, or contact our support team
        </p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Live Chat</p>
            <p className="text-sm font-semibold">Available 24/7</p>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="ml-auto rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90">
            Chat Now
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Mail className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email Support</p>
            <p className="text-sm font-semibold">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</p>
          </div>
          <button
            onClick={() => (window.location.href = "mailto:support@neobank.com")}
            className="ml-auto rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted">
            Email
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <Phone className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Phone Support</p>
            <p className="text-sm font-semibold">{process.env.NEXT_PUBLIC_SUPPORT_PHONE}</p>
          </div>
          <div className="flex items-center gap-0.5 ml-auto text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            24/7
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("faq")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative",
            activeTab === "faq"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}>
          FAQ
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative",
            activeTab === "tickets"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}>
          My Tickets
          {tickets.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
              {tickets.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("new")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all relative",
            activeTab === "new"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}>
          New Ticket
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-2">
            {filteredFaqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No FAQs found</p>
                <button
                  onClick={() => setActiveTab("new")}
                  className="mt-2 text-sm text-primary hover:underline">
                  Submit a ticket instead
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                              categories.find((c) => c.id === faq.category)?.color ===
                                "bg-blue-500" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                              categories.find((c) => c.id === faq.category)?.color ===
                                "bg-emerald-500" &&
                                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              categories.find((c) => c.id === faq.category)?.color ===
                                "bg-violet-500" &&
                                "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                              categories.find((c) => c.id === faq.category)?.color ===
                                "bg-amber-500" &&
                                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                              categories.find((c) => c.id === faq.category)?.color ===
                                "bg-slate-500" &&
                                "bg-slate-500/10 text-slate-600 dark:text-slate-400",
                            )}>
                            {faq.category}
                          </div>
                        </div>
                        <p className="mt-2 font-medium text-foreground">{faq.question}</p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          expandedFaq === faq.id && "rotate-90",
                        )}
                      />
                    </div>
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="border-t border-border p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <p className="text-xs text-muted-foreground">Was this helpful?</p>
                        <button
                          onClick={() => handleFaqHelpful(faq.id, true)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          Yes ({faq.helpful})
                        </button>
                        <button
                          onClick={() => handleFaqHelpful(faq.id, false)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                          <ThumbsDown className="h-3 w-3" />
                          No ({faq.notHelpful})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">No tickets yet</p>
              <p className="text-xs text-muted-foreground">Submit a ticket to get support</p>
              <button
                onClick={() => setActiveTab("new")}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                Create New Ticket
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs text-muted-foreground">{ticket.reference}</p>
                      <div
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          ticket.status === "open" &&
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          ticket.status === "in_progress" &&
                            "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                          ticket.status === "resolved" &&
                            "bg-green-500/10 text-green-600 dark:text-green-400",
                          ticket.status === "closed" &&
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400",
                        )}>
                        {ticket.status.replace("_", " ")}
                      </div>
                      {priorities.find((p) => p.id === ticket.priority) && (
                        <div
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            priorities.find((p) => p.id === ticket.priority)?.color,
                          )}>
                          {ticket.priority}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 font-medium text-foreground">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {ticket.message}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Created {ticket.created_at.toString()}
                    </p>
                  </div>
                  <button className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Ticket Tab */}
      {activeTab === "new" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="mt-3 font-semibold text-lg">Ticket Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                Your support request has been sent. You&apos;ll receive updates via email.
              </p>
              <button
                onClick={() => setActiveTab("tickets")}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                View My Tickets
              </button>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-lg">Submit a Support Request</h2>
                <p className="text-sm text-muted-foreground">
                  Provide details about your issue and our team will assist you
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setNewTicket({...newTicket, category: cat.id as TicketCategory})
                        }
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all",
                          newTicket.category === cat.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30",
                        )}>
                        <div
                          className={cn(
                            "rounded-lg p-1.5",
                            newTicket.category === cat.id ? cat.color : "bg-muted",
                          )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[10px] font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority.id}
                      onClick={() =>
                        setNewTicket({...newTicket, priority: priority.id as TicketPriority})
                      }
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        newTicket.priority === priority.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30",
                      )}>
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  rows={5}
                  placeholder="Provide detailed information about your issue..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments (Optional)</label>
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={handleFileAttach}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachments"
                    className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, PDF (max 5MB each)</p>
                    </div>
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                        <span className="text-xs">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="rounded p-0.5 hover:bg-muted">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitTicket}
                disabled={!newTicket.subject || !newTicket.message || submitting}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
