// components/offline-indicator.tsx
"use client";

import {WifiOff, RefreshCw} from "lucide-react";
import {useOffline} from "@/lib/context/contexts/offline-context";
import {useState, useEffect} from "react";

export function OfflineIndicator() {
  const {isOffline, wasOffline} = useOffline();
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setTimeout(() => setIsVisible(true), 0);
    } else if (wasOffline && !isOffline) {
      // Just came back online, hide after a few seconds
      setTimeout(() => setIsVisible(false), 3000);
    } else {
      setTimeout(() => setIsVisible(false), 0);
    }
  }, [isOffline, wasOffline]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 w-full left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-yellow-50  border border-yellow-200 rounded-lg p-4 flex items-center justify-center gap-3 shadow-lg">
        <WifiOff className="w-5 h-5 text-yellow-600 animate-pulse" />
        <span className="text-yellow-800 text-sm font-medium">
          You are offline. Some features may be unavailable.
        </span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 text-yellow-700 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
