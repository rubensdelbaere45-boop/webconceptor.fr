/* ══════════════════════════════════════════
   MOCKUP STITCH PLOMBIER — pixel-pixel + sections vendeuses

   Source: stitch_klyora_stitch_templates/plombier_name_1
   - Garde les images Stitch d'origine (AIDA Google, HTTP 200)
   - Hero + Emergency banner + Bento 4 services + Footer Stitch
   - + 4 sections vendeuses (Process, Pourquoi nous, Avis, CTA finale)
   - Templater nom, ville, tél, email, adresse + injecter avis/horaires
   ══════════════════════════════════════════ */

export interface PlombierFullProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
}

function escape(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Images Stitch ORIGINALES vérifiées HTTP 200
const STITCH_HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuD_v8DGCFuaDzVSF6HY8SEUReLIdYtZVsKKFQxYPBPZDq5WCbnl8szCG6FFSQUdCPviUj5NYbVDSAty2DPx-6aBX8abXu-t3XRSF_PMDTtYuPbwnazkYpcgtiQPBixyOYHA9hW2L-rB5bNn6Qf5zG8hWp-6OurtsUvjRu5nbyM9S2JtbjR5IwQR649jxS8AH9LUcmG0B3oBb51nIJEo2a54RfWxGpigcX7i3xSLWOI2b0vKfGKVSGExKK6ud-M9_4SZJGppCc4J5cY";
const STITCH_FAUCET = "https://lh3.googleusercontent.com/aida-public/AB6AXuDpw6rGl1fm2ly721JZ2o-WXVT0Yx96hGoRKkbqLDsCucz6XIif7CaaM7K6ug37J2b6MY7Na3VSXrsR0iSXGb9aqCdYAfXFiGW9CMyOIH_TiPlP8f0YF3BI6j7q2DNr4SRApN3eg3OvgVUY8vbKI_oMY0_T05cjPbYyvDtiYyIZZbrrrPkabHzgH_-CO5ZFE1hGTjhJBZOrrw51ffXUdgnQcIBPVdns2BWtkgP2E2RRIDUDsJJgoO0gbdPH-y_ktdYL3g0ZHhtwhw0";
const STITCH_TOOLS = "https://lh3.googleusercontent.com/aida-public/AB6AXuC1worMPDqAuwSCZI1Kq2c8U1GLiClQVAtuFXeB5c954_-589JfCRoL4dttZoZ3TI1Y7L95cX6ZXs1aCg462nPlGleeJQJLVQK0b6rwt18WQj9ERlKNEYT51oyomo-i_Md_zw1uxSGPSTz4zffziShZ1N6w3bwU_abcL51qjsOjvAt4yiysvFP2Qfp-qti3wvzuGRpb6AzP0py_PD8jGBTIjt7KNAi6MqJwMriW67kSzxL74b_R4avlo0IkfmPZYCSH6-KW_Gg4a1o";

export function generateStitchPlombierFullMockupHtml(p: PlombierFullProspect): string {
  const name = escape(p.name);
  const nameUpper = name.toUpperCase();
  const city = escape(p.city || "");
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const hasReviews = reviews.length > 0;
  const reviewsHtml = hasReviews ? reviews.map(r => `
    <div class="bg-white rounded-xl border border-outline-variant p-8 paper-shadow flex flex-col gap-4 hover:border-[#1e40af] transition-colors">
      <div class="flex gap-1 text-[#ca8a04]">${Array(Math.max(1, Math.round(r.rating || 5))).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1; font-size: 18px;">star</span>').join("")}</div>
      <p class="text-on-surface-variant italic leading-relaxed text-sm">«&nbsp;${escape(r.text || "").slice(0, 220)}${(r.text || "").length > 220 ? "…" : ""}&nbsp;»</p>
      <div class="mt-auto pt-4 border-t border-outline-variant">
        <div class="font-label-lg text-primary text-sm">${escape(r.author || "Client Google")}</div>
        ${r.timeAgo ? `<div class="text-xs text-on-surface-variant uppercase tracking-widest">${escape(r.timeAgo)}</div>` : ""}
      </div>
    </div>
  `).join("") : "";

  const ratingBadge = (p.google_rating && p.google_reviews_count)
    ? `<div class="flex items-center justify-center gap-3 mt-6"><div class="flex gap-1 text-[#ca8a04]">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="font-label-lg">${p.google_rating}/5 — ${p.google_reviews_count} avis Google</span></div>`
    : "";

  // Parse horaires : transforme "lundi: 08:30 – 12:00, 13:30 – 18:00 | mardi: ..."
  // en table propre avec 1 jour par ligne.
  const hoursLines = (p.hours || "")
    .split(/\s*\|\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  const hoursHtml = hoursLines.length ? `
    <div class="bg-white border border-outline-variant p-8 paper-shadow text-left">
      <div class="flex items-center gap-3 mb-5">
        <span class="material-symbols-outlined text-[#1e40af] text-3xl" style="font-variation-settings: 'FILL' 1;">schedule</span>
        <h3 class="font-headline-lg text-xl">Horaires</h3>
      </div>
      <table class="w-full text-sm">
        <tbody>
          ${hoursLines.map(line => {
            const m = line.match(/^([^:]+):\s*(.+)$/);
            if (!m) return `<tr><td colspan="2" class="py-1.5 text-on-surface-variant">${escape(line)}</td></tr>`;
            const day = escape(m[1].trim());
            const hrs = escape(m[2].trim());
            const isClosed = /ferm[ée]/i.test(hrs);
            return `<tr class="border-b border-outline-variant/40 last:border-0">
              <td class="py-2 capitalize font-medium text-on-surface w-1/3">${day}</td>
              <td class="py-2 text-on-surface-variant ${isClosed ? 'italic opacity-60' : ''}">${hrs}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>` : "";

  return `<!DOCTYPE html>
<!-- Design Klyora Sites — https://klyora.fr · Maquette personnalisée pour ${name} -->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<title>${name} — Plombier${city ? ` à ${city}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    darkMode: "class",
    theme: { extend: {
      colors: {
        "surface-container-lowest": "#ffffff", "surface-container-low": "#f7f3f2",
        "surface-container": "#f1edec", "surface-container-high": "#ebe7e6",
        "surface-container-highest": "#e5e2e1", "surface": "#fdf8f8",
        "background": "#fdf8f8", "on-background": "#1c1b1b",
        "primary": "#000000", "on-primary": "#ffffff", "inverse-surface": "#313030",
        "on-surface": "#1c1b1b", "on-surface-variant": "#444748",
        "outline": "#747878", "outline-variant": "#c4c7c7"
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: { "stack-gap": "1rem", "desktop-padding": "4rem", "container-max": "1200px", "section-gap": "5rem", "mobile-padding": "1.5rem" },
      fontFamily: { "headline-display": ["EB Garamond"], "headline-lg": ["EB Garamond"], "label-sm": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"] },
      fontSize: {
        "headline-display": ["48px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }]
      }
    }}
  };
</script>
<style>
  body { font-family: "Plus Jakarta Sans", sans-serif; background: #fdf8f8; color: #1c1b1b; }
  .texture-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .paper-shadow { box-shadow: 0 4px 8px -2px rgba(0,0,0,0.04); }
</style>
</head>
<body class="antialiased min-h-screen flex flex-col">
<div class="texture-overlay"></div>

<!-- NAV (sticky sous la sales-ui-bar de 54px) -->
<nav class="sticky top-[54px] w-full z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant shadow-sm" id="navbar">
  <div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
    <a class="font-headline-lg text-3xl tracking-tighter text-primary flex items-center gap-2" href="#">
      <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">plumbing</span>
      ${nameUpper}
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#services">Services</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#process">Comment ça marche</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#avis">Avis</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
      ${phoneNoSpace ? `<a class="inline-flex items-center justify-center bg-primary text-on-primary font-label-lg px-6 py-3 hover:bg-inverse-surface transition-colors" href="tel:${phoneNoSpace}">DEVIS GRATUIT</a>` : ""}
    </div>
    <button class="md:hidden text-primary p-2"><span class="material-symbols-outlined text-2xl">menu</span></button>
  </div>
</nav>

<!-- EMERGENCY BANNER (compact, pas de pt-24 inutile car la nav est sticky) -->
<div class="bg-[#1e40af] text-white py-2.5 px-mobile-padding md:px-desktop-padding text-center shadow-md">
  <div class="max-w-container-max mx-auto flex items-center justify-center gap-2">
    <span class="material-symbols-outlined animate-pulse text-[#0ea5e9] text-base" style="font-variation-settings: 'FILL' 1;">emergency</span>
    <span class="font-label-lg tracking-widest uppercase text-xs md:text-sm">Disponible 7j/7 — Délai d'intervention 2h max</span>
  </div>
</div>

<main class="flex-grow">
<!-- HERO (pixel-pixel Stitch) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-12">
    <div class="flex-1 space-y-8">
      <h1 class="font-headline-display text-4xl md:text-5xl text-primary leading-tight">${name}</h1>
      <p class="text-lg text-on-surface-variant max-w-lg leading-relaxed">
        Dépannage rapide et travaux propres${city ? ` à <span class="font-bold text-[#1e40af]">${city}</span>` : ""}.
        Une expertise artisanale pour vos installations sanitaires, avec la garantie d'un travail soigné.
      </p>
      ${ratingBadge ? `<div>${ratingBadge}</div>` : ""}
      <div class="flex flex-col sm:flex-row gap-4 pt-4">
        ${phoneNoSpace ? `<a class="inline-flex items-center justify-center gap-2 bg-[#1e40af] text-white font-label-lg px-8 py-4 rounded hover:bg-[#1e3a8a] transition-all shadow-md hover:shadow-lg" href="tel:${phoneNoSpace}"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>INTERVENTION URGENTE</a>` : ""}
        <a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-primary px-8 py-4 rounded hover:bg-surface-container-low transition-colors" href="#services">NOS PRESTATIONS</a>
      </div>
    </div>
    <div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden relative paper-shadow border border-outline-variant bg-surface-container">
      <img class="object-cover w-full h-full absolute inset-0" alt="Plomberie ${name}" src="${STITCH_HERO}"/>
    </div>
  </div>
</section>

<!-- SERVICES BENTO GRID (pixel-pixel Stitch) -->
<section id="services" class="py-section-gap bg-surface-container-lowest px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant">
  <div class="max-w-container-max mx-auto">
    <div class="mb-12">
      <h2 class="font-headline-lg text-3xl md:text-4xl text-primary mb-4">Notre Savoir-Faire</h2>
      <div class="w-24 h-1 bg-[#1e40af]"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Urgent Leak (big with bg image) -->
      <div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors relative overflow-hidden flex flex-col justify-end min-h-[300px]">
        <div class="absolute inset-0 z-0"><img class="object-cover w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-500 mix-blend-multiply" alt="" src="${STITCH_FAUCET}"/></div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-[#1e40af] text-white rounded-full flex items-center justify-center mb-6 shadow-md"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">water_drop</span></div>
          <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Urgence fuite</h3>
          <p class="text-on-surface-variant max-w-md">Intervention immédiate pour limiter les dégâts. Recherche de fuite non destructive et réparation pérenne.</p>
        </div>
      </div>
      <!-- Water Heater -->
      <div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#0ea5e9] transition-colors flex flex-col">
        <div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6"><span class="material-symbols-outlined">water_heater</span></div>
        <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Chauffe-eau</h3>
        <p class="text-on-surface-variant flex-grow">Dépannage, détartrage et remplacement de ballons d'eau chaude électriques et thermodynamiques.</p>
      </div>
      <!-- Unclogging -->
      <div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors flex flex-col">
        <div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6"><span class="material-symbols-outlined">plumbing</span></div>
        <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Débouchage</h3>
        <p class="text-on-surface-variant flex-grow">Intervention rapide sur canalisations engorgées, siphons et colonnes d'évacuation. Outils professionnels adaptés.</p>
      </div>
      <!-- Renovation (big with side image) -->
      <div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow flex flex-col md:flex-row gap-8 items-center">
        <div class="flex-1">
          <div class="w-12 h-12 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center mb-6 shadow-md"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bathtub</span></div>
          <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Rénovation &amp; Installation</h3>
          <p class="text-on-surface-variant mb-6">Création ou rénovation complète de salles de bain. Installation de sanitaires haut de gamme, douches à l'italienne et réseaux complets.</p>
          <a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-primary px-6 py-3 rounded hover:bg-surface-container-low transition-colors uppercase" href="#contact">Demander une étude</a>
        </div>
        <div class="w-full md:w-1/2 aspect-square md:aspect-auto md:h-full rounded-lg overflow-hidden relative">
          <img class="object-cover w-full h-full absolute inset-0" alt="Outils plomberie" src="${STITCH_TOOLS}"/>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- COMMENT ÇA MARCHE (nouveau) -->
<section id="process" class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-[#1e40af] uppercase tracking-[0.2em] mb-4 inline-block">Notre méthode</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Comment ça se passe</h2>
      <div class="w-24 h-1 bg-[#1e40af] mx-auto mt-6"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="bg-white p-8 border border-outline-variant relative paper-shadow"><span class="absolute -top-6 left-8 w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-headline-lg text-xl rounded-full">1</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Appel rapide</h3><p class="text-on-surface-variant text-sm">Vous nous appelez, nous évaluons l'urgence et planifions l'intervention sous 2h pour les fuites.</p></div>
      <div class="bg-white p-8 border border-outline-variant relative paper-shadow"><span class="absolute -top-6 left-8 w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-headline-lg text-xl rounded-full">2</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Diagnostic gratuit</h3><p class="text-on-surface-variant text-sm">Sur place, nous identifions la cause exacte et vous expliquons les options. Aucun engagement.</p></div>
      <div class="bg-white p-8 border border-outline-variant relative paper-shadow"><span class="absolute -top-6 left-8 w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-headline-lg text-xl rounded-full">3</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Devis ferme</h3><p class="text-on-surface-variant text-sm">Prix annoncé = prix payé. Pas de supplément en cours de chantier, garanti par contrat.</p></div>
      <div class="bg-white p-8 border border-outline-variant relative paper-shadow"><span class="absolute -top-6 left-8 w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-headline-lg text-xl rounded-full">4</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Intervention soignée</h3><p class="text-on-surface-variant text-sm">Travaux propres, protections systématiques. Garantie décennale et SAV assuré.</p></div>
    </div>
  </div>
</section>

<!-- POURQUOI NOUS (nouveau) -->
<section class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-[#1e40af] uppercase tracking-[0.2em] mb-4 inline-block">Nos engagements</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Pourquoi nous choisir</h2>
      <div class="w-24 h-1 bg-[#1e40af] mx-auto mt-6"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-[#1e40af] text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">schedule</span><div><h3 class="font-headline-lg text-2xl mb-2">Intervention sous 2h</h3><p class="text-on-surface-variant">Pour toute urgence (fuite, dégât des eaux, panne chauffe-eau)${city ? ` à ${city} et ses environs` : ""}. 7j/7, week-ends et jours fériés.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-[#1e40af] text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">handshake</span><div><h3 class="font-headline-lg text-2xl mb-2">Devis transparent</h3><p class="text-on-surface-variant">Tarif annoncé à l'appel, confirmé sur place après diagnostic. Aucun frais caché, garanti par écrit.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-[#1e40af] text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">shield</span><div><h3 class="font-headline-lg text-2xl mb-2">Garantie décennale</h3><p class="text-on-surface-variant">Couverture totale sur 10 ans pour tous nos travaux d'installation. Attestation fournie systématiquement.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-[#1e40af] text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">cleaning_services</span><div><h3 class="font-headline-lg text-2xl mb-2">Chantier propre</h3><p class="text-on-surface-variant">Protections systématiques de votre intérieur. Nettoyage complet en fin de chantier, comme si on n'était jamais venus.</p></div></div>
    </div>
  </div>
</section>

${hasReviews ? `
<!-- AVIS GOOGLE (nouveau, si données dispos) -->
<section id="avis" class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-[#1e40af] uppercase tracking-[0.2em] mb-4 inline-block">Ils en parlent</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Nos clients témoignent</h2>
      ${ratingBadge ? `<div class="flex justify-center mt-6">${ratingBadge}</div>` : ""}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">${reviewsHtml}</div>
  </div>
</section>` : ""}

<!-- CTA FINAL (nouveau) -->
<section class="py-section-gap bg-[#1e40af] text-white px-mobile-padding md:px-desktop-padding text-center">
  <div class="max-w-container-max mx-auto">
    <h2 class="font-headline-display text-3xl md:text-5xl mb-6">Un problème de plomberie ?</h2>
    <p class="text-lg max-w-2xl mx-auto mb-12 opacity-90">Appelez-nous maintenant${city ? ` à ${city}` : ""}. Devis gratuit, intervention sous 2h en urgence.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="inline-flex items-center gap-2 bg-white text-[#1e40af] font-label-lg px-10 py-5 hover:bg-surface-variant uppercase tracking-widest transition-all"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>${phone}</a>` : ""}
      ${email ? `<a href="mailto:${email}" class="inline-flex items-center gap-2 bg-transparent text-white border border-white font-label-lg px-10 py-5 hover:bg-white hover:text-[#1e40af] uppercase tracking-widest transition-all"><span class="material-symbols-outlined">mail</span>Envoyer un email</a>` : ""}
    </div>
  </div>
</section>

<!-- CONTACT + HORAIRES -->
<section id="contact" class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto text-center">
    <span class="font-label-sm text-[#1e40af] uppercase tracking-[0.2em] mb-4 inline-block">Nous joindre</span>
    <h2 class="font-headline-display text-3xl md:text-5xl text-primary mb-4">Parlons de votre projet</h2>
    <div class="w-24 h-1 bg-[#1e40af] mx-auto mb-16"></div>
    <div class="grid grid-cols-1 md:grid-cols-${hoursHtml ? "4" : "3"} gap-6 max-w-6xl mx-auto">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="group bg-white p-10 border border-outline-variant hover:border-[#1e40af] transition-all paper-shadow"><span class="material-symbols-outlined text-[#1e40af] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">call</span><div class="font-headline-lg text-xl mb-2">Téléphone</div><div class="text-on-surface-variant">${phone}</div></a>` : ""}
      ${email ? `<a href="mailto:${email}" class="group bg-white p-10 border border-outline-variant hover:border-[#1e40af] transition-all paper-shadow"><span class="material-symbols-outlined text-[#1e40af] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">mail</span><div class="font-headline-lg text-xl mb-2">Email</div><div class="text-on-surface-variant text-sm break-all">${email}</div></a>` : ""}
      ${address ? `<div class="bg-white p-10 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-[#1e40af] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">location_on</span><div class="font-headline-lg text-xl mb-2">Adresse</div><div class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</div>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="text-[#1e40af] text-xs uppercase tracking-widest mt-3 inline-block">M'y rendre →</a>` : ""}</div>` : ""}
      ${hoursHtml}
    </div>
  </div>
</section>
</main>

<!-- FOOTER (pixel-pixel Stitch) -->
<footer class="w-full mt-section-gap bg-surface-container-highest border-t border-outline-variant">
  <div class="flex flex-col md:flex-row justify-between items-center py-12 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto gap-stack-gap">
    <div class="flex flex-col items-center md:items-start gap-4">
      <span class="font-headline-lg text-2xl text-primary">${nameUpper}</span>
      <span class="text-on-surface text-sm">© 2026 ${nameUpper} · Site Klyora Sites · Maître artisan plombier${city ? ` à ${city}` : ""}</span>
    </div>
    <div class="flex flex-wrap justify-center gap-6">
      <a class="font-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#services">Services</a>
      <a class="font-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#process">Notre méthode</a>
      <a class="font-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#contact">Contact</a>
    </div>
  </div>
</footer>

<script>
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) { window.scrollY > 10 ? nav.classList.add('shadow-md') : nav.classList.remove('shadow-md'); }
  });
</script>
</body>
</html>`;
}
