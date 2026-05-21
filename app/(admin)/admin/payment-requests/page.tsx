"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Loader2, Plus, Edit, CheckCircle, XCircle, Copy, Globe} from "lucide-react";
import {toast} from "sonner";
import {usePaymentRequests} from "@/lib/hooks/use-payment-requests";
import {UniversalPaymentDialog} from "@/components/admin/payment-requests/universal-payment-dialog";
import {PaymentDetailsDialog} from "@/components/admin/payment-requests/payment-details-dialog";
import {CreateRequestDialog} from "@/components/admin/payment-requests/create-request-dialog";
import type {PaymentRequest} from "@/types/database";
import {useMounted} from "@/lib/hooks/use-mounted";

function getStatusBadge(status: string) {
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
}

export default function AdminPaymentRequestsPage() {
  const mounted = useMounted();
  const {paymentRequests, loading, creating, updatingStatus, createRequest, updateStatus} =
    usePaymentRequests();

  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUniversalDialog, setShowUniversalDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const copyPaymentLink = (requestId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${requestId}`);
    toast.success("Payment link copied!");
  };

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Requests</h1>
          <p className="text-muted-foreground mt-1">Manage payment requests and details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUniversalDialog(true)}>
            <Globe className="h-4 w-4 mr-2" /> Universal Settings
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payment requests found
                  </TableCell>
                </TableRow>
              ) : (
                paymentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">{request.request_id}</TableCell>
                    <TableCell>{request.requester_name}</TableCell>
                    <TableCell>
                      {request.currency} {request.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{request.purpose}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(request.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPaymentLink(request.request_id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsDialog(true);
                          }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              disabled={updatingStatus}
                              onClick={() => updateStatus(request.id, "paid")}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              disabled={updatingStatus}
                              onClick={() => updateStatus(request.id, "cancelled")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UniversalPaymentDialog open={showUniversalDialog} onOpenChange={setShowUniversalDialog} />

      <CreateRequestDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCreate={createRequest}
        creating={creating}
        onCreated={(created) => {
          setSelectedRequest(created);
          setShowDetailsDialog(true);
        }}
      />

      <PaymentDetailsDialog
        request={selectedRequest}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
}
