// app/dashboard/request/page.tsx
"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client-with-offline";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {useProfile} from "@/lib/hooks/use-profile";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {
  ArrowLeft,
  Copy,
  Share2,
  Mail,
  Smartphone,
  CheckCircle,
  Link as LinkIcon,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Download,
} from "lucide-react";
import {toast} from "sonner";
import {QRCodeSVG} from "qrcode.react";

interface Request {
  id: string;
  request_id: string;
  requester_id: string;
  requester_name: string;
  amount: number;
  currency: string;
  purpose: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  paid_at?: string;
  payment_link: string;
}

export default function RequestMoneyPage() {
  const router = useRouter();
  const supabase = createClient();
  const {accounts} = useAccounts();
  const {profile} = useProfile();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load user's existing requests
  useEffect(() => {
    if (profile?.id && activeTab === "my-requests") {
      loadMyRequests();
    }
  }, [profile?.id, activeTab]);

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const {data, error} = await supabase
        .from("payment_requests")
        .select("*")
        .eq("requester_id", profile?.id)
        .order("created_at", {ascending: false});

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load your requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const generateRequestLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Please enter a purpose for this request");
      return;
    }

    if (!selectedAccount && accounts.length > 0) {
      toast.error("Please select an account to receive the money");
      return;
    }

    setGenerating(true);
    try {
      const requestId = generateRequestId();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      // Create the payment request in database
      const {error} = await supabase
        .from("payment_requests")
        .insert({
          request_id: requestId,
          requester_id: profile?.id,
          requester_name: profile?.full_name,
          amount: parseFloat(amount),
          currency: currency,
          purpose: purpose,
          account_id: selectedAccount || accounts[0]?.id,
          status: "pending",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Generate the shareable link
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${baseUrl}/pay/${requestId}`;
      setGeneratedLink(link);

      toast.success("Payment request created successfully!");
      setActiveTab("share");
      loadMyRequests(); // Refresh the list
    } catch (error) {
      console.error("Error generating request:", error);
      toast.error("Failed to create payment request");
    } finally {
      setGenerating(false);
    }
  };

  const generateRequestId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REQ-${timestamp}-${random}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareViaEmail = () => {
    const subject = `Payment Request: ${purpose}`;
    const body = `Hello,\n\nPlease send ${currency} ${amount} for: ${purpose}\n\nPayment link: ${generatedLink}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const text = `Please send ${currency} ${amount} for: ${purpose}. Payment link: ${generatedLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const copyRequestId = (requestId: string) => {
    navigator.clipboard.writeText(requestId);
    toast.success("Request ID copied");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const {error} = await supabase
        .from("payment_requests")
        .update({status: "cancelled"})
        .eq("id", requestId)
        .eq("requester_id", profile?.id);

      if (error) throw error;
      toast.success("Request cancelled");
      loadMyRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Request Money</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a payment request and share the link with anyone
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="create">Create Request</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          </TabsList>

          {/* Create Request Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                  <CardDescription>
                    Fill in the information for your payment request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9"
                        step="0.01"
                        min="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose / Description *</Label>
                    <Textarea
                      id="purpose"
                      placeholder="e.g., Dinner payment, Rent, Loan repayment, Gift..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account">Receive to Account *</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_type.toUpperCase()} - ****
                            {account.account_number.slice(-4)} (Balance: ${account.balance})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry">Link Expires In</Label>
                    <Select value={expiryDays} onValueChange={setExpiryDays}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The payment link will expire after {expiryDays} days. Once paid, the funds
                      will be automatically deposited to your selected account.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={generateRequestLink} disabled={generating} className="w-full">
                    {generating ? "Generating..." : "Generate Payment Link"}
                    <LinkIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How your request will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{profile?.full_name || "User"}</span>
                      </div>
                      <Badge variant="outline">Payment Request</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-2xl font-bold">
                          {currency} {amount || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purpose</p>
                        <p className="text-sm">{purpose || "Enter a purpose"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expires</p>
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In {expiryDays} days
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Share Link Tab */}
          <TabsContent value="share" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Payment Link</CardTitle>
                <CardDescription>
                  Your payment request has been created! Share this link with the payer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/30 p-4">
                  <Label className="text-sm font-medium">Payment Link</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg">
                  <QRCodeSVG value={generatedLink} size={150} level="H" includeMargin />
                  <p className="text-sm text-muted-foreground mt-3">Scan to pay</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const canvas = document.querySelector("canvas");
                      if (canvas) {
                        const link = document.createElement("a");
                        link.download = "payment-qr.png";
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Share via</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={shareViaEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" onClick={shareViaSMS}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      SMS
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: "Payment Request",
                            text: `Please send ${currency} ${amount} for: ${purpose}`,
                            url: generatedLink,
                          });
                        } else {
                          copyToClipboard();
                        }
                      }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("create")}>
                    Create Another
                  </Button>
                  <Button onClick={() => setActiveTab("my-requests")}>View My Requests</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Payment Requests</CardTitle>
                <CardDescription>Track all your payment requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="rounded-full bg-muted/30 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <LinkIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground">No payment requests yet</p>
                    <Button variant="link" onClick={() => setActiveTab("create")} className="mt-2">
                      Create your first request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/10 transition-colors">
                        <div className="space-y-2 md:space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {request.currency} {request.amount.toLocaleString()}
                            </span>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm">{request.purpose}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Request ID: {request.request_id}</span>
                            <span>Created: {formatDate(request.created_at)}</span>
                            <span>Expires: {formatDate(request.expires_at)}</span>
                            {request.paid_at && <span>Paid: {formatDate(request.paid_at)}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setGeneratedLink(
                                    `${window.location.origin}/pay/${request.request_id}`,
                                  );
                                  setActiveTab("share");
                                }}>
                                <Share2 className="h-3 w-3 mr-1" />
                                Reshare
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelRequest(request.id)}>
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyRequestId(request.request_id)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
