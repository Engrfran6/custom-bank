// contexts/offline-context.tsx
"use client";

import {createContext, useContext, useEffect, useState} from "react";

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isOffline: false,
  wasOffline: false,
});

export function OfflineProvider({children}: {children: React.ReactNode}) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // 🔥 Instead of reloading, let React Query refetch
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{isOnline, isOffline: !isOnline, wasOffline}}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
