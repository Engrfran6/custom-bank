"use client";

import {createContext, useContext, useState, useCallback, ReactNode} from "react";

import {useProfile} from "@/lib/hooks/use-profile";
import {FraudDialog} from "@/components/security/fraud-dialog";

interface FraudContextValue {
  isFraudFlagged: boolean;
  guardAction: (action: () => void, actionName?: string) => void;
}

const FraudContext = createContext<FraudContextValue>({
  isFraudFlagged: false,
  guardAction: (action) => action(),
});

export function FraudProvider({children}: {children: ReactNode}) {
  const {profile} = useProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingActionName, setPendingActionName] = useState("this action");

  const isFraudFlagged = !!profile?.fraud_flagged;

  const guardAction = useCallback(
    (action: () => void, actionName = "this action") => {
      if (isFraudFlagged) {
        setPendingActionName(actionName);
        setDialogOpen(true);
      } else {
        action();
      }
    },
    [isFraudFlagged],
  );

  return (
    <FraudContext.Provider value={{isFraudFlagged, guardAction}}>
      {children}
      <FraudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        actionName={pendingActionName}
        fraudDetails={{
          fraud_reason: profile?.fraud_reason,
          fraud_details: profile?.fraud_details,
          fraud_flagged_at: profile?.fraud_flagged_at,
          fraud_flagged_by: profile?.fraud_flagged_by,
        }}
      />
    </FraudContext.Provider>
  );
}

export const useFraud = () => useContext(FraudContext);
