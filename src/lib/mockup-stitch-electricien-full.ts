/* ══════════════════════════════════════════
   MOCKUP STITCH ÉLECTRICIEN — pixel-pixel intégral + sections vendeuses

   Source: stitch_klyora_stitch_templates/lectricien_name_1
   - Garde les images Stitch d'origine (AIDA Google, HTTP 200 vérifié)
   - Ajoute 4 sections supplémentaires pour convaincre le patron :
     * Comment ça marche (process 4 étapes)
     * Pourquoi nous (4 atouts)
     * Témoignages clients (3 avis Google)
     * CTA finale "Prêt à démarrer ?"
   ══════════════════════════════════════════ */

export interface ElectricienProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website_photos?: string[] | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  site_style_dna?: unknown;
}

function escape(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Images Stitch ORIGINALES (vérifiées HTTP 200 le 18/06/2026)
const STITCH_HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuAaCUkdW5i0W5Fud1RjIhTrOz62CwhoyWsHQHplS6OUfu54qw3_7dqL0MLMgQyBGeX7hfk7DzW5_tF0ik6BRr4n0SPLFY9aYQrRQehiElIh2-3agdnRnr7WycJ9V9D0R9p5jw8KJ0yb8eQVVFyth1T6UN-RcP5lBBMyD0hclV8rX_Y3c2QMnqAXGqZtnR0fkOSrzCiJYRvov_t2ZJG1HeBC7eS4Nxji-RiwdP7nxAMzaNQko11z7K88oaCu1sdtd-69XmMoBW0Mk_0";
const STITCH_PATTERN = "https://lh3.googleusercontent.com/aida-public/AB6AXuA5vJ4Om6wIBarpus0vLeMt9AjQkHt5oqnGdEAmU4SER6ZBIVpG5PyCzRkS3f56RpaIF8gqekOhe5hwPVM66sp1NZ6MxDel29J0rfd4Unc_Xyy6fdTMY27SCNH1TZDXJRkjvsur25fC6CCZcHryoegrpdcc4dTstho_FTQYbBUQJ2gOgttIuf8wXbyy8dXl0Ge2xucGQz9WZ_MVnLD3PS4VK8HVgNykzYy-Ajvf8DHAFK4Nvh4bdpEmWVcWDpRwFpiFWSc7ARqSfDE";
const STITCH_TECHNICAL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDVxbtsRbozmxqfYzEDY6MOSNcLvHVB0RZgQWNDbBjwp9UhCiOcbKE8JWcJEc4Ebv6L9dapSOuju-GD7iL9vjgEic-AwjeIVQ0ugPVahpE_unQg8tklHGZKLVtEvNzeeoFuiqDz6AR50dAdGg6NHY_A_--0OztIvL48q9YkTHwesGvZpEemJMn3iBOo8iv99N5GLO8iiwf3II2zyt5pYdFLtNcYAgH4Hh_bi5vmUYiMJJ2unCGpyznmBw1cqdWm26eVp7jFQonxZ-k";
const STITCH_MATERIAL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBmKwfrLCK_LzsC7DSC2q8PFXOCtk5vviX7fvl5FcSEYKIEIY-fBdydnZ3eqCSMOuAKjl8w3vY2asF3ovO-p5xOYr52Wt40c5KyVWikXIhnBeCwJkvVSY7ChiclIgYa89n1NfmEPnR-BzK4oeWpyhLDkNifTSBkF6ellMtKkqQh3ApHlh2do_MrSO6l6rEeNlt-8vl5QSCbBD8jmJmHkScGDRkkzR9_75QlTkUmDucq_rbUswTY5G8AWBFxE60l2xmPBOEi4ZP5PYE";

export function generateStitchElectricienMockupHtml(p: ElectricienProspect): string {
  const name = escape(p.name);
  const nameUpper = name.toUpperCase();
  const city = escape(p.city || "");
  const cityClause = city ? ` à ${city}` : "";
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  // Reviews — top 3 only (avec fallback si pas dispo)
  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 40).slice(0, 3);
  const hasReviews = reviews.length > 0;
  const reviewsHtml = hasReviews ? reviews.map(r => `
    <div class="bg-white border border-outline-variant p-8 flex flex-col gap-4 hover:border-accent transition-colors">
      <div class="flex gap-1 text-accent">${Array(Math.round(r.rating || 5)).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div>
      <p class="text-on-surface-variant italic leading-relaxed">«&nbsp;${escape(r.text || "").slice(0, 220)}${(r.text || "").length > 220 ? "…" : ""}&nbsp;»</p>
      <div class="mt-auto pt-4 border-t border-outline-variant">
        <div class="font-label-lg text-primary">${escape(r.author || "Client Google")}</div>
        ${r.timeAgo ? `<div class="text-xs text-on-surface-variant uppercase tracking-widest">${escape(r.timeAgo)}</div>` : ""}
      </div>
    </div>
  `).join("") : "";

  const ratingBadge = (p.google_rating && p.google_reviews_count)
    ? `<div class="flex items-center gap-3"><div class="flex gap-1 text-accent">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="font-label-lg">${p.google_rating}/5 — ${p.google_reviews_count} avis Google</span></div>`
    : "";

  return `<!DOCTYPE html>
<!-- Design Klyora Sites — https://klyora.fr · Maquette personnalisée pour ${name} -->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<title>${name} — Électricien${cityClause}</title>
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
        "surface-variant": "#e5e2e1", "background": "#fdf8f8", "on-background": "#1c1b1b",
        "primary": "#000000", "on-primary": "#ffffff", "primary-container": "#1c1b1b",
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
  .texture-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .text-accent { color: #ca8a04; }
  .bg-accent { background-color: #ca8a04; }
  .border-accent { border-color: #ca8a04; }
</style>
</head>
<body class="bg-background text-on-background antialiased overflow-x-hidden selection:bg-accent selection:text-white relative">
<div class="texture-overlay"></div>

<!-- NAV (sticky sous la sales-ui-bar 54px) -->
<nav class="bg-surface/95 backdrop-blur-md sticky top-[54px] w-full z-40 border-b border-outline-variant shadow-sm">
  <div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
    <a class="font-headline-lg text-2xl md:text-3xl tracking-tighter text-primary" href="#">${nameUpper}</a>
    <div class="hidden md:flex items-center gap-8">
      <a class="font-label-lg text-primary border-b-2 border-primary pb-1" href="#savoir">Savoir-faire</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#process">Comment ça marche</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#avis">Avis</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
    </div>
    ${phoneNoSpace ? `<a class="hidden md:inline-block font-label-lg bg-primary text-on-primary px-6 py-3 hover:bg-zinc-800 transition-all" href="tel:${phoneNoSpace}">DEVIS GRATUIT</a>` : ""}
    <button class="md:hidden text-primary"><span class="material-symbols-outlined" style="font-size: 32px;">menu</span></button>
  </div>
</nav>

<main>
<!-- HERO Split Layout (pixel-pixel Stitch) -->
<section id="savoir" class="relative min-h-[90vh] flex items-center bg-surface-container-lowest overflow-hidden">
  <div class="grid grid-cols-1 lg:grid-cols-12 w-full max-w-full">
    <div class="lg:col-span-5 flex flex-col justify-center px-mobile-padding md:px-desktop-padding py-12 md:py-24 z-10">
      <div class="flex flex-col gap-8 max-w-xl">
        <div class="space-y-4">
          <span class="font-label-sm text-accent uppercase tracking-[0.2em] bg-accent/10 px-4 py-1.5 inline-block">Expertise Électrique de Pointe</span>
          <h1 class="font-headline-display text-[40px] md:text-[56px] leading-[1.1] text-primary">${name}</h1>
          <p class="text-lg text-on-surface-variant leading-relaxed">${city ? `À ${city}, ` : ""}nous redéfinissons l'art de l'installation électrique. Une précision technique sans compromis pour une sécurité absolue de vos infrastructures.</p>
          ${ratingBadge ? `<div class="pt-2">${ratingBadge}</div>` : ""}
        </div>
        <div class="flex flex-wrap gap-4 pt-4">
          ${phoneNoSpace ? `<a class="font-label-lg bg-primary text-on-primary px-10 py-5 hover:bg-zinc-800 transition-all uppercase tracking-widest" href="tel:${phoneNoSpace}">Lancer votre projet</a>` : ""}
          <a class="font-label-lg bg-transparent text-primary border border-primary px-10 py-5 hover:bg-surface-variant transition-all uppercase tracking-widest" href="#process">Découvrir nos solutions</a>
        </div>
        <div class="grid grid-cols-3 gap-6 pt-12 border-t border-outline-variant">
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">verified</span><span class="font-label-sm uppercase tracking-tight">Qualifelec</span></div>
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">description</span><span class="font-label-sm uppercase tracking-tight">Étude Gratuite</span></div>
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">shield</span><span class="font-label-sm uppercase tracking-tight">Décennale</span></div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-7 relative h-[50vh] lg:h-auto min-h-[500px]">
      <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest to-transparent z-10 hidden lg:block"></div>
      <img alt="Tableau électrique de précision" class="object-cover w-full h-full grayscale-[10%] contrast-110" src="${STITCH_HERO}"/>
      <div class="absolute bottom-12 right-12 w-32 h-32 border-r-4 border-b-4 border-accent opacity-50"></div>
    </div>
  </div>
</section>

<!-- TECHNICAL MASTERY (pixel-pixel Stitch) -->
<section class="bg-primary text-on-primary py-section-gap relative overflow-hidden">
  <div class="absolute top-0 right-0 w-1/3 h-full opacity-10"><img alt="" class="w-full h-full object-cover" src="${STITCH_PATTERN}"/></div>
  <div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div class="relative group">
        <div class="absolute -inset-4 bg-accent/20 scale-95 group-hover:scale-100 transition-transform duration-700"></div>
        <img alt="Outils techniques" class="relative z-10 w-full h-[600px] object-cover shadow-2xl" src="${STITCH_TECHNICAL}"/>
      </div>
      <div class="flex flex-col gap-8">
        <h2 class="font-headline-display text-3xl md:text-5xl">La Précision comme Signature</h2>
        <div class="space-y-6 text-surface-variant text-lg">
          <p>Chaque raccordement, chaque gainage et chaque module est installé avec une rigueur mathématique. Nous croyons que la beauté d'une installation électrique réside dans son organisation invisible.</p>
          <ul class="space-y-4">
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Domotique Intégrée</h4><p class="text-sm opacity-80">Systèmes intelligents pour une gestion optimisée de l'énergie.</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Mise en Conformité NF C 15-100</h4><p class="text-sm opacity-80">Audit complet et remise aux normes pour une sécurité totale.</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Bornes Véhicules Électriques</h4><p class="text-sm opacity-80">Installation IRVE certifiée, éligible aux aides nationales (CEE).</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Dépannage 7j/7</h4><p class="text-sm opacity-80">Intervention rapide${city ? ` à ${city}` : ""} pour vos urgences électriques.</p></div></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- MATERIALITY (pixel-pixel Stitch) -->
<section class="grid grid-cols-1 md:grid-cols-2 bg-surface-container-low">
  <div class="h-[600px] relative overflow-hidden">
    <img alt="Matériaux nobles" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" src="${STITCH_MATERIAL}"/>
    <div class="absolute inset-0 bg-primary/20"></div>
  </div>
  <div class="flex flex-col justify-center p-12 md:p-24 bg-white border-l border-outline-variant">
    <span class="font-label-sm text-accent tracking-widest mb-4">L'ART DE LA MATIÈRE</span>
    <h3 class="font-headline-lg text-4xl mb-6">Matériaux Nobles, Sécurité Durable</h3>
    <p class="text-on-surface-variant leading-relaxed mb-8">Nous sélectionnons exclusivement des composants de rang industriel pour garantir la pérennité de vos installations. Du cuivre haute pureté aux disjoncteurs de dernière génération, la qualité ne souffre d'aucune concession.</p>
    <div class="grid grid-cols-2 gap-8">
      <div class="border-l-2 border-accent pl-4"><span class="block font-headline-lg text-3xl">100%</span><span class="text-xs uppercase tracking-widest opacity-60">Matériel Certifié</span></div>
      <div class="border-l-2 border-accent pl-4"><span class="block font-headline-lg text-3xl">15+</span><span class="text-xs uppercase tracking-widest opacity-60">Ans d'Expertise</span></div>
    </div>
  </div>
</section>

<!-- COMMENT ÇA MARCHE (4 étapes process) -->
<section id="process" class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-accent uppercase tracking-[0.2em] mb-4 inline-block">Notre méthode</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Comment ça se passe</h2>
      <div class="w-24 h-1 bg-accent mx-auto mt-6"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="bg-white p-8 border border-outline-variant relative">
        <span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl">1</span>
        <h3 class="font-headline-lg text-xl mb-3 mt-4">Étude gratuite</h3>
        <p class="text-on-surface-variant text-sm">Visite sur site, audit de l'existant, analyse de vos besoins en moins de 48h.</p>
      </div>
      <div class="bg-white p-8 border border-outline-variant relative">
        <span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl">2</span>
        <h3 class="font-headline-lg text-xl mb-3 mt-4">Devis transparent</h3>
        <p class="text-on-surface-variant text-sm">Détail des prestations, matériaux, délais. Aucun supplément caché, garanti par contrat.</p>
      </div>
      <div class="bg-white p-8 border border-outline-variant relative">
        <span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl">3</span>
        <h3 class="font-headline-lg text-xl mb-3 mt-4">Intervention rapide</h3>
        <p class="text-on-surface-variant text-sm">Démarrage sous 10 jours ouvrés. Chantier soigné, propreté garantie, respect des délais.</p>
      </div>
      <div class="bg-white p-8 border border-outline-variant relative">
        <span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl">4</span>
        <h3 class="font-headline-lg text-xl mb-3 mt-4">Garantie décennale</h3>
        <p class="text-on-surface-variant text-sm">Conformité NF C 15-100, attestation Consuel, suivi 10 ans. Sérénité totale.</p>
      </div>
    </div>
  </div>
</section>

<!-- POURQUOI NOUS -->
<section class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-accent uppercase tracking-[0.2em] mb-4 inline-block">Nos atouts</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Pourquoi nous choisir</h2>
      <div class="w-24 h-1 bg-accent mx-auto mt-6"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div class="flex gap-6 items-start">
        <span class="material-symbols-outlined text-accent text-5xl" style="font-variation-settings: 'FILL' 1;">verified</span>
        <div>
          <h3 class="font-headline-lg text-2xl mb-2">Certifié Qualifelec</h3>
          <p class="text-on-surface-variant">Label professionnel reconnu garantissant notre expertise technique, notre formation continue et notre assurance décennale.</p>
        </div>
      </div>
      <div class="flex gap-6 items-start">
        <span class="material-symbols-outlined text-accent text-5xl" style="font-variation-settings: 'FILL' 1;">savings</span>
        <div>
          <h3 class="font-headline-lg text-2xl mb-2">Aides &amp; Primes optimisées</h3>
          <p class="text-on-surface-variant">Nous montons votre dossier MaPrimeRénov', CEE, éco-PTZ. Vous économisez jusqu'à 60% du coût des travaux.</p>
        </div>
      </div>
      <div class="flex gap-6 items-start">
        <span class="material-symbols-outlined text-accent text-5xl" style="font-variation-settings: 'FILL' 1;">schedule</span>
        <div>
          <h3 class="font-headline-lg text-2xl mb-2">Délai d'intervention 24h</h3>
          <p class="text-on-surface-variant">Pour les urgences (panne, court-circuit, dépannage). Sur RDV pour les travaux planifiés, démarrage sous 10j.</p>
        </div>
      </div>
      <div class="flex gap-6 items-start">
        <span class="material-symbols-outlined text-accent text-5xl" style="font-variation-settings: 'FILL' 1;">handshake</span>
        <div>
          <h3 class="font-headline-lg text-2xl mb-2">Devis ferme &amp; définitif</h3>
          <p class="text-on-surface-variant">Pas de supplément en cours de chantier. Le prix annoncé est le prix payé, garanti par contrat.</p>
        </div>
      </div>
    </div>
  </div>
</section>

${hasReviews ? `
<!-- AVIS GOOGLE -->
<section id="avis" class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="font-label-sm text-accent uppercase tracking-[0.2em] mb-4 inline-block">Ils en parlent</span>
      <h2 class="font-headline-display text-3xl md:text-5xl text-primary">Nos clients témoignent</h2>
      ${ratingBadge ? `<div class="flex justify-center mt-6">${ratingBadge}</div>` : ""}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">${reviewsHtml}</div>
  </div>
</section>` : ""}

<!-- CTA FINAL -->
<section class="py-section-gap bg-primary text-on-primary px-mobile-padding md:px-desktop-padding text-center">
  <div class="max-w-container-max mx-auto">
    <h2 class="font-headline-display text-3xl md:text-5xl mb-6">Prêt à démarrer votre projet ?</h2>
    <p class="text-lg text-surface-variant max-w-2xl mx-auto mb-12">Devis gratuit sous 48h${city ? ` à ${city} et ses environs` : ""}. Étude personnalisée par un artisan Qualifelec.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="inline-flex items-center gap-2 bg-accent text-white font-label-lg px-10 py-5 hover:bg-accent/90 uppercase tracking-widest transition-all"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>${phone}</a>` : ""}
      ${email ? `<a href="mailto:${email}" class="inline-flex items-center gap-2 bg-transparent text-white border border-white font-label-lg px-10 py-5 hover:bg-white hover:text-primary uppercase tracking-widest transition-all"><span class="material-symbols-outlined">mail</span>Envoyer un email</a>` : ""}
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact" class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto text-center">
    <span class="font-label-sm text-accent uppercase tracking-[0.2em] mb-4 inline-block">Nous joindre</span>
    <h2 class="font-headline-display text-3xl md:text-5xl text-primary mb-4">Parlons de votre projet</h2>
    <div class="w-24 h-1 bg-accent mx-auto mb-16"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="group bg-white p-10 border border-outline-variant hover:border-accent transition-all"><span class="material-symbols-outlined text-accent text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">call</span><div class="font-headline-lg text-xl mb-2">Téléphone</div><div class="text-on-surface-variant">${phone}</div></a>` : ""}
      ${email ? `<a href="mailto:${email}" class="group bg-white p-10 border border-outline-variant hover:border-accent transition-all"><span class="material-symbols-outlined text-accent text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">mail</span><div class="font-headline-lg text-xl mb-2">Email</div><div class="text-on-surface-variant text-sm break-all">${email}</div></a>` : ""}
      ${address ? `<div class="bg-white p-10 border border-outline-variant"><span class="material-symbols-outlined text-accent text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">location_on</span><div class="font-headline-lg text-xl mb-2">Atelier</div><div class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</div>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="text-accent text-xs uppercase tracking-widest mt-3 inline-block">M'y rendre →</a>` : ""}</div>` : ""}
    </div>
  </div>
