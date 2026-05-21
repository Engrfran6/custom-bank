"use client";

import {Sun, Moon, Search, Landmark} from "lucide-react";
import {useTheme} from "next-themes";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {NotificationBell} from "./notification-bell";
import {useProfile} from "@/lib/hooks/use-profile";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils/utils";

interface NavbarProps {
  variant?: "client" | "admin";
}

export function Navbar({variant}: NavbarProps) {
  const {theme, setTheme} = useTheme();
  const {profile} = useProfile();
  const pathname = usePathname();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (profile?.email?.[0]?.toUpperCase() ?? "?");

  return (
    <header className={cn(pathname === "/admin/chat" && "hidden md:flex")}>
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-2">
          <div className={"md:hidden flex items-center gap-2"}>
            <Link
              href="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Landmark className="h-4 w-4 text-primary-foreground" />
            </Link>

            <span className="text-sm font-semibold tracking-tight">
              {variant === "admin" ? "Back Office" : "NeoBank"}
            </span>
          </div>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground w-64 cursor-text">
            <Search className="h-4 w-4 shrink-0" />
            <span>Search transactions...</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notification bell with slide-over */}
          <NotificationBell />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-xs font-medium leading-tight">
                    {profile?.full_name ?? "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {profile?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin Panel</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
