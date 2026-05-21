import {DashboardShell} from "@/components/dashboard/dashboard-shell";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function DashboardLayout({children}: {children: React.ReactNode}) {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const {data: profile} = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return <DashboardShell variant="admin">{children} </DashboardShell>;
}
