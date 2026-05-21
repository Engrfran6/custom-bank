"use client";

import {useState} from "react";
import {useAdminUsers} from "@/lib/hooks/use-admin-users";
import {UserTable} from "@/components/admin/user-table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Search, ChevronLeft, ChevronRight, Users} from "lucide-react";
import {useDebounce} from "@/lib/hooks/use-debounce";
import {useProfile} from "@/lib/hooks/use-profile";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kyc, setKyc] = useState("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const {profile} = useProfile();

  const {
    users,
    total,
    loading: userLoading,
    updateUser,
  } = useAdminUsers({
    search: debouncedSearch,
    status,
    kyc,
    page,
  });

  const loading = userLoading;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">{total} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={kyc}
          onValueChange={(v) => {
            setKyc(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <UserTable
          users={users}
          loading={loading}
          onUpdate={updateUser}
          canPerformActions={profile?.role === "admin"}
          currentUserRole={profile?.role}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
