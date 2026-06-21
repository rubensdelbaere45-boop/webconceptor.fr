/**
 * Génère un mail de prospection humain pour un garage indépendant.
 *
 * Tom : "Ne doit pas faire intelligence artificielle. Bonjour Monsieur,
 * nous sommes tombés sur votre garage qui a absolument magnifiques et
 * qui propose des voitures." + adapter selon nb voitures.
 */

export type GaragePitchInput = {
  garageName: string;
  city?: string | null;
  vehicleCount: number;
  topBrand?: string | null;
  hasReviews?: boolean;
  rating?: number | null;
  siteUrl: string;
};

export type GaragePitch = {
  subject: string;
  htmlBody: string;
  textBody: string;
};

/** Phrase d'accroche selon nb voitures. Pas robotique. */
function openingHook(vehicleCount: number, topBrand: string | null | undefined): string {
  if (vehicleCount >= 30) {
    return `Je suis tombé hier soir sur votre garage en cherchant une voiture pour un ami. Honnêtement, j'ai été impressionné par votre catalogue — vous avez plus de ${vehicleCount} véhicules en ligne${topBrand ? `, dont de belles ${topBrand}` : ""}, et la qualité de votre sélection saute aux yeux.`;
  }
  if (vehicleCount >= 10) {
    return `Je suis tombé sur votre garage cette semaine et j'ai pris le temps de regarder votre stock. ${vehicleCount} véhicules${topBrand ? `, avec une vraie spécialité sur les ${topBrand}` : ""} — j'ai trouvé ça vraiment soigné.`;
  }
  if (vehicleCount >= 3) {
    return `Je suis tombé sur votre garage par hasard et j'ai aimé ce que je voyais — chaque véhicule a l'air bien présenté, ça donne confiance.`;
  }
  return `Je suis tombé sur votre garage récemment et je me suis dit qu'avec vos années de métier, vous mériteriez une vraie vitrine en ligne à la hauteur.`;
}

/** Le pitch principal. Pas robotique. */
function pitch(garageName: string, city: string | null | undefined, vehicleCount: number): string {
  const cityPart = city ? ` à ${city}` : "";
  if (vehicleCount >= 10) {
    return `Du coup, j'ai pris la liberté de vous monter une maquette de site web sur-mesure, avec votre catalogue actuel intégré et un système de prise de RDV pour les essais. Pas un truc générique — un vrai site rien que pour <strong>${garageName}</strong>${cityPart}.`;
  }
  return `Du coup, j'ai pris la liberté de vous monter une maquette de site web sur-mesure pour <strong>${garageName}</strong>${cityPart}. Avec un onglet véhicules prêt à recevoir tout votre stock, et un système de prise de RDV pour les essais.`;
}

/** Le call-to-action final. */
function cta(siteUrl: string): string {
  return `<a href="${siteUrl}" style="display:inline-block;padding:18px 42px;background:#dc143c;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px">Voir ma maquette →</a>`;
}

export function buildGaragePitchEmail(input: GaragePitchInput): GaragePitch {
  const { garageName, city, vehicleCount, topBrand, siteUrl } = input;
  const firstName = (garageName.split(/[\s,—-]/)[0] || "").trim();
  const cityPart = city ? ` à ${city}` : "";

  const subjects = [
    `${garageName} — une maquette de site, prête (juste à voir)`,
    `${garageName} — j'ai monté un site pour vous (à vous de juger)`,
    vehicleCount >= 10
      ? `Vos ${vehicleCount} voitures méritent un meilleur site, ${firstName}`
      : `${garageName}${cityPart} — votre site web, prêt à l'envoi`,
  ];
  const subject = subjects[vehicleCount % subjects.length];

  const opening = openingHook(vehicleCount, topBrand);
  const pitchLine = pitch(garageName, city, vehicleCount);

  const htmlBody = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1310">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:40px 32px">
<p style="font-size:16px;margin:0 0 16px">Bonjour,</p>
<p style="font-size:16px;line-height:1.7;margin:0 0 16px">${opening}</p>
<p style="font-size:16px;line-height:1.7;margin:0 0 20px">${pitchLine}</p>
<p style="font-size:16px;line-height:1.7;margin:0 0 28px">C'est gratuit, vous n'avez rien à signer. Cliquez juste pour voir si ça vous plaît.</p>
<div style="text-align:center;margin:32px 0">${cta(siteUrl)}</div>
<p style="font-size:15px;line-height:1.7;margin:24px 0 16px;color:#4a4340">Si vous aimez, on peut le mettre en ligne pour <strong>320 €</strong> tout compris (1× ou 3× sans frais). Si ça vous plaît pas, vous le dites et on n'en parle plus — pas un centime à débourser.</p>
<p style="font-size:15px;line-height:1.7;margin:24px 0 0;color:#4a4340">À très vite,</p>
<p style="font-size:15px;margin:0 0 4px"><strong>Tom Bauer</strong></p>
<p style="font-size:13px;color:#8b7e6e;margin:0">Klyora Sites · 06 35 59 24 71 · <a href="mailto:contact@klyora.fr" style="color:#dc143c">contact@klyora.fr</a></p>
</div>
</body></html>`;

  const textBody = `Bonjour,

${opening.replace(/<[^>]+>/g, "")}

${pitchLine.replace(/<[^>]+>/g, "")}

C'est gratuit, vous n'avez rien à signer. Cliquez juste pour voir si ça vous plaît :
${siteUrl}

Si vous aimez, on peut le mettre en ligne pour 320 € tout compris (1× ou 3× sans frais). Si ça vous plaît pas, vous le dites et on n'en parle plus.

À très vite,
Tom Bauer
Klyora Sites · 06 35 59 24 71 · contact@klyora.fr`;

  return { subject, htmlBody, textBody };
}
