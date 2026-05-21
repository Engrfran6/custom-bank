"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useCallback, useState} from "react";
import {cn} from "@/lib/utils/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Book,
  ArrowDownLeft,
  LockKeyholeOpenIcon,
  MessageCircleMore,
  HelpCircleIcon,
  Shield,
  Home,
  Send,
  Menu,
  X,
  OctagonAlert,
  SendToBackIcon,
} from "lucide-react";
import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "../ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";
import {useProfile} from "@/lib/hooks/use-profile";
import {useChatContext} from "@/lib/context/chat-context";
import {useFraud} from "@/lib/context/fraud-context";
import {toast} from "sonner";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {fmt} from "@/lib/helper";

const FINANCIAL_ROUTES: Record<string, string> = {
  "/dashboard/transfers": "send money",
  "/dashboard/deposit": "deposit money",
  "/dashboard/payments": "pay bills",
};

/* ================= NAV CONFIG ================= */
const clientNav = [
  {
    title: "Main",
    items: [
      {label: "Overview", href: "/dashboard", icon: LayoutDashboard, type: "link"},
      {label: "Transfer", href: "/dashboard/transfers", icon: ArrowLeftRight, type: "link"},
      {label: "Deposit", href: "/dashboard/deposit", icon: ArrowDownLeft, type: "link"},
      {label: "Bill Pay", href: "/dashboard/payments", icon: Receipt, type: "link"},
    ],
  },
  {
    title: "Manage",
    items: [
      {label: "Transactions history", href: "/dashboard/transactions", icon: Book, type: "link"},
      {
        label: "Bill history",
        href: "/dashboard/bill-payment-history",
        icon: CreditCard,
        type: "link",
      },
      {label: "Manage cards", href: "/dashboard/cards", icon: CreditCard, type: "link"},
      {label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: Users, type: "link"},
      {label: "Notifications", href: "/dashboard/notifications", icon: Bell, type: "link"},
    ],
  },
  {
    title: "System",
    items: [
      {label: "Report", href: "/dashboard/report", icon: LockKeyholeOpenIcon, type: "link"},
      {label: "Settings", href: "/dashboard/settings", icon: Settings, type: "link"},
    ],
  },
  {
    title: "Support",
    items: [
      {label: "Help center", href: "/dashboard/support", icon: HelpCircleIcon, type: "link"},
      {label: "Live chat", href: "#", icon: MessageCircleMore, type: "openChat"},
    ],
  },
];

const adminNav = [
  {
    title: "Main",
    items: [
      {label: "Overview", href: "/admin", icon: LayoutDashboard, type: "link"},
      {label: "Users", href: "/admin/users", icon: Users, type: "link"},
      {label: "Ledger", href: "/admin/ledger", icon: Landmark, type: "link"},
    ],
  },
  {
    title: "Manage",
    items: [
      {label: "Client messages", href: "/admin/chat", icon: MessageCircleMore, type: "link"},
      {label: "Reports", href: "/admin/reports", icon: Shield, type: "link"},
      {label: "Support tickets", href: "/admin/support", icon: HelpCircleIcon, type: "link"},
      {label: "Payment Requests", href: "/admin/payment-requests", icon: CreditCard, type: "link"},
    ],
  },
  {
    title: "Access",
    items: [
      {label: "Access Codes", href: "/admin/access-codes", icon: OctagonAlert, type: "link"},
      {
        label: "Transaction Codes",
        href: "/admin/transaction-codes",
        icon: SendToBackIcon,
        type: "link",
      },
    ],
  },
];

// Primary 4 items shown in the admin bottom nav bar
const adminBottomNav = [
  {label: "Overview", href: "/admin", icon: LayoutDashboard},
  {label: "Users", href: "/admin/users", icon: Users},
  {label: "Messages", href: "/admin/chat", icon: MessageCircleMore},
  {label: "Reports", href: "/admin/reports", icon: Shield},
];

/* ================= COMPONENT ================= */

interface SidebarProps {
  variant?: "client" | "admin";
}

