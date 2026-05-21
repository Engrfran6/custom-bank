import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {Providers} from "./providers";
import {ChatButton} from "@/components/dashboard/chat/chat-button";
import {createClient} from "@/lib/supabase/server";
import {OfflineIndicator} from "@/components/offline-indicator";
import {Toaster} from "@/components/ui/sonner";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "NeoBank",
  description: "Modern digital banking",
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  // Check admin role
  const {data: profile} = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative">
          <Providers>
            {children}
            {profile?.role !== "admin" && <ChatButton />}
            <OfflineIndicator />
            <Toaster position="top-right" />
          </Providers>
        </div>
      </body>
    </html>
  );
}
