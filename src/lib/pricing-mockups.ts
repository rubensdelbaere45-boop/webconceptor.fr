/**
 * 3 propositions de design pour le pricing modal "Publier mon site".
 *
 * Une seule offre : Tout compris 320 € + 17,90 €/mois (Tom a unifié l'offre,
 * plus le choix Simple vs Tout compris qui paralysait le prospect).
 *
 * Couleurs adaptatives via param : { primary, accent } injectés en CSS vars
 * pour matcher la palette du template du prospect.
 */

type Opts = {
  primary: string;
  accent: string;
  palette: string;
  prospectName: string;
};

const SHARED_HEAD = (primary: string, accent: string, title: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Pricing preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet">
<style>
  :root { --primary: ${primary}; --accent: ${accent}; }
  body { font-family: "Inter", system-ui, sans-serif; }
  .serif { font-family: "DM Serif Display", "Cormorant Garamond", serif; }
  .serif-italic { font-family: "DM Serif Display", "Cormorant Garamond", serif; font-style: italic; }
  .cormorant { font-family: "Cormorant Garamond", serif; }
</style>
</head>`;

/* ═══════════════════════════════════════════════════════════════
   VARIANT A — "Premium éditorial" 2 colonnes
   ═══════════════════════════════════════════════════════════════ */
export function buildPricingA(opts: Opts): string {
  const { primary, accent, prospectName } = opts;
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

  return `${SHARED_HEAD(primary, accent, "Variant A — Éditorial")}
<body class="min-h-screen flex items-center justify-center p-6" style="background:linear-gradient(135deg,#1a1313 0%,#0a0606 100%)">

  <div class="bg-[#fdfbf7] rounded-3xl max-w-6xl w-full overflow-hidden grid md:grid-cols-2 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative" style="max-height:92vh">

    <!-- Header back / close -->
    <div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-5 md:p-7">
      <button class="text-[12px] font-medium tracking-wider uppercase flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <span aria-hidden>←</span> Continuer la maquette
      </button>
      <button class="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center transition" aria-label="Fermer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- COL GAUCHE : Aperçu site -->
    <div class="relative bg-gradient-to-br from-[#f5eee6] to-[#e8dfd4] p-8 md:p-12 pt-20 md:pt-24 flex flex-col items-center justify-center min-h-[460px] md:min-h-[680px]">

      <div class="text-[11px] tracking-[0.25em] uppercase font-semibold opacity-60 mb-5">— Aperçu de votre site</div>

      <!-- Mini mockup site type fleuriste -->
      <div class="relative w-full max-w-[320px] rounded-2xl overflow-hidden bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)]" style="aspect-ratio:9/16">
        <!-- Nav -->
        <div class="px-4 py-3 flex items-center justify-between bg-white/95 backdrop-blur border-b border-black/5">
          <div class="serif text-sm italic">${esc(prospectName)}</div>
          <div class="text-[8px] tracking-widest uppercase opacity-50">MENU</div>
        </div>
        <!-- Hero photo -->
        <div class="relative aspect-[3/4] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&q=85" class="w-full h-full object-cover" alt=""/>
          <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.5))"></div>
          <div class="absolute bottom-3 left-3 right-3 text-white">
            <div class="text-[8px] tracking-widest uppercase opacity-80">— Fleuriste · ${esc(prospectName.includes("Ô") ? "Niort" : "votre ville")}</div>
            <div class="cormorant text-xl font-medium mt-1">Les fleurs, <span class="italic">comme une émotion.</span></div>
          </div>
        </div>
      </div>

      <!-- URL preview -->
      <div class="mt-5 flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-full bg-black/5">
        <span class="w-2 h-2 rounded-full bg-green-500"></span>
        <span class="opacity-70">https://${esc(prospectName.toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}.fr</span>
      </div>

      <div class="mt-5 text-center text-[12px] opacity-60 italic cormorant">
        Voici à quoi ressemblera votre site une fois publié.
      </div>
    </div>

    <!-- COL DROITE : Offre -->
    <div class="p-8 md:p-12 pt-20 md:pt-24 overflow-y-auto" style="max-height:92vh">

      <div class="text-[11px] tracking-[0.25em] uppercase font-semibold mb-4" style="color:var(--primary)">— Votre site web pro</div>
      <h1 class="serif text-4xl md:text-5xl leading-[1.05] mb-3">${esc(prospectName)}</h1>
      <p class="text-base leading-relaxed opacity-70 mb-8">Site livré en quelques minutes après paiement. Hébergement, modifications, support : tout est inclus.</p>

      <!-- Inclus -->
      <ul class="space-y-3 mb-8">
        ${[
          ["Création sur-mesure (design premium)", "Adapté à votre métier et votre ville"],
          ["Hébergement & domaine .fr inclus", "SSL, sauvegardes, monitoring 24/7"],
          ["Modifications illimitées", "Demandez par mail, on s'occupe de tout"],
          ["Support prioritaire", "Réponse sous 24 h ouvrées"],
          ["Garantie satisfait 14 jours", "Remboursement intégral sans question"],
        ].map(([t, sub]) => `
          <li class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full grid place-items-center shrink-0 mt-0.5" style="background:var(--primary);color:#fff">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="font-semibold text-sm">${t}</div>
              <div class="text-xs opacity-60 mt-0.5">${sub}</div>
            </div>
          </li>
        `).join("")}
      </ul>

      <!-- Card prix -->
      <div class="rounded-2xl p-6 mb-5 border-2" style="border-color:var(--primary);background:linear-gradient(135deg,${primary}10,${accent}08)">
        <div class="flex items-end justify-between mb-3">
          <div>
            <div class="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-60 mb-1">Tout compris</div>
            <div class="flex items-baseline gap-2">
              <span class="serif text-5xl" style="color:var(--primary)">320 €</span>
              <span class="text-sm opacity-60">TTC</span>
            </div>
            <div class="flex items-baseline gap-1 mt-1.5">
              <span class="text-base font-semibold opacity-80">+ 17,90 €</span>
              <span class="text-xs opacity-60">/mois (hébergement & maintenance)</span>
            </div>
          </div>
        </div>
        <div class="text-xs opacity-70 mb-4 italic">Ou 3 × 106,67 € sans frais.<br>Mensuel annulable à tout moment.</div>
        <button class="w-full py-4 rounded-full font-bold text-sm uppercase tracking-wider transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg" style="background:#0a0a0a;color:#fff;box-shadow:0 12px 30px -10px rgba(0,0,0,0.4)">
          Publier mon site
          <span aria-hidden>→</span>
        </button>
      </div>

      <!-- Réassurance bandeau -->
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] tracking-wider uppercase opacity-60">
        <span class="flex items-center gap-1.5">🔒 Stripe sécurisé</span>
        <span>·</span>
        <span>14 j garantis</span>
        <span>·</span>
        <span>247 sites livrés</span>
      </div>
    </div>
  </div>

