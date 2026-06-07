import { redirect } from "next/navigation";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";
import WelcomeClient from "./WelcomeClient";

export const dynamic = "force-dynamic";

interface PainPoint {
  icon: string;
  title: string;
  description: string;
  action_label: string;
  action_target: "campaign_visibility" | "agent_reputation" | "agent_seo" | "campaign_local";
  tokens_cost: number;
}

async function detectPainPoints(accountId: string): Promise<{ businessName: string; pains: PainPoint[]; tokens: number }> {
  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("business_name, business_type, city, prospect_id, tokens_balance")
    .eq("id", accountId)
    .maybeSingle();

  if (!acc) return { businessName: "votre entreprise", pains: [], tokens: 0 };

  // Récupère les données du prospect (note Google, site web, etc.)
  interface ProspectData {
    google_rating: number | null;
    website: string | null;
    google_reviews_count: number | null;
    is_outdated: boolean | null;
    is_pre_2015: boolean | null;
  }
  let prospect: ProspectData | null = null;
  if (acc.prospect_id) {
    const { data: p } = await supabase
      .from("prospects")
      .select("google_rating, website, google_reviews_count, is_outdated, is_pre_2015")
      .eq("id", acc.prospect_id)
      .maybeSingle();
    prospect = (p as unknown as ProspectData) || null;
  }

  const pains: PainPoint[] = [];

  // Douleur 1 : pas de site OU site obsolète
  if (!prospect?.website) {
    pains.push({
      icon: "🌐",
      title: "Vous êtes invisible sur Google",
      description: "Sans site web, 70 % des recherches locales aboutissent chez vos concurrents.",
      action_label: "Lancer campagne Visibilité",
      action_target: "campaign_visibility",
      tokens_cost: 50,
    });
  } else if (prospect.is_pre_2015 || prospect.is_outdated) {
    pains.push({
      icon: "🦕",
      title: "Votre site est obsolète",
      description: "Vos clients arrivent sur un site qui n'est plus adapté aux standards 2026.",
      action_label: "Activer Agent Refonte",
      action_target: "agent_seo",
      tokens_cost: 80,
    });
  }

  // Douleur 2 : note basse OU peu d'avis
  if (prospect?.google_rating !== null && prospect?.google_rating !== undefined && prospect.google_rating < 3.8) {
    pains.push({
      icon: "⭐",
      title: `Votre note Google est ${prospect.google_rating?.toFixed(1)}/5`,
      description: "Les clients filtrent par note. En dessous de 4, vous êtes invisible.",
      action_label: "Activer Agent Réputation",
      action_target: "agent_reputation",
      tokens_cost: 60,
    });
  } else if (!prospect?.google_reviews_count || prospect.google_reviews_count < 10) {
    pains.push({
      icon: "⭐",
      title: "Vous avez peu d'avis Google",
      description: "Sans volume d'avis, Google ne vous remonte pas dans le pack local.",
      action_label: "Activer Agent Réputation",
      action_target: "agent_reputation",
      tokens_cost: 60,
    });
  }

  // Douleur 3 : trafic local — toujours pertinent
  pains.push({
    icon: "🎯",
    title: `Vos concurrents à ${acc.city || "votre ville"} captent vos clients`,
    description: "Une campagne Google Ads ciblée + une fiche Business optimisée changent tout.",
    action_label: "Lancer Pack Local",
    action_target: "campaign_local",
    tokens_cost: 100,
  });

  return {
    businessName: acc.business_name || "votre entreprise",
    pains: pains.slice(0, 3),
    tokens: acc.tokens_balance,
  };
}

export default async function WelcomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/director/login");

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, is_first_login")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!acc) redirect("/director/login");
  if (acc.is_first_login) redirect("/director/change-password");

  const { businessName, pains, tokens } = await detectPainPoints(acc.id);

  return <WelcomeClient businessName={businessName} pains={pains} tokens={tokens} />;
}
