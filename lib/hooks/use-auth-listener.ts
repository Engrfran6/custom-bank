"use client";

import {useState, useSyncExternalStore} from "react";
import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {User} from "@supabase/supabase-js";

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

export function useAuthListener() {
  const isOnline = useOnlineStatus();
  const isOffline = !isOnline;

  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false); // has auth check completed?

  useEffect(() => {
    if (isOffline) return; // offline → resolved stays false, loading derived below

    const supabase = createClient();

    supabase.auth.getSession().then(({data: {session}}) => {
      setUser(session?.user ?? null);
      setResolved(true); // ✅ called in async .then() — not synchronously in effect body
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setResolved(true); // ✅ called in callback — not synchronously
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOffline]);

  // ✅ derived — no setState needed
  // offline: not loading (no auth possible)
  // online + not resolved: still loading
  // online + resolved: done
  const loading = isOnline && !resolved;

  return {user, loading, isOffline};
}
