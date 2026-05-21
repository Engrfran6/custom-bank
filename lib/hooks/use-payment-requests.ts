"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  fetchPaymentRequests,
  fetchUniversalPaymentDetails,
  fetchPaymentDetails,
  upsertPaymentDetails,
  upsertUniversalPaymentDetails,
  insertPaymentRequest,
  patchPaymentRequestStatus,
} from "../requests/fetch-payment-requests";
import type {PaymentRequest, PaymentDetails, UniversalPaymentDetails} from "@/types/database";

function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REQ-${timestamp}-${random}`;
}

// ── Payment requests list ─────────────────────────────────────────────

export function usePaymentRequests() {
  const queryClient = useQueryClient();

  const {data: paymentRequests = [], isLoading: loading} = useQuery<PaymentRequest[]>({
    queryKey: ["payment-requests"],
    queryFn: fetchPaymentRequests,
    staleTime: 30 * 1000,
  });

  const {mutateAsync: createRequest, isPending: creating} = useMutation({
    mutationFn: (payload: {
      requester_name: string;
      amount: string;
      currency: string;
      purpose: string;
      expires_in_days: string;
    }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(payload.expires_in_days));
      return insertPaymentRequest({
        request_id: generateRequestId(),
        requester_name: payload.requester_name,
        amount: parseFloat(payload.amount),
        currency: payload.currency,
        purpose: payload.purpose,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["payment-requests"]}),
  });

  const {mutateAsync: updateStatus, isPending: updatingStatus} = useMutation({
    mutationFn: ({id, status}: {id: string; status: PaymentRequest["status"]}) =>
      patchPaymentRequestStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["payment-requests"]}),
  });

  return {
    paymentRequests,
    loading,
    creating,
    updatingStatus,
    createRequest,
    updateStatus: (id: string, status: PaymentRequest["status"]) => updateStatus({id, status}),
  };
}

// ── Per-request payment details ───────────────────────────────────────

export function usePaymentDetails(requestId: string | null) {
  const queryClient = useQueryClient();

  const {data: paymentDetails, isLoading} = useQuery<PaymentDetails | null>({
    queryKey: ["payment-details", requestId],
    queryFn: () => fetchPaymentDetails(requestId!),
    enabled: !!requestId,
    staleTime: 60 * 1000,
  });

  const {mutateAsync: saveDetails, isPending: saving} = useMutation({
    mutationFn: (payload: Omit<PaymentDetails, "id" | "created_at" | "payment_request_id">) =>
      upsertPaymentDetails({
        ...payload,
        payment_request_id: requestId!,
      }),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["payment-details", requestId]}),
  });

  return {paymentDetails, isLoading, saving, saveDetails};
}

// ── Universal payment details ─────────────────────────────────────────

export function useUniversalPaymentDetails() {
  const queryClient = useQueryClient();

  const {data: universalDetails} = useQuery<UniversalPaymentDetails | null>({
    queryKey: ["universal-payment-details"],
    queryFn: fetchUniversalPaymentDetails,
    staleTime: 5 * 60 * 1000,
  });

  const {mutateAsync: saveUniversal, isPending: saving} = useMutation({
    mutationFn: (payload: Partial<UniversalPaymentDetails>) =>
      upsertUniversalPaymentDetails({...payload, id: universalDetails?.id}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["universal-payment-details"]}),
  });

  return {universalDetails, saving, saveUniversal};
}
