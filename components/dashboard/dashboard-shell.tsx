"use client";

import {Sidebar} from "@/components/shared/sidebar";
import {Navbar} from "@/components/shared/navbar";
import {Footer} from "../shared/footer";

export function DashboardShell({
  variant,
  children,
}: {
  variant: "client" | "admin" | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar (handled inside Sidebar via the wrapper above) */}
      <Sidebar variant={variant} />

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar variant={variant} />
        <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-8 pb-20 md:pb-4 lg:pb-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
