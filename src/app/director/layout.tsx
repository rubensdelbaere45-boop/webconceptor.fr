/**
 * Layout WebDirector — 100% indépendant de l'UI existante (/prospects/[slug]).
 * Dark mode premium gamifié, design tokens autonomes.
 */
import type { Metadata } from "next";
import { DIRECTOR_BASE_CSS } from "@/lib/director/design-tokens";

export const metadata: Metadata = {
  title: "WebDirector — Le pilote IA de votre business",
  description: "Pilotez vos publicités Google/Meta et activez des agents IA en 1 clic, avec votre solde de crédits.",
  robots: { index: false, follow: false }, // saas privé, pas indexable
};

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: DIRECTOR_BASE_CSS }} />
      <div className="director-app">
        {children}
      </div>
    </>
  );
}
