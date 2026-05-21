"use client";

import {useMutation} from "@tanstack/react-query";
import {useEffect, useRef, useState} from "react";
import {createAccessCode, verifyAccessCode, cancelAccessCode} from "../requests/codes";
import type {AccessCode} from "@/types/database";

export function useAccessCode() {
  const [code, setCode] = useState<AccessCode | null>(null);
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
    mutationFn: createAccessCode,
    onSuccess: (newCode) => {
      setCode(newCode);
      setSecondsLeft(300);
    },
  });

  // ✅ Wrap generate to guard against double calls
  const generateOnce = async () => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    try {
      await generate();
    } catch {
      generatedRef.current = false; // allow retry on error
    }
  };

  // ✅ Reset the guard when generating a new code manually (resend)
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
    mutationFn: (inputCode: string) => verifyAccessCode(inputCode),
    onSuccess: (result) => {
      if (result.ok) {
        setCode((prev) => (prev ? {...prev, status: "used"} : null));
        if (timerRef.current) clearInterval(timerRef.current);
      }
    },
  });

  // ✅ verify returns result directly — caller uses it
  const verify = async (inputCode: string) => {
    return verifyMutation(inputCode);
  };

  const {mutateAsync: cancel} = useMutation({
    mutationFn: () => cancelAccessCode(code!.id),
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
    generate: generateOnce, // ✅ guarded — safe to call in useEffect
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
