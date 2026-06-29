/**
 * Page preview des 3 propositions de design pricing modal.
 *
 * URLs :
 *   /preview/pricing/a → "Premium éditorial" 2 cols
 *   /preview/pricing/b → "Apple Store" centré monumental
 *   /preview/pricing/c → "Confiance institutionnelle" liste garanties
 *
 * Couleurs adaptatives via query params :
 *   ?primary=%23c89697&accent=%23b8956d&palette=rose
 *
 * Par défaut : palette "fleuriste Bohème Rose" (rose poudré + or rosé mat).
 */
import { buildPricingA, buildPricingB, buildPricingC } from "@/lib/pricing-mockups";

export const dynamic = "force-dynamic";

type Params = { variant: string };
type SearchParams = { primary?: string; accent?: string; palette?: string; name?: string };

export default async function PricingPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { variant } = await params;
  const sp = await searchParams;
  const primary = sp.primary || "#c89697";
  const accent = sp.accent || "#b8956d";
  const palette = sp.palette || "rose-poudre";
  const name = sp.name || "Fleurs Ô Naturel";

  let html: string;
  if (variant === "a") html = buildPricingA({ primary, accent, palette, prospectName: name });
  else if (variant === "b") html = buildPricingB({ primary, accent, palette, prospectName: name });
  else if (variant === "c") html = buildPricingC({ primary, accent, palette, prospectName: name });
  else html = `<h1>Variant inconnu. Utilise /preview/pricing/a, /b ou /c</h1>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export const metadata = {
  title: "Pricing preview — Klyora",
  robots: { index: false, follow: false },
};
