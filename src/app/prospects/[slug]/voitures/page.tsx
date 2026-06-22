/**
 * Page catalogue véhicules dédiée pour un prospect garage/concession.
 *
 * Route : /prospects/[slug]/voitures
 *
 * Affiche tous les véhicules détectés dans site_style_dna.detectedVehicles
 * avec filtres client-side (marque, prix, km, carburant, année) + page
 * fiche individuelle via paramètre URL ?v=<index>.
 *
 * Si pas de véhicules détectés, affiche un placeholder pro avec CTA
 * "Programmer la mise en ligne du catalogue".
 */
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { detectMetierForStock, getStockPhotosForMetier } from "@/lib/stock-photos";
import { enrichVehicles } from "@/lib/enrich-vehicle";
import VoituresCatalog from "./VoituresCatalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebsiteDna = {
  primaryColor?: string | null;
  accentColor?: string | null;
  logoUrl?: string | null;
  detectedVehicles?: Array<{
    title: string;
    price?: string;
    year?: string;
    km?: string;
    fuel?: string;
    image?: string;
    url?: string;
  }>;
};

type Prospect = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  site_style_dna: WebsiteDna | null;
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export default async function VoituresPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = db();
  const { data } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, phone, email, site_style_dna")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  const p = data as Prospect;

  const isGarage = /\b(garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto)\b/i.test(
    (p.business_type || "") + " " + (p.name || "")
  );
  const dna = p.site_style_dna || {};
  const rawVehicles = (dna.detectedVehicles || []).filter(v => v.image && v.image.startsWith("http"));
  // Enrichit chaque véhicule avec consommation, coût plein, autonomie, description AI
  const vehicles = enrichVehicles(rawVehicles);
  const primaryColor = (dna.primaryColor || "#1e40af").toLowerCase();
  const accentColor = (dna.accentColor || "#ff6900").toLowerCase();
  const metier = detectMetierForStock(`${p.business_type || ""} ${p.name || ""}`);
  const stockPhotos = getStockPhotosForMetier(metier, 12);

  return (
    <VoituresCatalog
      prospect={{
        slug: p.slug,
        name: p.name,
        city: p.city,
        phone: p.phone,
        email: p.email,
        isGarage,
      }}
      vehicles={vehicles}
      primaryColor={primaryColor}
      accentColor={accentColor}
      logoUrl={dna.logoUrl || null}
      stockPhotos={stockPhotos}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = db();
  const { data } = await supabase
    .from("prospects")
    .select("name, city")
    .eq("slug", slug)
    .maybeSingle();
  const name = data?.name || "Prospect";
  return {
    title: `Catalogue véhicules — ${name}`,
    robots: { index: false, follow: false },
  };
}