</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT B — "Apple Store" centré monumental
   ═══════════════════════════════════════════════════════════════ */
export function buildPricingB(opts: Opts): string {
  const { primary, accent, prospectName } = opts;
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

  return `${SHARED_HEAD(primary, accent, "Variant B — Apple Store")}
<body class="min-h-screen flex items-center justify-center p-6 relative" style="background:#fafafa">

  <!-- Décor radial subtil -->
  <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at top,${primary}08,transparent 50%),radial-gradient(ellipse at bottom,${accent}08,transparent 50%)"></div>

  <div class="max-w-2xl w-full relative">

    <!-- Close -->
    <button class="absolute -top-2 -right-2 md:top-0 md:right-0 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 grid place-items-center transition z-10" aria-label="Fermer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <!-- Hero monumental -->
    <div class="text-center mb-10">
      <div class="text-[11px] tracking-[0.25em] uppercase font-semibold opacity-60 mb-5">— ${esc(prospectName)}</div>
      <h1 class="text-5xl md:text-7xl leading-[1.02] mb-5 font-bold tracking-tight">
        Publiez votre site<br>
        <span style="background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">en 2 minutes.</span>
      </h1>
      <p class="text-lg opacity-70 max-w-md mx-auto">Prêt en quelques minutes après paiement. Tout est déjà là, il ne reste qu'à publier.</p>
    </div>

    <!-- Card centrale -->
    <div class="bg-white rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-8 md:p-10 border border-black/5">

      <!-- Mini preview iPhone-like -->
      <div class="flex justify-center mb-8">
        <div class="relative">
          <div class="w-[180px] h-[260px] rounded-[28px] overflow-hidden bg-black p-1.5" style="box-shadow:0 16px 40px -12px rgba(0,0,0,0.3)">
            <div class="w-full h-full rounded-[22px] overflow-hidden bg-white relative">
              <!-- Notch -->
              <div class="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full z-10"></div>
              <!-- Site preview -->
              <img src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&q=85" class="w-full h-full object-cover" alt=""/>
              <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.6))"></div>
              <div class="absolute bottom-3 left-3 right-3 text-white">
                <div class="serif italic text-base leading-tight">${esc(prospectName)}</div>
                <div class="text-[8px] uppercase tracking-widest opacity-80 mt-1">Fleuriste</div>
              </div>
            </div>
          </div>
          <!-- Status badge -->
          <div class="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <span class="w-1.5 h-1.5 rounded-full bg-white"></span> Prêt
          </div>
        </div>
      </div>

      <!-- Prix -->
      <div class="text-center mb-8">
        <div class="text-[11px] tracking-[0.25em] uppercase font-semibold opacity-60 mb-3">Tout compris</div>
        <div class="flex items-baseline justify-center gap-2">
          <span class="text-6xl md:text-7xl font-bold tracking-tight">320 €</span>
          <span class="text-base opacity-50">TTC</span>
        </div>
        <div class="text-base opacity-70 mt-2">
          + <span class="font-semibold" style="color:var(--primary)">17,90 €</span> / mois <span class="opacity-60">· hébergement & support</span>
        </div>
        <div class="text-xs opacity-50 mt-2">Ou 3 × 106,67 € sans frais · Annulable à tout moment</div>
      </div>

      <!-- CTA -->
      <button class="w-full py-5 rounded-2xl font-semibold text-base transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 mb-7" style="background:#0a0a0a;color:#fff;box-shadow:0 12px 30px -10px rgba(0,0,0,0.4)">
        Publier mon site
        <span aria-hidden>→</span>
      </button>

      <!-- Garanties grid -->
      <div class="grid grid-cols-2 gap-3 mb-7">
        ${[
          ["✨", "Hébergement inclus"],
          ["✏️", "Modifs illimitées"],
          ["🛡️", "Garantie 14 jours"],
          ["🔒", "Stripe sécurisé"],
        ].map(([icon, t]) => `
          <div class="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
            <span class="text-lg">${icon}</span>
            <span class="text-sm font-medium">${t}</span>
          </div>
        `).join("")}
      </div>

      <!-- Témoignage micro -->
      <div class="pt-6 border-t border-black/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full grid place-items-center text-white font-bold text-sm" style="background:var(--primary)">CB</div>
          <div class="flex-1">
            <p class="text-sm italic leading-snug cormorant">"Site livré en 3 h, sublime. Mes premiers clients ont commandé le lendemain."</p>
            <div class="text-xs opacity-60 mt-1">— Camille B., fleuriste à Niort · ⭐⭐⭐⭐⭐</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   VARIANT C — "Confiance institutionnelle"
   ═══════════════════════════════════════════════════════════════ */
export function buildPricingC(opts: Opts): string {
  const { primary, accent, prospectName } = opts;
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

  return `${SHARED_HEAD(primary, accent, "Variant C — Confiance institutionnelle")}
<body class="min-h-screen flex items-center justify-center p-4 md:p-6" style="background:linear-gradient(135deg,#f5f5f4 0%,#fafaf9 100%)">

  <div class="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.15)] relative">

    <!-- Header bandeau institutionnel -->
    <div class="px-7 py-4 border-b border-gray-200 flex items-center justify-between" style="background:#fafafa">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full grid place-items-center text-white font-bold text-xs" style="background:linear-gradient(135deg,var(--primary),var(--accent))">K</div>
        <div>
          <div class="font-bold text-sm leading-tight">Klyora</div>
          <div class="text-[10px] uppercase tracking-widest opacity-60">Votre site web professionnel</div>
        </div>
      </div>
      <button class="w-9 h-9 rounded-full hover:bg-gray-100 grid place-items-center transition" aria-label="Fermer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="p-7 md:p-10">

      <!-- Titre -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase" style="background:${primary}15;color:var(--primary)">
          <span>●</span> Offre unique · Tout compris
        </div>
        <h1 class="serif text-4xl md:text-5xl leading-[1.05] mb-3">${esc(prospectName)}</h1>
        <p class="text-sm opacity-70">Site web professionnel sur-mesure · Hébergement & maintenance inclus</p>
      </div>

      <!-- Cadre prix institutionnel -->
      <div class="rounded-xl border-2 p-6 md:p-8 mb-6" style="border-color:var(--primary);background:linear-gradient(180deg,${primary}06,#ffffff)">

        <div class="flex items-baseline justify-center gap-3 mb-2">
          <span class="serif text-6xl md:text-7xl font-medium" style="color:var(--primary)">320 €</span>
          <span class="text-base opacity-60 font-medium">TTC</span>
        </div>
        <div class="text-center text-sm opacity-70 mb-1">
          Création du site (paiement unique)
        </div>
        <div class="text-center font-semibold mt-3 text-base">
          + <span style="color:var(--primary)">17,90 €</span> / mois
          <span class="text-sm font-normal opacity-60">· Hébergement, sauvegardes, support</span>
        </div>

        <hr class="my-6 border-gray-200">

        <!-- Liste détaillée garanties -->
        <ul class="space-y-2.5">
          ${[
            "Création sur-mesure (design adapté à votre métier)",
            "Hébergement premium SSL inclus à vie",
            "Modifications illimitées (par mail)",
            "Domaine .fr offert (1ère année)",
            "Support prioritaire sous 24 h ouvrées",
            "Sauvegardes automatiques quotidiennes",
            "Adresses email pro @votre-domaine.fr",
            "Statistiques de fréquentation",
            "Résiliable à tout moment (sans frais)",
          ].map(t => `
            <li class="flex items-start gap-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0" style="color:var(--primary)"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${t}</span>
            </li>
          `).join("")}
        </ul>
      </div>

      <!-- CTA -->
      <button class="w-full py-5 rounded-xl font-bold text-base uppercase tracking-wider transition-transform hover:scale-[1.01] flex items-center justify-between gap-2 px-6 mb-5" style="background:linear-gradient(135deg,#0a0a0a,#1f1f1f);color:#fff;box-shadow:0 8px 24px -8px rgba(0,0,0,0.4)">
        <span class="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Publier mon site
        </span>
        <span class="text-sm opacity-80">320 € TTC · 17,90 €/mois</span>
      </button>

      <!-- Réassurance institutionnelle -->
      <div class="grid grid-cols-3 gap-3 py-4 border-y border-gray-100 mb-5">
        <div class="text-center">
          <div class="text-xs font-bold mb-0.5">🔒 STRIPE</div>
          <div class="text-[10px] opacity-60">Paiement sécurisé</div>
        </div>
        <div class="text-center">
          <div class="text-xs font-bold mb-0.5">🛡️ 14 JOURS</div>
          <div class="text-[10px] opacity-60">Garantie remboursée</div>
        </div>
        <div class="text-center">
          <div class="text-xs font-bold mb-0.5">📄 FACTURE</div>
          <div class="text-[10px] opacity-60">Émise immédiatement</div>
        </div>
      </div>

      <!-- Logos paiement -->
      <div class="flex items-center justify-center gap-3 mb-5 opacity-80">
        <div class="px-3 py-1.5 rounded bg-gray-100 text-xs font-bold tracking-tight" style="color:#1a1f71">VISA</div>
        <div class="px-3 py-1.5 rounded bg-gray-100 text-xs font-bold tracking-tight" style="color:#eb001b">MasterCard</div>
        <div class="px-3 py-1.5 rounded bg-gray-100 text-xs font-bold tracking-tight">CB</div>
        <div class="px-3 py-1.5 rounded bg-gray-100 text-xs font-bold tracking-tight" style="color:#003087">PayPal</div>
      </div>

      <!-- Témoignage chiffré -->
      <div class="text-center py-4 px-4 rounded-lg" style="background:#fafafa">
        <div class="flex items-center justify-center gap-3 mb-2">
          <span class="text-2xl tracking-wider" style="color:var(--accent)">⭐⭐⭐⭐⭐</span>
          <span class="font-bold text-lg">4.9/5</span>
        </div>
        <div class="text-sm opacity-80"><span class="font-semibold">247 sites livrés</span> · 96 % de clients satisfaits</div>
      </div>

      <!-- Bandeau support -->
      <div class="mt-6 p-4 rounded-lg flex items-center gap-3 text-sm" style="background:${primary}10;border:1px solid ${primary}30">
        <div class="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style="background:var(--primary)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm leading-tight">Une question avant de payer ?</div>
          <div class="text-xs opacity-70 mt-0.5">Appelez Tom directement · <a href="tel:0635592471" class="font-bold" style="color:var(--primary)">06 35 59 24 71</a></div>
        </div>
      </div>
    </div>
  </div>

</body></html>`;
}
