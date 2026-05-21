import {useAuthListener} from "./use-auth-listener";
import {useOffline} from "../context/contexts/offline-context";
import {useProfileQuery} from "./queries/use-profile-query";

export function useProfile() {
  const {user, loading: authLoading} = useAuthListener();
  const {isOffline} = useOffline();

  const {profile, isLoading: queryLoading} = useProfileQuery({
    userId: user?.id,
    authLoading,
    isOffline,
  });

  // ── Derived: combined loading ────────────────────────────────────────
  const isLoading = authLoading || queryLoading;

  // ── Derived: suspension ──────────────────────────────────────────────
  const isSuspended = profile?.is_suspended ?? false;
  const suspensionInfo = isSuspended
    ? {
        is_suspended: profile?.is_suspended,
        suspension_details: profile?.suspension_details,
        suspension_reason: profile?.suspension_reason,
        suspended_by: profile?.suspended_by,
        suspended_at: profile?.suspended_at,
        reactivation_reason: profile?.reactivation_reason,
        email: profile?.email,
      }
    : null;

  // ── Derived: fraud ───────────────────────────────────────────────────
  const isFraudFlagged = profile?.fraud_flagged ?? false;
  const fraudInfo = isFraudFlagged
    ? {
        fraud_reason: profile?.fraud_reason ?? undefined,
        fraud_details: profile?.fraud_details ?? undefined,
        fraud_flagged_at: profile?.fraud_flagged_at,
        fraud_flagged_by: profile?.fraud_flagged_by,
      }
    : null;

  return {
    user,
    profile,
    isLoading,
    isSuspended,
    suspensionInfo,
    isFraudFlagged,
    fraudInfo,
    isAccountActive: true,
  };
}
