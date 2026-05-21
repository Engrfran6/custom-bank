"use client";

import {useState} from "react";
import type {UserWithAccounts} from "@/lib/hooks/use-admin-users";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {
  MoreHorizontal,
  ShieldCheck,
  UserCheck,
  Eye,
  Loader2,
  AlertTriangle,
  Flag,
  Ban,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {cn} from "@/lib/utils/utils";
import {UserForm} from "./user-form";
import {useRouter} from "next/navigation";

const kycColors = {
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface UserTableProps {
  users: UserWithAccounts[];
  loading: boolean;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  canPerformActions?: boolean;
  currentUserRole?: string;
}

// Fraud detection reasons
const fraudReasons = [
  "Suspicious transaction pattern",
  "Multiple failed login attempts",
  "Unusual geographic location",
  "Identity verification failed",
  "Reported stolen credentials",
  "Suspected money laundering",
  "Violation of terms of service",
  "Chargeback history",
  "Other",
];

// Fraud resolution reasons
const fraudResolutionReasons = [
  "False positive - User verified",
  "Investigation completed - No fraud found",
  "User provided valid documentation",
  "Transaction pattern explained",
  "Account restored after review",
  "Resolved with user confirmation",
  "Other",
];

const suspensionReasons = [
  "Fraudulent activity detected",
  "Multiple policy violations",
  "Court order / legal requirement",
  "Suspicious account behavior",
  "Request by user",
  "Inactivity period exceeded",
  "Other",
];

export function UserTable({
  users,
  loading,
  onUpdate,
  canPerformActions = true,
  currentUserRole,
}: UserTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<UserWithAccounts | null>(null);

  // Fraud detection states
  const [fraudDialogOpen, setFraudDialogOpen] = useState(false);
  const [resolveFraudDialogOpen, setResolveFraudDialogOpen] = useState(false);
  const [suspensionDialogOpen, setSuspensionDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithAccounts | null>(null);
  const [fraudReason, setFraudReason] = useState("");
  const [fraudDetails, setFraudDetails] = useState("");
  const [resolveFraudReason, setResolveFraudReason] = useState("");
  const [resolveFraudDetails, setResolveFraudDetails] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionDetails, setSuspensionDetails] = useState("");
  const [reactivateReason, setReactivateReason] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithAccounts | null>(null);
  const router = useRouter();

  // Authorization check helper
  const isAuthorized = () => {
    if (!canPerformActions) return false;
    const allowedRoles = ["admin", "super_admin", "fraud_analyst"];
    return currentUserRole ? allowedRoles.includes(currentUserRole) : true;
  };

  const handle = async (id: string, updates: Record<string, unknown>) => {
    setActionId(id);
    try {
      await onUpdate(id, updates);
    } finally {
      setActionId(null);
    }
  };

  // Handle fraud flagging
  const handleFraudFlag = async () => {
    if (!selectedUser || !fraudReason) return;

    await handle(selectedUser.id!, {
      fraud_flagged: true,
      fraud_reason: fraudReason,
      fraud_details: fraudDetails,
      fraud_flagged_at: new Date().toISOString(),
      fraud_flagged_by: currentUserRole || "admin",
    });

    setFraudDialogOpen(false);
    setFraudReason("");
    setFraudDetails("");
    setSelectedUser(null);
  };

  // Handle fraud resolution
  const handleResolveFraud = async () => {
    if (!selectedUser || !resolveFraudReason) return;

    await handle(selectedUser.id!, {
      fraud_flagged: false,
      fraud_reason: null,
      fraud_details: null,
      fraud_resolved_at: new Date().toISOString(),
      fraud_resolved_by: currentUserRole || "admin",
      fraud_resolution_reason: resolveFraudReason,
      fraud_resolution_details: resolveFraudDetails,
    });

    setResolveFraudDialogOpen(false);
    setResolveFraudReason("");
    setResolveFraudDetails("");
    setSelectedUser(null);
  };

  // Handle suspension with reason
  const handleSuspendWithReason = async () => {
    if (!selectedUser || !suspensionReason) return;

    await handle(selectedUser.id!, {
      is_suspended: true,
      account_status: "frozen",
      suspension_reason: suspensionReason,
      suspension_details: suspensionDetails,
      suspended_at: new Date().toISOString(),
      suspended_by: currentUserRole || "admin",
    });

    setSuspensionDialogOpen(false);
    setSuspensionReason("");
    setSuspensionDetails("");
    setSelectedUser(null);
  };

  // Handle reactivation with reason
  const handleReactivateWithReason = async () => {
    if (!selectedUser) return;

    await handle(selectedUser.id!, {
      is_suspended: false,
      account_status: "active",
      reactivated_at: new Date().toISOString(),
      reactivated_by: currentUserRole || "admin",
      reactivation_reason: reactivateReason || "Account reinstated",
    });

    setReactivateDialogOpen(false);
    setReactivateReason("");
    setSelectedUser(null);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(n);

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">No users found</div>;
  }

  const toggleKycStatus = (user: UserWithAccounts) => {
    let newStatus: string;

    if (user.kyc_status === "verified") {
      newStatus = "rejected";
    } else if (user.kyc_status === "pending") {
      newStatus = "verified";
    } else {
      newStatus = "verified";
    }

    handle(user.id!, {kyc_status: newStatus});
  };

  return (
    <>
      {/* Table header */}
      <div className="mb-2 grid grid-cols-12 gap-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-4">User</div>
        <div className="col-span-2 hidden lg:block">KYC</div>
        <div className="col-span-2 hidden xl:block">Balance</div>
        <div className="col-span-2 hidden lg:block">Joined</div>
        <div className="col-span-1 hidden sm:block">Status</div>
        <div className="col-span-1 sm:col-span-1 xl:col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y divide-border overflow-visible">
        {users.map((user) => {
          const totalBalance = user.accounts?.reduce((s, a) => s + Number(a.balance), 0) ?? 0;

          const initials = user.full_name
            ? user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : user.email![0].toUpperCase();

          return (
            <div
              key={user.id}
              className="grid grid-cols-12 items-center gap-4 py-3 px-2 hover:bg-muted/40 rounded-lg transition-colors">
              {/* User */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.full_name ?? "—"}
                    {user.fraud_flagged && (
                      <Flag className="inline-block ml-2 h-3 w-3 text-red-500" />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* KYC */}
              <div className="col-span-2 hidden lg:block">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    kycColors[user.kyc_status as keyof typeof kycColors],
                  )}>
                  {user.kyc_status}
                </span>
              </div>

              {/* Balance */}
              <div className="col-span-2 hidden xl:block text-sm font-medium">
                {fmt(totalBalance)}
              </div>

              {/* Joined */}
              <div className="col-span-2 hidden lg:block text-xs text-muted-foreground">
                {new Date(user.created_at!).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {/* Status */}
              <div className="col-span-1 hidden sm:block">
                <Badge
                  variant={user.is_suspended ? "destructive" : "secondary"}
                  className="text-xs capitalize">
                  {user.is_suspended ? "Suspended" : user.fraud_flagged ? "Fraud Review" : "Active"}
                </Badge>
              </div>

              {/* Actions - Fixed positioning */}
              <div className="col-span-8 sm:col-span-1 xl:col-span-1 flex justify-end relative">
                {actionId === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52" sideOffset={5}>
                      <DropdownMenuItem
                        onClick={() => {
                          // Navigate to accounts page or open modal
                          router.push(`/admin/users/${user.id}/accounts`);
                          // Or open a dialog with UserAccountsManager
                        }}
                        className="text-indigo-600 dark:text-indigo-400">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Accounts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDetailUser(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>

                      {/* Only show admin actions if authorized */}
                      {isAuthorized() && (
                        <DropdownMenuItem
                          onClick={() => {
                            setEditUser(user);
                            setEditDialogOpen(true);
                          }}
                          className="text-blue-600 dark:text-blue-400">
                          <UserCheck className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                      )}

                      {/* Only show admin actions if authorized */}
                      {isAuthorized() && (
                        <>
                          <DropdownMenuSeparator />

                          {/* KYC actions */}
                          <DropdownMenuItem
                            onClick={() => toggleKycStatus(user)}
                            className="text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {user.kyc_status === "verified" ? "Reject KYC" : "Approve KYC"}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Fraud Detection Action - Show different options based on fraud status */}
                          {!user.fraud_flagged && !user.is_suspended && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setFraudDialogOpen(true);
                              }}
                              className="text-orange-600 dark:text-orange-400">
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Flag as Fraud
                            </DropdownMenuItem>
                          )}

                          {user.fraud_flagged && !user.is_suspended && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setResolveFraudDialogOpen(true);
                              }}
                              className="text-green-600 dark:text-green-400">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Resolve Fraud Case
                            </DropdownMenuItem>
                          )}

                          {/* Suspend / reactivate with reasons */}
                          {user.is_suspended ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setReactivateDialogOpen(true);
                              }}
                              className="text-emerald-600 dark:text-emerald-400">
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setSuspensionDialogOpen(true);
                              }}
                              className="text-red-500">
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Account
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flag Fraud Dialog */}
      <Dialog open={fraudDialogOpen} onOpenChange={setFraudDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Flag Account for Fraud
            </DialogTitle>
            <DialogDescription>
              Please provide details about the suspicious activity for user {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fraud Reason *</Label>
              <Select value={fraudReason} onValueChange={setFraudReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {fraudReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details</Label>
              <Textarea
                placeholder="Provide specific details about the fraudulent activity..."
                value={fraudDetails}
                onChange={(e) => setFraudDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFraudDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFraudFlag} disabled={!fraudReason}>
              Flag as Fraud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Fraud Dialog */}
      <Dialog open={resolveFraudDialogOpen} onOpenChange={setResolveFraudDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resolve Fraud Case
            </DialogTitle>
            <DialogDescription>
              Please provide resolution details for the fraud case against {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUser?.fraud_reason && (
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 text-sm border border-orange-200 dark:border-orange-800">
                <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                  Original Fraud Reason:
                </p>
                <p className="text-muted-foreground">{selectedUser.fraud_reason}</p>
                {selectedUser.fraud_details && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedUser.fraud_details}</p>
                )}
                {selectedUser.fraud_flagged_by && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Flagged by: {selectedUser.fraud_flagged_by} on{" "}
                    {new Date(selectedUser.fraud_flagged_at!).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Resolution Reason *</Label>
              <Select value={resolveFraudReason} onValueChange={setResolveFraudReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resolution reason" />
                </SelectTrigger>
                <SelectContent>
                  {fraudResolutionReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution Details</Label>
              <Textarea
                placeholder="Provide additional details about how this case was resolved..."
                value={resolveFraudDetails}
                onChange={(e) => setResolveFraudDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveFraudDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleResolveFraud}
              disabled={!resolveFraudReason}
              className="bg-green-600 hover:bg-green-700">
              Resolve Fraud Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspension Dialog with Reason */}
      <Dialog open={suspensionDialogOpen} onOpenChange={setSuspensionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Suspend Account
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending {selectedUser?.email}&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Suspension Reason *</Label>
              <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {suspensionReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details</Label>
              <Textarea
                placeholder="Provide any additional context for the suspension..."
                value={suspensionDetails}
                onChange={(e) => setSuspensionDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspensionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendWithReason}
              disabled={!suspensionReason}>
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivation Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-500" />
              Reactivate Account
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for reactivating {selectedUser?.email}&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reactivation Reason *</Label>
              <Textarea
                placeholder="Explain why this account is being reactivated..."
                value={reactivateReason}
                onChange={(e) => setReactivateReason(e.target.value)}
                rows={4}
              />
            </div>
            {selectedUser?.suspension_reason && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-semibold mb-1">Previously suspended for:</p>
                <p className="text-muted-foreground">{selectedUser.suspension_reason}</p>
                {selectedUser.suspension_details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedUser.suspension_details}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleReactivateWithReason}
              disabled={!reactivateReason}>
              Reactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="!max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Edit complete profile information for {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <UserForm
              user={editUser}
              onSubmit={async (data) => {
                await handle(editUser.id!, data);
                setEditDialogOpen(false);
                setEditUser(null);
              }}
              onCancel={() => {
                setEditDialogOpen(false);
                setEditUser(null);
              }}
              loading={actionId === editUser.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User detail dialog (existing) */}
      <Dialog open={!!detailUser} onOpenChange={(v) => !v && setDetailUser(null)}>
        <DialogContent className="!max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete profile information</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <UserForm
              user={detailUser}
              onSubmit={async () => {}}
              onCancel={() => setDetailUser(null)}
              readOnly={true}
            />
          )}
          <DialogFooter>
            <Button onClick={() => setDetailUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
