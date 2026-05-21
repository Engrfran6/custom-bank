"use client";

import {useState} from "react";
import {
  Trash2,
  UserPlus,
  Users,
  Building2,
  CreditCard,
  Search,
  MoreVertical,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import {useBeneficiaries} from "@/lib/hooks/use-beneficiaries";
import {cn} from "@/lib/utils/utils";

import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {Avatar} from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";

export default function BeneficiariesPage() {
  const {beneficiaries, loading, removeBeneficiary} = useBeneficiaries();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "external">("all");

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await removeBeneficiary(id);
    setDeletingId(null);
  };

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch =
      b.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.account_number?.includes(searchQuery) ||
      b.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all"
        ? true
        : filterType === "internal"
          ? b.is_internal
          : filterType === "external"
            ? !b.is_internal
            : true;

    return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-emerald-500 to-emerald-600",
      "bg-gradient-to-br from-violet-500 to-violet-600",
      "bg-gradient-to-br from-amber-500 to-amber-600",
      "bg-gradient-to-br from-rose-500 to-rose-600",
      "bg-gradient-to-br from-cyan-500 to-cyan-600",
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Beneficiaries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your saved recipients for faster transfers
          </p>
        </div>
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
          <UserPlus className="h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="hidden md:grid gap-3 grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Beneficiaries</p>
                <p className="text-2xl font-bold mt-1">{beneficiaries.length}</p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Internal</p>
                <p className="text-2xl font-bold mt-1">
                  {beneficiaries.filter((b) => b.is_internal).length}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/20 p-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">External</p>
                <p className="text-2xl font-bold mt-1">
                  {beneficiaries.filter((b) => !b.is_internal).length}
                </p>
              </div>
              <div className="rounded-full bg-violet-500/20 p-2">
                <CreditCard className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, account, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          {["all", "internal", "external"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter as never)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                filterType === filter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}>
              {filter === "all" ? "All" : filter === "internal" ? "Internal" : "External"}
            </button>
          ))}
        </div>
      </div>

      {/* Beneficiaries List */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted/30 p-4 mb-4">
                {searchQuery ? (
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                ) : (
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">
                {searchQuery ? "No matching beneficiaries found" : "No beneficiaries yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Add your first beneficiary to get started"}
              </p>
              {!searchQuery && (
                <Button variant="outline" className="mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Beneficiary
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredBeneficiaries.map((b, index) => (
                <div
                  key={b.id}
                  className="group relative overflow-hidden transition-all hover:bg-muted/10">
                  <div className="flex items-center gap-3 p-4 md:gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 shadow-md">
                      <div
                        className={cn(
                          "h-full w-full flex items-center justify-center text-white font-semibold",
                          getAvatarColor(b.nickname || b.full_name || "?"),
                        )}>
                        {getInitials(b.nickname || b.full_name || "?")}
                      </div>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm md:text-base">
                          {b.nickname || b.full_name}
                        </p>
                        {b.is_internal ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            Internal
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px]">
                            External
                          </Badge>
                        )}
                        {b.swift_code && (
                          <Badge variant="outline" className="text-[10px]">
                            International
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-muted-foreground font-mono">
                          {b.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {b.bank_name}
                        </p>
                        {b.country && <p className="text-xs text-muted-foreground">{b.country}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === b.id}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-red-500/10 p-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              </div>
                              <AlertDialogTitle>Delete Beneficiary?</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="pt-2">
                              This action cannot be undone. This will permanently remove{" "}
                              <span className="font-semibold text-foreground">
                                {b.nickname || b.full_name}
                              </span>{" "}
                              from your beneficiaries.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingId === b.id}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(b.id)}
                              disabled={deletingId === b.id}
                              className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500">
                              {deletingId === b.id ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                  Deleting...
                                </div>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Quick action buttons on hover */}
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-2 bg-gradient-to-l from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tip Section */}
      {beneficiaries.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
          <div className="flex gap-2">
            <div className="rounded-full bg-primary/10 p-1.5 shrink-0">
              <CheckCircle2 className="h-3 w-3 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Pro Tip:</span> You can quickly select a
              beneficiary when making a transfer by clicking on their name in the transfer form.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
