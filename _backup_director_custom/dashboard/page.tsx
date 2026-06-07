import { redirect } from "next/navigation";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/director/login");

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) redirect("/director/login");
  if (acc.is_first_login) redirect("/director/change-password");

  // Recharge dispo
  const { data: packs } = await supabase
    .from("director_credit_packs")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // Dernières actions
  const { data: actions } = await supabase
    .from("director_actions")
    .select("*")
    .eq("account_id", acc.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return <DashboardClient account={acc} packs={packs || []} actions={actions || []} />;
}
