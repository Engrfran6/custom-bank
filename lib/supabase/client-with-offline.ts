import {createBrowserClient} from "@supabase/ssr";

let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline = true;
  });
  window.addEventListener("offline", () => {
    isOnline = false;
  });
}

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: false,
        autoRefreshToken: true,
        persistSession: true,
      },
      realtime: {timeout: 10000},
    },
  );

  // Wrap the client to check online status before requests
  const originalAuthGetSession = client.auth.getSession.bind(client.auth);
  client.auth.getSession = async () => {
    if (!isOnline) {
      throw new Error("Offline - cannot get session");
    }
    return originalAuthGetSession();
  };

  return client;
}
