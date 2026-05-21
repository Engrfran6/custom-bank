"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {Card} from "@/types/database";

export interface CardWithAccount extends Card {
  account: {
    account_number: string;
    account_type: string;
    balance: number;
  };
}

async function fetchCards(): Promise<CardWithAccount[]> {
  const res = await fetch("/api/cards");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.cards;
}

async function postCard(payload: {account_id: string; card_type: "debit" | "credit"}) {
  const res = await fetch("/api/cards", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.card as CardWithAccount;
}

async function patchCard(id: string, updates: {status?: string; daily_limit?: number}) {
  const res = await fetch(`/api/cards/${id}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.card as CardWithAccount;
}

async function deleteCard(id: string) {
  const res = await fetch(`/api/cards/${id}`, {method: "DELETE"});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}

export function useCards() {
  const queryClient = useQueryClient();
  const queryKey = ["cards"];

  const {
    data: cards = [],
    isLoading: loading,
    error,
  } = useQuery<CardWithAccount[]>({
    queryKey,
    queryFn: fetchCards,
    staleTime: 5 * 60 * 1000,
  });

  const {mutateAsync: createCard} = useMutation({
    mutationFn: postCard,
    onSuccess: () => queryClient.invalidateQueries({queryKey}),
  });

  const {mutateAsync: updateCard} = useMutation({
    mutationFn: ({id, updates}: {id: string; updates: {status?: string; daily_limit?: number}}) =>
      patchCard(id, updates),
    onSuccess: (updatedCard) => {
      // Patch cache directly — no refetch needed
      queryClient.setQueryData<CardWithAccount[]>(
        queryKey,
        (prev) => prev?.map((c) => (c.id === updatedCard.id ? updatedCard : c)) ?? [],
      );
    },
  });

  const {mutateAsync: cancelCard} = useMutation({
    mutationFn: deleteCard,
    onSuccess: (_, id) => {
      queryClient.setQueryData<CardWithAccount[]>(
        queryKey,
        (prev) => prev?.map((c) => (c.id === id ? {...c, status: "cancelled"} : c)) ?? [],
      );
    },
  });

  return {
    cards,
    loading,
    error: (error as Error)?.message ?? null,
    createCard: (account_id: string, card_type: "debit" | "credit") =>
      createCard({account_id, card_type}),
    updateCard: (id: string, updates: {status?: string; daily_limit?: number}) =>
      updateCard({id, updates}),
    cancelCard,
  };
}
