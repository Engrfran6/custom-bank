"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuthListener} from "./use-auth-listener";

interface TransferPayload {
  from_account_id: string;
  to_account_number: string;
  amount: number;
  description?: string;
  type?: string;
  meta?: {
    transferType: string;
    routing_number: string;
    swift: string;
    bank_name: string;
    bank_address: string;
    country: string;
  };
}

interface TransferResponse {
  transaction_id: string;
}

async function postTransfer(payload: TransferPayload): Promise<TransferResponse> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  // Throw so useMutation catches it as an error
  if (!res.ok) {
    throw new Error(data.error ?? "Transfer failed");
  }

  return data;
}

export function useTransfer() {
  const queryClient = useQueryClient();
  const {user} = useAuthListener();

  const mutation = useMutation({
    mutationFn: postTransfer,

    onSuccess: () => {
      // ✅ Invalidate both accounts and transactions so
      // the dashboard reflects the new balance immediately
      queryClient.invalidateQueries({queryKey: ["accounts", user?.id]});
      queryClient.invalidateQueries({queryKey: ["transactions", user?.id]});
    },
  });

  return {
    transfer: mutation.mutateAsync, // returns a promise — await-able in the form
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    success: mutation.isSuccess,
    txId: mutation.data?.transaction_id ?? null,
    reset: mutation.reset, // built-in, no manual implementation needed
  };
}
