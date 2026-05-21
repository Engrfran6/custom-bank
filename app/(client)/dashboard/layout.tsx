import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {FraudProvider} from "@/lib/context/fraud-context";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <FraudProvider>
      <DashboardShell variant="client">{children}</DashboardShell>
    </FraudProvider>
  );
}
