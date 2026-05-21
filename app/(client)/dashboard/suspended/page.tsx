"use client";

import {useEffect} from "react";
import {SuspensionDialog} from "@/components/security/suspension-dialog";
import {useProfile} from "@/lib/hooks/use-profile";
import {createClient} from "@/lib/supabase/client-with-offline";
import {useRouter} from "next/navigation";

const SuspendedPage = () => {
  const router = useRouter();
  const {isSuspended, suspensionInfo} = useProfile();

  useEffect(() => {
    if (!isSuspended) {
      router.push("/auth/login");
    }
  }, [isSuspended, router]);

  const handleCloseDialog = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      suspended user
      <SuspensionDialog
        open={true}
        onOpenChange={handleCloseDialog}
        suspensionDetails={suspensionInfo!}
        email={suspensionInfo?.email}
      />
    </div>
  );
};

export default SuspendedPage;