export const Sidebar = ({variant = "client"}: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const {setIsOpen} = useChatContext();
  const {guardAction} = useFraud();
  const {profile} = useProfile();
  const {accounts, loading: accountsLoading} = useAccounts();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (profile?.email?.[0]?.toUpperCase() ?? "?");

  const handleAction = (type: string) => {
    switch (type) {
      case "openChat":
        setIsOpen(true);
        setMobileOpen(false);
        break;
      case "link":
        setMobileOpen(false);
        break;
      default:
        break;
    }
  };

  const sections = variant === "admin" ? adminNav : clientNav;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleSendMoney = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");
      return;
    }
    if (!accounts || accounts.length === 0) {
      toast.warning("No accounts found", {
        description: "You don't have any active accounts. Please contact support.",
      });
      return;
    }
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    if (totalBalance <= 0) {
      toast.error("Insufficient Funds", {
        description: `Your balance (${fmt(totalBalance)}) is too low to send money.`,
        duration: 5000,
        action: {
          label: "Add Money",
          onClick: () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
        },
      });
      return;
    }
    guardAction(() => router.push("/dashboard/transfers"), "send money");
  }, [accounts, accountsLoading, guardAction, router]);

  const handlePayBills = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");
      return;
    }
    if (!accounts || accounts.length === 0) {
      toast.warning("No accounts found", {description: "Please set up an account first."});
      return;
    }
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    if (totalBalance <= 0) {
      toast.error("Insufficient Funds", {
        description: "Your balance is too low to pay bills. Please add funds first.",
        action: {
          label: "Add Money",
          onClick: () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
        },
      });
      return;
    }
    guardAction(() => router.push("/dashboard/payments"), "pay bills");
  }, [accounts, accountsLoading, guardAction, router]);

  return (
    <>
      {/* ===== Mobile Drawer (rendered outside bottom nav so z-index stacks correctly) ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

          {/* Drawer panel */}
          <aside className="absolute left-0 top-0 h-full w-[260px] flex flex-col border-r border-border bg-card shadow-xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between h-16 border-b border-border px-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Landmark className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold tracking-tight">
                  {variant === "admin" ? "Back Office" : "NeoBank"}
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <NavContent
              isCollapsed={false}
              sections={sections}
              pathname={pathname}
              profile={profile!}
              initials={initials}
              guardAction={guardAction}
              handleAction={handleAction}
              handleSignOut={handleSignOut}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
      {/* ===== Client Mobile Bottom Navigation Bar ===== */}
      {variant === "client" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden">
          <div className="flex justify-around py-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                pathname === "/dashboard"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400",
              )}>
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Link>

            <button
              onClick={handleSendMoney}
              className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 dark:text-gray-400 transition-colors">
              <Send className="h-5 w-5" />
              <span className="text-xs">Send</span>
            </button>

            <button
              onClick={handlePayBills}
              className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 dark:text-gray-400 transition-colors">
              <Receipt className="h-5 w-5" />
              <span className="text-xs">Pay</span>
            </button>

            <Link
              href="/dashboard/cards"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                pathname === "/dashboard/cards"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400",
              )}>
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Cards</span>
            </Link>

            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                mobileOpen
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400",
              )}>
              <Menu className="h-5 w-5" />
              <span className="text-xs">Menu</span>
            </button>
          </div>
        </div>
      )}
      {/* ===== Admin Mobile Bottom Navigation Bar ===== */}
      {variant === "admin" && (
        <div
          className={cn(
            pathname === "/admin/chat" && "hidden md:flex",
            "fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden",
          )}>
          <div className="flex justify-around py-2">
            {adminBottomNav.map(({label, href, icon: Icon}) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                  pathname === href || (href !== "/admin" && pathname.startsWith(href))
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400",
                )}>
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Link>
            ))}

            <button
              onClick={() => setMobileOpen(true)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                mobileOpen ? "text-primary" : "text-gray-500 dark:text-gray-400",
              )}>
              <Menu className="h-5 w-5" />
              <span className="text-xs">More</span>
            </button>
          </div>
        </div>
      )}
      {/* ===== Desktop Sidebar ===== */}
      <div className="relative hidden lg:flex h-full">
        <aside
          className={cn(
            "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
            collapsed ? "w-[68px]" : "w-[260px]",
          )}>
          {/* Header */}
          <div className="flex items-center justify-between h-16 border-b border-border px-4 shrink-0">
            <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "gap-2")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Landmark className="h-4 w-4 text-primary-foreground" />
              </div>
              {!collapsed && (
                <span className="text-sm font-semibold tracking-tight">
                  {variant === "admin" ? "Back Office" : "NeoBank"}
                </span>
              )}
            </div>
          </div>

          <NavContent
            isCollapsed={collapsed}
            sections={sections}
            pathname={pathname}
            profile={profile!}
            initials={initials}
            guardAction={guardAction}
            handleAction={handleAction}
            handleSignOut={handleSignOut}
            onClose={() => setMobileOpen(false)}
          />
        </aside>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 flex items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted transition-colors z-10">
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </>
  );
};

/* ================= NavContent ================= */
type NavSection = {
  title: string;
  items: {label: string; href: string; icon: React.ElementType; type: string}[];
};

function NavContent({
  isCollapsed,
  sections,
  pathname,
  profile,
  initials,
  guardAction,
  handleAction,
  handleSignOut,
  onClose,
}: {
  isCollapsed: boolean;
  sections: NavSection[];
  pathname: string;
  profile: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  } | null;
  initials: string;
  guardAction: (action: () => void, label: string) => void;
  handleAction: (type: string) => void;
  handleSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-3 p-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <p
                className={cn(
                  "mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                  section.title === "Access" && "text-red-900 font-bold",
                )}>
                {section.title}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map(({label, href, icon, type}) => (
                <NavItem
                  key={href}
                  icon={icon}
                  label={label}
                  href={href}
                  active={pathname === href}
                  collapsed={isCollapsed}
                  onClick={() => handleAction(type)}
                  guard={
                    FINANCIAL_ROUTES[href]
                      ? (action) => guardAction(action, FINANCIAL_ROUTES[href])
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center justify-start gap-2 mb-4 w-full",
                isCollapsed && "justify-center",
              )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start text-muted-foreground">
                  <span className="text-sm font-medium leading-tight">
                    {profile?.full_name ?? "User"}
                  </span>
                  <span className="text-[10px] leading-tight truncate max-w-[120px]">
                    {profile?.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" onClick={onClose}>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button variant="ghost" onClick={onClose}>
                Sign Out
              </Button>
            </DropdownMenuItem>
            {profile?.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin" onClick={onClose}>
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sign Out */}
        <div className="border-t border-border px-2 py-4">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex w-full p-2 items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2",
            )}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && "Sign out"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ================= NavItem ================= */
function NavItem({
  icon: Icon,
  label,
  href,
  active,
  collapsed,
  onClick,
  guard,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  guard?: (action: () => void) => void;
}) {
  const router = useRouter();

  const className = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    collapsed && "justify-center px-2",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  if (guard) {
    return (
      <button
        onClick={() =>
          guard(() => {
            onClick?.();
            router.push(href);
          })
        }
        className={cn(className, "w-full text-left")}>
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && label}
      </button>
    );
  }

  if (href === "#") {
    return (
      <button onClick={onClick} className={cn(className, "w-full text-left")}>
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && label}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </Link>
  );
}
