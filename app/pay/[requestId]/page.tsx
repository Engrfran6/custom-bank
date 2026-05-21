// app/pay/[requestId]/page.tsx - Fixed version
"use client";

import {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
  Loader2,
  AlertCircle,
  User,
  DollarSign,
  FileText,
  Bitcoin,
  Copy,
  Check,
  Calendar,
  Banknote,
  Landmark,
  Globe,
} from "lucide-react";
import {toast} from "sonner";

interface PaymentRequest {
  id: string;
  request_id: string;
  requester_name: string;
  amount: number;
  currency: string;
  purpose: string;
  expires_at: string;
  status: "pending" | "paid" | "expired" | "cancelled";
}

interface PaymentDetail {
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  crypto_address: string;
  crypto_network: string;
  payment_instructions: string;
  qr_code_url: string;
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail | null>(null);
  const [usingUniversal, setUsingUniversal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRequestAndDetails();
  }, [requestId]);

  const fetchRequestAndDetails = async () => {
    try {
      // Fetch payment request
      const {data: requestData, error: requestError} = await supabase
        .from("payment_requests")
        .select("*")
        .eq("request_id", requestId)
        .single();

      if (requestError) throw requestError;

      if (!requestData) {
        setError("Payment request not found");
        return;
      }

      // Check status
      if (requestData.status === "paid") {
        setError("This payment request has already been paid");
        return;
      }

      if (requestData.status === "expired") {
        setError("This payment request has expired");
        return;
      }

      if (requestData.status === "cancelled") {
        setError("This payment request has been cancelled");
        return;
      }

      setRequest(requestData);

      // Try to fetch specific payment details first
      const {data: detailsData} = await supabase
        .from("payment_details")
        .select("*")
        .eq("payment_request_id", requestData.id)
        .single();

      let finalDetailsData = detailsData;

      // If no specific details, fetch universal details as fallback
      if (!detailsData) {
        const {data: universalData, error: universalError} = await supabase
          .from("universal_payment_details")
          .select("*")
          .limit(1)
          .single();

        if (!universalError && universalData && universalData.is_active) {
          finalDetailsData = universalData;
          setUsingUniversal(true);
        } else {
          setError("Payment details not yet configured. Please contact the requester.");
          return;
        }
      }

      setPaymentDetails(finalDetailsData);
    } catch (error) {
      console.error("Error fetching request:", error);
      setError("Invalid or expired payment request");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Payment Request Error</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-6">
        {/* Universal Fallback Indicator */}
        {usingUniversal && (
          <Alert className="bg-blue-50 border-blue-200">
            <Globe className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              The requester will be notified of your payment.
            </AlertDescription>
          </Alert>
        )}

        {!showDetails ? (
          // Request Summary - First Step
          <Card className="w-full max-w-md mx-auto overflow-hidden p-6">
            <div className="px-8 pt-8 pb-6 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                Payment Request
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-content-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{request?.requester_name}</p>
                  <p className="text-xs text-muted-foreground">is requesting payment from you</p>
                </div>
              </div>
            </div>

            <CardContent className="px-8 pt-6 pb-8 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                  Amount Due
                </p>
                <p className="text-4xl font-medium">
                  {request?.currency} {request?.amount?.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Expires
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {request?.expires_at
                      ? new Date(request.expires_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Currency
                    </span>
                  </div>
                  <p className="text-sm font-medium">{request?.currency}</p>
                </div>

                <div className="bg-muted/40 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Purpose
                    </span>
                  </div>
                  <p className="text-sm font-medium">{request?.purpose}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowDetails(true)}>
                  Proceed to Pay
                </Button>
                <p className="text-xs text-muted-foreground text-center">Secured & encrypted</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Payment Details - Second Step
          <Card className="w-full max-w-md mx-auto overflow-hidden p-6">
            <div className="px-8 pt-8 pb-6 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 mb-4 text-muted-foreground hover:text-foreground"
                onClick={() => setShowDetails(false)}>
                ← Back to Request Summary
              </Button>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Payment Instructions
              </p>
              <p className="text-sm text-muted-foreground">
                Use the following details to complete your payment
              </p>
            </div>

            <CardContent className="px-8 pt-6 pb-8 space-y-6">
              <Tabs defaultValue="bank" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bank" className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Bank Transfer
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4" />
                    Cryptocurrency
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bank" className="mt-4">
                  {paymentDetails?.bank_name ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Bank Name
                        </span>
                        <span className="text-sm font-medium">{paymentDetails.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Account Name
                        </span>
                        <span className="text-sm font-medium">{paymentDetails.account_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Account Number
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{paymentDetails.account_number}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() =>
                              copyToClipboard(paymentDetails.account_number, "Account Number")
                            }>
                            {copiedField === "Account Number" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {paymentDetails.routing_number && (
                        <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Routing Number
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm">
                              {paymentDetails.routing_number}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                copyToClipboard(paymentDetails.routing_number!, "Routing Number")
                              }>
                              {copiedField === "Routing Number" ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {paymentDetails.swift_code && (
                        <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            SWIFT / BIC
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm">{paymentDetails.swift_code}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() =>
                                copyToClipboard(paymentDetails.swift_code!, "SWIFT Code")
                              }>
                              {copiedField === "SWIFT Code" ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No bank transfer details available. Please check the cryptocurrency option
                        or contact the requester.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="crypto" className="mt-4">
                  {paymentDetails?.crypto_address ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Network
                        </span>
                        <span className="text-sm font-medium">
                          {paymentDetails.crypto_network || "BTC/ETH"}
                        </span>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Wallet Address
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-sm break-all">
                            {paymentDetails.crypto_address}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 flex-shrink-0"
                            onClick={() =>
                              copyToClipboard(paymentDetails.crypto_address, "Wallet Address")
                            }>
                            {copiedField === "Wallet Address" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No cryptocurrency details available. Please check the bank transfer option
                        or contact the requester.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>

              {paymentDetails?.payment_instructions && (
                <div className="p-4 bg-muted/40 rounded-lg space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Additional Instructions
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {paymentDetails.payment_instructions}
                  </p>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After payment, contact{" "}
                  <span className="font-medium">{request?.requester_name}</span> to confirm. Include
                  your payment reference if applicable.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    (window.location.href = `mailto:?subject=Payment%20for%20${request?.purpose}&body=I%20have%20completed%20the%20payment%20of%20${request?.currency}%20${request?.amount}%20for%20${request?.purpose}%0A%0APayment%20Reference:%20[INSERT%20REFERENCE]%0A%0ARequest%20ID:%20${request?.request_id}`)
                  }>
                  Notify Requester of Payment
                </Button>
                <p className="text-xs text-muted-foreground text-center">Secured & encrypted</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
