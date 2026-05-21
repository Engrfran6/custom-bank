// hooks/use-transaction-code.ts
"use client";

import {useMutation} from "@tanstack/react-query";
import {useEffect, useRef, useState} from "react";
import {
  createTransactionCode,
  verifyTransactionCode,
  cancelTransactionCode,
} from "../requests/codes";
import type {TransactionCode} from "@/types/database";

export function useTransactionCode(amount: number) {
  const [code, setCode] = useState<TransactionCode | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const generatedRef = useRef(false); // ✅ prevents double generation

  useEffect(() => {
    if (!code || code.status !== "pending") return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(code.expires_at).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setCode((prev) => (prev ? {...prev, status: "expired"} : null));
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [code?.id, code?.expires_at]);

  const {mutateAsync: generate, isPending: generating} = useMutation({
    mutationFn: () => createTransactionCode(amount),
    onSuccess: (newCode) => {
      setCode(newCode);
      setSecondsLeft(300);
    },
  });

  const generateOnce = async () => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    try {
      await generate();
    } catch {
      generatedRef.current = false;
    }
  };

  const regenerate = async () => {
    generatedRef.current = true;
    setCode(null);
    setSecondsLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await generate();
    } catch {
      generatedRef.current = false;
    }
  };

  const {mutateAsync: verifyMutation, isPending: verifying} = useMutation({
    mutationFn: (inputCode: string) => verifyTransactionCode(inputCode, amount),
    onSuccess: (result) => {
      if (result.ok) {
        setCode((prev) => (prev ? {...prev, status: "used"} : null));
        if (timerRef.current) clearInterval(timerRef.current);
      }
    },
  });

  const verify = async (inputCode: string) => {
    return verifyMutation(inputCode);
  };

  const {mutateAsync: cancel} = useMutation({
    mutationFn: () => cancelTransactionCode(code!.id),
    onSuccess: () => {
      setCode((prev) => (prev ? {...prev, status: "cancelled"} : null));
      if (timerRef.current) clearInterval(timerRef.current);
      generatedRef.current = false;
    },
  });

  const reset = () => {
    setCode(null);
    setSecondsLeft(0);
    generatedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return {
    code,
    secondsLeft,
    generating,
    verifying,
    generate: generateOnce, // ✅ guarded
    regenerate, // ✅ for resend button
    verify,
    cancel,
    reset,
    isExpired: code?.status === "expired",
    isUsed: code?.status === "used",
    isCancelled: code?.status === "cancelled",
    isPending: code?.status === "pending",
  };
}
