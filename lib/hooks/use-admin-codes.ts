"use client";

import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useEffect, useRef} from "react";
import {fetchAllTransactionCodes, fetchAllAccessCodes} from "../requests/codes";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {TransactionCode, AccessCode} from "@/types/database";
import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";

export function useAdminCodes() {
  const queryClient = useQueryClient();
  const qcRef = useRef(queryClient);
  useEffect(() => {
    qcRef.current = queryClient;
  });

  const {data: transactionCodes = [], isLoading: txLoading} = useQuery<TransactionCode[]>({
    queryKey: ["admin-transaction-codes"],
    queryFn: fetchAllTransactionCodes,
    staleTime: 30 * 1000,
  });

  const {data: accessCodes = [], isLoading: acLoading} = useQuery<AccessCode[]>({
    queryKey: ["admin-access-codes"],
    queryFn: fetchAllAccessCodes,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const supabase = createClient();
    const suffix = Math.random().toString(36).slice(2);

    // ✅ Use Supabase's own payload types — no casting needed
    function handleInsert<T extends {id: string}>(
      queryKey: string[],
      payload: RealtimePostgresInsertPayload<Record<string, unknown>>,
    ) {
      const row = payload.new as unknown as T;
      qcRef.current.setQueryData<T[]>(queryKey, (prev) => {
        if (!prev) return [row];
        if (prev.some((r) => r.id === row.id)) return prev;
        return [row, ...prev];
      });
    }

    function handleUpdate<T extends {id: string}>(
      queryKey: string[],
      payload: RealtimePostgresUpdatePayload<Record<string, unknown>>,
    ) {
      const row = payload.new as unknown as T;
      qcRef.current.setQueryData<T[]>(
        queryKey,
        (prev) => prev?.map((r) => (r.id === row.id ? row : r)) ?? [],
      );
    }

    function handleDelete<T extends {id: string}>(
      queryKey: string[],
      payload: RealtimePostgresDeletePayload<Record<string, unknown>>,
    ) {
      const oldId = (payload.old as {id?: string}).id;
      if (!oldId) return;
      qcRef.current.setQueryData<T[]>(
        queryKey,
        (prev) => prev?.filter((r) => r.id !== oldId) ?? [],
      );
    }

    const channel = supabase
      .channel(`admin_codes_${suffix}`)
      .on(
        "postgres_changes",
        {event: "INSERT", schema: "public", table: "transaction_codes"},
        (p) => handleInsert<TransactionCode>(["admin-transaction-codes"], p),
      )
      .on(
        "postgres_changes",
        {event: "UPDATE", schema: "public", table: "transaction_codes"},
        (p) => handleUpdate<TransactionCode>(["admin-transaction-codes"], p),
      )
      .on(
        "postgres_changes",
        {event: "DELETE", schema: "public", table: "transaction_codes"},
        (p) => handleDelete<TransactionCode>(["admin-transaction-codes"], p),
      )
      .on("postgres_changes", {event: "INSERT", schema: "public", table: "access_codes"}, (p) =>
        handleInsert<AccessCode>(["admin-access-codes"], p),
      )
      .on("postgres_changes", {event: "UPDATE", schema: "public", table: "access_codes"}, (p) =>
        handleUpdate<AccessCode>(["admin-access-codes"], p),
      )
      .on("postgres_changes", {event: "DELETE", schema: "public", table: "access_codes"}, (p) =>
        handleDelete<AccessCode>(["admin-access-codes"], p),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    transactionCodes,
    accessCodes,
    loading: txLoading || acLoading,
  };
}
