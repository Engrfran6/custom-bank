// components/dashboard/footer.tsx
"use client";
import {cn} from "@/lib/utils/utils";
import {Shield} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  return (
    <footer>
      <div
        className={cn(
          "hidden lg:block border border-border bg-card p-6",
          pathname.startsWith("/admin") && "hidden",
        )}>
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-6">
            <Link
              href="/dashboard/legal/privacy-policy"
              className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link
              href="/dashboard/legal/terms-of-service"
              className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/dashboard/support"
              className="hover:text-foreground hover:decoration-2 transition-colors">
              Contact Support
            </Link>
            <Link href="/dashboard/report" className="hover:text-foreground transition-colors">
              Report Issue
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-xs">256-bit SSL Secure</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs">FDIC Insured up to $250,000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
