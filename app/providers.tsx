// app/providers.tsx
"use client";

import {ThemeProvider} from "next-themes";
import {ChatProvider} from "@/lib/context/chat-context";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {useEffect} from "react";
import {OfflineProvider, useOffline} from "@/lib/context/offline-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.message === "Failed to fetch" || !navigator.onLine) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

// This now lives INSIDE OfflineProvider so useOffline() works
function QueryRefetchOnReconnect({children}: {children: React.ReactNode}) {
  const {isOnline, wasOffline} = useOffline();

  useEffect(() => {
    if (wasOffline && isOnline) {
      queryClient.refetchQueries();
    }
  }, [wasOffline, isOnline]);

  return <>{children}</>;
}

export function Providers({children}: {children: React.ReactNode}) {
  return (
    // 1. QueryClientProvider outermost (no hooks, safe)
    <QueryClientProvider client={queryClient}>
      {/* 2. ThemeProvider next — its <script> is now outside React's render tree concern */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        scriptProps={{"data-cfasync": "false"}}>
        {/* 3. OfflineProvider before anything that calls useOffline() */}
        <OfflineProvider>
          {/* 4. Now safe to call useOffline() */}
          <QueryRefetchOnReconnect>
            <ChatProvider>
              {children}
              {/* Add DevTools here - only shows in development */}
              {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" /> */}
            </ChatProvider>
          </QueryRefetchOnReconnect>
        </OfflineProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
