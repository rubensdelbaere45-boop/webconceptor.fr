/**
 * Layout Klyora Director — 100% indépendant de l'UI existante (/prospects/[slug]).
 * Design system intégré via _app/director.css (Stripe/Linear/Mercury style).
 */
import type { Metadata } from "next";
import "./_app/director.css";

export const metadata: Metadata = {
  title: "Klyora Director — Le pilote IA de votre business",
  description: "Pilotez vos publicités Google/Meta et activez des agents IA en 1 clic, avec votre solde de crédits.",
  robots: { index: false, follow: false }, // saas privé, pas indexable
};

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return <div className="director-root">{children}</div>;
}
