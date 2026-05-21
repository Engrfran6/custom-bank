// app/admin/users/[userId]/accounts/page.tsx
"use client";

import {useParams} from "next/navigation";
import {UserAccountsManager} from "@/components/admin/user-accounts-manager";
import {Skeleton} from "@/components/ui/skeleton";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle} from "lucide-react";
import {useAdminUsers} from "@/lib/hooks/use-admin-users";

export default function UserAccountsPage() {
  const params = useParams();
  const userId = params.userId as string;

  // Fetch user details
  const {users, loading} = useAdminUsers({});
  const user = users.find((u) => u.id === userId);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <UserAccountsManager userId={userId} userName={user.full_name || user.email || "User"} />
    </div>
  );
}