</section>
</main>

<!-- FOOTER -->
<footer class="bg-surface-container-highest w-full border-t border-outline-variant">
  <div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding py-16">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      <div class="md:col-span-4">
        <div class="font-headline-lg text-3xl text-primary mb-4">${nameUpper}</div>
        <p class="text-on-surface-variant max-w-xs">L'excellence de l'installation électrique au service du patrimoine et de l'innovation${city ? `, à ${city}` : ""}.</p>
      </div>
      <div class="md:col-span-4 flex flex-col gap-4">
        <span class="font-label-lg text-primary uppercase tracking-widest">Notre savoir-faire</span>
        <nav class="flex flex-col gap-2">
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#savoir">Précision technique</a>
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#process">Comment ça marche</a>
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#avis">Avis clients</a>
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#contact">Contact</a>
        </nav>
      </div>
      <div class="md:col-span-4 flex flex-col gap-4">
        <span class="font-label-lg text-primary uppercase tracking-widest">Contact</span>
        ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="text-on-surface-variant hover:text-accent transition-colors">${phone}</a>` : ""}
        ${email ? `<a href="mailto:${email}" class="text-on-surface-variant hover:text-accent transition-colors text-sm">${email}</a>` : ""}
        ${address ? `<div class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</div>` : ""}
        <div class="h-px bg-outline-variant w-full my-2"></div>
        <div class="text-sm text-on-surface-variant">© 2026 ${nameUpper} · Site Klyora Sites · Maître artisan</div>
      </div>
    </div>
  </div>
</footer>
</body></html>`;
}
