"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/client-with-offline";
import {useRouter} from "next/navigation";
import {AlertTriangle, LogOut, Loader2} from "lucide-react";

export function SettingsDanger() {
  const router = useRouter();
  const [signOutAll, setSignOutAll] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignOutAll = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut({scope: "global"});
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    // In production: call an API route that uses service role to delete
    // For now: sign out
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sign out all devices */}
      <div className="flex items-start justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-semibold">Sign Out All Devices</p>
          <p className="text-xs text-muted-foreground">
            Sign out from all active sessions across all devices
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSignOutAll(true)}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out All
        </Button>
      </div>

      {/* Delete account */}
      <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Account</p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70">
            Permanently delete your account and all associated data
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Sign out all confirm */}
      <Dialog open={signOutAll} onOpenChange={setSignOutAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out All Devices</DialogTitle>
            <DialogDescription>
              This will end all active sessions. You&apos;ll need to sign in again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSignOutAll(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSignOutAll} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Out All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This is permanent and cannot be undone. All your accounts, transactions, and data will
              be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="grid gap-1.5">
              <Label>
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={confirmText !== "DELETE" || loading}
                onClick={handleDeleteAccount}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Forever
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
