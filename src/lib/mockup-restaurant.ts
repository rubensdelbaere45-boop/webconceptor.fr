/* ══════════════════════════════════════════
   Restaurant mockup template
   Génère un HTML complet + interface de réservation premium
   4 thèmes × 4 paires de polices = 16 combinaisons distinctes,
   choisies de manière déterministe selon le slug du prospect.
   ══════════════════════════════════════════ */

export interface RestaurantProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
}

export interface RestaurantContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  menuItems: Array<{ name: string; description: string; price: string; category: "entrée" | "plat" | "dessert" }>;
  cuisineType: string;
  talkingPoints: string[];
  emailSubject: string;
  emailOpening: string;
  emailPitch: string;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ══════════════════════════════════════════
   4 thèmes de couleurs
   ══════════════════════════════════════════ */
interface Theme {
  id: string;
  ink: string;
  accent: string;
  accentDark: string;
  deep: string;        // couleur profonde pour CTA / section-phare
  cream: string;
  warm: string;
  stone: string;
  shadow: string;
}

const THEMES: Theme[] = [
  // 1 — Gold & Wine (brasserie classique)
  { id: "gold-wine", ink: "#1a1310", accent: "#c19a56", accentDark: "#9d7a3e", deep: "#6b1f2a", cream: "#f9f5ef", warm: "#fdfaf5", stone: "#8b7e6e", shadow: "rgba(26,19,16,0.88)" },
  // 2 — Olive & Sand (méditerranéen / bistro terroir)
  { id: "olive-sand", ink: "#212522", accent: "#6b8c3e", accentDark: "#516a2f", deep: "#3d4a2a", cream: "#f5f2e8", warm: "#fbf8ee", stone: "#7a8274", shadow: "rgba(33,37,34,0.88)" },
  // 3 — Teal & Copper (coastal / fruits de mer / moderne)
  { id: "teal-copper", ink: "#16202a", accent: "#c46b3f", accentDark: "#9e5530", deep: "#1f4b54", cream: "#f3f1ed", warm: "#fafaf6", stone: "#6c7a85", shadow: "rgba(22,32,42,0.88)" },
  // 4 — Charcoal & Rose (chic urbain / gastro contemporain)
  { id: "charcoal-rose", ink: "#181818", accent: "#b87f7a", accentDark: "#8f615d", deep: "#3d2226", cream: "#f4efed", warm: "#faf6f4", stone: "#767170", shadow: "rgba(24,24,24,0.88)" },
];

/* ══════════════════════════════════════════
   4 paires de polices (Google Fonts)
   ══════════════════════════════════════════ */
interface FontPair {
  id: string;
  serif: string;         // nom utilisé dans font-family
  serifParam: string;    // paramètre pour URL Google Fonts
  sans: string;
  sansParam: string;
  script: string;
  scriptParam: string;
}

const FONT_PAIRS: FontPair[] = [
  {
    id: "cormorant",
    serif: "'Cormorant Garamond',Georgia,serif",
    serifParam: "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Inter',system-ui,sans-serif",
    sansParam: "Inter:wght@300;400;500;600;700",
    script: "'Great Vibes',cursive",
    scriptParam: "Great+Vibes",
  },
  {
    id: "playfair",
    serif: "'Playfair Display',Georgia,serif",
    serifParam: "Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Montserrat',system-ui,sans-serif",
    sansParam: "Montserrat:wght@300;400;500;600;700",
    script: "'Dancing Script',cursive",
    scriptParam: "Dancing+Script:wght@500;600;700",
  },
  {
    id: "eb-garamond",
    serif: "'EB Garamond',Georgia,serif",
    serifParam: "EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Work Sans',system-ui,sans-serif",
    sansParam: "Work+Sans:wght@300;400;500;600;700",
    script: "'Pinyon Script',cursive",
    scriptParam: "Pinyon+Script",
  },
  {
    id: "libre",
    serif: "'Libre Caslon Text',Georgia,serif",
    serifParam: "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400",
    sans: "'Lato',system-ui,sans-serif",
    sansParam: "Lato:wght@300;400;700;900",
    script: "'Petit Formal Script',cursive",
    scriptParam: "Petit+Formal+Script",
  },
];

/* Hash deterministe pour choisir thème + police par prospect.slug */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateRestaurantMockupHtml(
  prospect: RestaurantProspect,
  content: RestaurantContent,
  origin: string
): string {
  // Pick theme + fonts deterministically (same prospect = same design every time)
  const hash = hashString(prospect.slug || prospect.id);
  const theme = THEMES[hash % THEMES.length];
  const fontPair = FONT_PAIRS[(hash >> 4) % FONT_PAIRS.length];

  // Robust fallback photos — URLs testées qui servent des vraies images restaurant.
  // Utilise images.weserv.nl comme proxy-CDN stable (cache + resize) pointant sur
  // Unsplash pour éviter les problèmes d'expiration ou de 403 CORS.
  const FALLBACK_PHOTOS = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80&auto=format&fit=crop",
  ];

  // Build photo URLs: proxy Google Places, fallback to Unsplash si ref invalide.
  const photoUrls: string[] = [];
  for (let i = 0; i < 4; i++) {
    const ref = prospect.photos?.[i];
    if (ref && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref)) {
      photoUrls.push(`${origin}/api/prospect/photo?ref=${encodeURIComponent(ref)}`);
    } else {
      photoUrls.push(FALLBACK_PHOTOS[i]);
    }
  }

  // 3-step onerror chain :
  // 1. primary (Google Places proxy)
  // 2. fallback Unsplash (si primary échoue)
  // 3. si les deux échouent → on cache l'img (container révèle son dégradé CSS)
  const img = (primary: string, fallback: string, alt: string, attrs = "") =>
    `<img src="${esc(primary)}" data-fb="${esc(fallback)}" onerror="var s=this.dataset.s||0;if(s==0){this.dataset.s=1;this.src=this.dataset.fb}else{this.style.display='none'}" alt="${esc(alt)}" ${attrs}>`;

  const entrees = content.menuItems.filter((m) => m.category === "entrée");
  const plats = content.menuItems.filter((m) => m.category === "plat");
  const desserts = content.menuItems.filter((m) => m.category === "dessert");

  const menuHtml = (items: typeof content.menuItems) =>
    items
      .map(
        (m) => `
    <div class="menu-item">
      <div class="menu-item-head">
        <h4>${esc(m.name)}</h4>
        <span class="dots"></span>
        <span class="price">${esc(m.price)}</span>
      </div>
      <p>${esc(m.description)}</p>
    </div>`
      )
      .join("");

  // Build Google Fonts URL
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontPair.serifParam}&family=${fontPair.sansParam}&family=${fontPair.scriptParam}&display=swap`;

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : WebConceptor
  https://webconceptor.fr
  Maquette générée pour ${esc(prospect.name)} · Theme: ${theme.id} · Fonts: ${fontPair.id}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="WebConceptor — https://webconceptor.fr">
<meta name="copyright" content="© WebConceptor — Reproduction interdite">
<meta name="robots" content="noindex,noarchive">
<title>${esc(prospect.name)}${prospect.city ? " — " + esc(prospect.city) : ""} · Restaurant</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${esc(fontUrl)}" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --ink:${theme.ink};
  --accent:${theme.accent};
  --accent-dark:${theme.accentDark};
  --deep:${theme.deep};
  --cream:${theme.cream};
  --warm:${theme.warm};
  --stone:${theme.stone};
  --shadow:${theme.shadow};
  --ok:#5a7d4e;
  --serif:${fontPair.serif};
  --sans:${fontPair.sans};
  --script:${fontPair.script};
}
html{scroll-behavior:smooth;scrollbar-color:var(--accent) var(--cream)}
body{font-family:var(--sans);background:var(--warm);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;line-height:1.6}
::selection{background:var(--accent);color:#fff}
body::after{content:'WEBCONCEPTOR · DÉMO';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:110px;font-weight:900;color:rgba(0,0,0,0.025);letter-spacing:0.1em;white-space:nowrap;pointer-events:none;z-index:0;user-select:none}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}

/* WebConceptor branding overlay */
.wc-home-btn{position:fixed;top:14px;left:14px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0a0a0a;padding:8px 16px 8px 10px;border-radius:100px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.06);transition:all 0.2s}
.wc-home-btn:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,0,0,0.18)}
.wc-home-btn-logo{width:22px;height:22px;background:#0066ff;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:11px}
.wc-demo-badge{position:fixed;top:14px;right:14px;z-index:9998;background:rgba(10,10,10,0.92);color:#fff;padding:7px 14px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;backdrop-filter:blur(10px);pointer-events:none;display:inline-flex;align-items:center;gap:6px}
.wc-demo-badge::before{content:'';width:6px;height:6px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite}
.wc-watermark{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,var(--ink),var(--deep));padding:9px 20px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;color:rgba(255,255,255,0.85);letter-spacing:0.08em;text-transform:uppercase;font-weight:600}
.wc-watermark strong{color:#fff;letter-spacing:0.15em}
.wc-watermark a{color:var(--accent);font-weight:700}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

/* Top strip */
.top-strip{background:var(--ink);color:var(--cream);text-align:center;padding:8px 20px;font-size:12px;font-weight:400;letter-spacing:0.05em;position:relative;z-index:2}
.top-strip strong{color:var(--accent);letter-spacing:0.1em}

/* Navigation */
nav{position:sticky;top:0;z-index:100;height:84px;padding:0 48px;display:flex;align-items:center;justify-content:space-between;background:rgba(253,250,245,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.06)}
.logo{display:flex;flex-direction:column;gap:2px;line-height:1}
.logo-name{font-family:var(--serif);font-size:24px;font-weight:600;letter-spacing:0.02em;color:var(--ink)}
.logo-sub{font-family:var(--script);font-size:16px;color:var(--accent);line-height:1}
.nav-links{display:flex;gap:36px;list-style:none}
.nav-links a{color:var(--ink);font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;transition:color 0.2s;position:relative}
.nav-links a::after{content:'';position:absolute;left:0;bottom:-4px;width:0;height:1px;background:var(--accent);transition:width 0.3s}
.nav-links a:hover{color:var(--accent)}
.nav-links a:hover::after{width:100%}
.nav-cta{padding:12px 28px;background:var(--ink);color:#fff;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;border:1px solid var(--ink)}
.nav-cta:hover{background:var(--accent);border-color:var(--accent)}

/* Hero */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,var(--ink) 0%,var(--deep) 100%)}
.hero-bg{position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,var(--ink) 0%,var(--deep) 100%)}
.hero-bg img{width:100%;height:100%;object-fit:cover;filter:brightness(0.55)}
.hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0.7) 100%)}
.hero-inner{position:relative;z-index:2;text-align:center;padding:120px 20px 140px;max-width:900px;animation:fadeInUp 1s ease}
.hero-kicker{font-family:var(--script);font-size:42px;color:var(--accent);margin-bottom:8px}
.hero h1{font-family:var(--serif);font-size:clamp(3rem,7vw,6rem);font-weight:400;line-height:0.95;letter-spacing:-0.01em;color:#fff;margin-bottom:32px}
.hero h1 em{font-style:italic;color:var(--accent)}
.hero-desc{font-size:17px;color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto 48px;line-height:1.7;font-weight:300}
.hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-primary{padding:18px 44px;background:var(--accent);color:#fff;font-weight:600;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;display:inline-flex;align-items:center;gap:10px;border:1px solid var(--accent)}
.btn-primary:hover{background:transparent;color:var(--accent)}
.btn-outline{padding:18px 44px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);font-weight:500;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:2px;transition:all 0.3s}
.btn-outline:hover{background:#fff;color:var(--ink);border-color:#fff}
.hero-rating{margin-top:60px;display:inline-flex;align-items:center;gap:12px;padding:12px 24px;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:100px;font-size:13px;color:rgba(255,255,255,0.9)}
.hero-rating .stars{color:var(--accent);letter-spacing:2px}

/* About */
.about{padding:120px 40px;background:var(--warm)}
.about-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.about-img{aspect-ratio:4/5;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--accent) 0%,var(--deep) 100%)}
.about-img img{width:100%;height:100%;object-fit:cover;display:block}
.about-img::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(255,255,255,0.15),transparent 60%);z-index:0}
.about-img img{position:relative;z-index:1}
.about-img::after{content:'';position:absolute;top:20px;left:20px;right:-20px;bottom:-20px;border:1px solid var(--accent);z-index:-1}
.about-text .kicker{font-family:var(--script);font-size:32px;color:var(--accent);margin-bottom:8px}
.about-text h2{font-family:var(--serif);font-size:clamp(2.4rem,4vw,3.6rem);font-weight:400;line-height:1.1;margin-bottom:28px;color:var(--ink)}
.about-text h2 em{font-style:italic}
.about-text p{font-size:16px;color:var(--stone);line-height:1.85;margin-bottom:20px;font-weight:400}
.about-signature{margin-top:32px;font-family:var(--script);font-size:36px;color:var(--ink)}

/* Menu */
.menu{padding:120px 40px;background:var(--ink);color:var(--cream);position:relative;overflow:hidden}
.menu::before{content:'';position:absolute;top:40px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:var(--accent)}
.menu-inner{max-width:900px;margin:0 auto}
.menu-header{text-align:center;margin-bottom:80px}
.menu-kicker{font-family:var(--script);font-size:36px;color:var(--accent);margin-bottom:8px}
.menu h2{font-family:var(--serif);font-size:clamp(2.4rem,4vw,3.6rem);font-weight:400;color:#fff;letter-spacing:-0.01em}
.menu-subtitle{font-size:14px;color:rgba(249,245,239,0.6);margin-top:16px;letter-spacing:0.05em;font-style:italic}
.menu-section{margin-bottom:56px}
.menu-section-title{font-family:var(--serif);font-size:14px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:var(--accent);text-align:center;margin-bottom:40px;position:relative;padding-bottom:16px}
.menu-section-title::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:1px;background:var(--accent)}
.menu-item{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(249,245,239,0.08)}
.menu-item:last-child{border-bottom:none}
.menu-item-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px}
.menu-item-head h4{font-family:var(--serif);font-size:22px;font-weight:500;color:#fff;white-space:nowrap}
.menu-item-head .dots{flex:1;border-bottom:1px dotted rgba(255,255,255,0.2);margin-bottom:4px}
.menu-item-head .price{font-family:var(--serif);font-size:20px;color:var(--accent);font-weight:500;font-style:italic}
.menu-item p{font-size:14px;color:rgba(249,245,239,0.7);line-height:1.6;font-weight:300}
.menu-cta{text-align:center;margin-top:40px}

/* Gallery */
.gallery{padding:120px 40px;background:var(--warm)}
.gallery-inner{max-width:1400px;margin:0 auto}
.gallery-header{text-align:center;margin-bottom:64px}
.gallery-kicker{font-family:var(--script);font-size:32px;color:var(--accent);margin-bottom:8px}
.gallery h2{font-family:var(--serif);font-size:clamp(2.2rem,4vw,3.2rem);font-weight:400}
.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.gallery-item{aspect-ratio:1/1;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--accent) 0%,var(--deep) 100%)}
.gallery-item:nth-child(2n){background:linear-gradient(135deg,var(--deep) 0%,var(--ink) 100%)}
.gallery-item:nth-child(3n){background:linear-gradient(135deg,var(--stone) 0%,var(--accent-dark) 100%)}
.gallery-item:nth-child(1){grid-row:span 2}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform 0.6s ease;display:block}
.gallery-item:hover img{transform:scale(1.05)}

/* Reserve CTA */
.reserve-cta{padding:140px 40px;background:var(--deep);color:#fff;text-align:center;position:relative;overflow:hidden}
.reserve-cta::before{content:'';position:absolute;top:40px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:var(--accent)}
.reserve-cta-inner{max-width:700px;margin:0 auto;position:relative;z-index:1}
.reserve-kicker{font-family:var(--script);font-size:42px;color:var(--accent);margin-bottom:12px}
.reserve-cta h2{font-family:var(--serif);font-size:clamp(2.6rem,5vw,4.2rem);font-weight:400;line-height:1.05;margin-bottom:28px}
.reserve-cta p{font-size:17px;color:rgba(255,255,255,0.8);margin-bottom:48px;line-height:1.7;font-weight:300}

/* Info */
.info{padding:120px 40px;background:var(--warm)}
.info-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:48px}
.info-block{text-align:center;padding:20px}
.info-icon{width:60px;height:60px;margin:0 auto 24px;border:1px solid var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent)}
.info-block h3{font-family:var(--serif);font-size:24px;font-weight:500;margin-bottom:16px;color:var(--ink)}
.info-block p{font-size:15px;color:var(--stone);line-height:1.7}
.info-block strong{color:var(--ink);font-weight:500}

/* Footer */
footer{padding:40px 40px 80px;background:var(--ink);color:rgba(249,245,239,0.5);text-align:center;font-size:13px}

/* ───────────────────────────────────────── */
/* Booking Modal — Premium reservation UI    */
/* ───────────────────────────────────────── */
.bk-overlay{position:fixed;inset:0;z-index:10000;background:var(--shadow);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.4s ease}
.bk-overlay.open{display:flex;opacity:1;animation:bkFadeIn 0.4s ease}
@keyframes bkFadeIn{from{opacity:0}to{opacity:1}}
.bk-modal{background:var(--warm);max-width:560px;width:100%;max-height:92vh;overflow-y:auto;border-radius:4px;position:relative;animation:bkSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 40px 100px rgba(0,0,0,0.4)}
@keyframes bkSlideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
.bk-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:center;color:var(--ink);transition:all 0.2s;z-index:2}
.bk-close:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
.bk-header{padding:48px 48px 24px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.08)}
.bk-kicker{font-family:var(--script);font-size:26px;color:var(--accent);margin-bottom:4px}
.bk-header h3{font-family:var(--serif);font-size:32px;font-weight:500;color:var(--ink);letter-spacing:-0.01em}
.bk-header p{font-size:13px;color:var(--stone);margin-top:8px;letter-spacing:0.05em}
.bk-body{padding:36px 48px 24px}
.bk-step{display:none;animation:bkFadeIn 0.3s}
.bk-step.active{display:block}
.bk-label{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--stone);margin-bottom:12px;display:block}

/* Date grid */
.bk-dates{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px}
.bk-date-head{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--stone);text-align:center;padding:8px 0}
.bk-date{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid transparent;border-radius:2px;background:transparent;transition:all 0.15s;padding:4px}
.bk-date:hover:not(.disabled){background:var(--cream);border-color:var(--accent)}
.bk-date.selected{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-date.disabled{color:rgba(139,126,110,0.3);cursor:not-allowed;pointer-events:none}
.bk-date-num{font-family:var(--serif);font-size:18px;font-weight:500}
.bk-date-mo{font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:0.1em;margin-top:2px}
.bk-month-label{font-family:var(--serif);font-size:16px;font-style:italic;color:var(--ink);text-align:center;margin-bottom:16px}

/* Time chips */
.bk-times{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.bk-time{padding:14px 8px;text-align:center;background:transparent;border:1px solid rgba(0,0,0,0.12);border-radius:2px;font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);transition:all 0.2s}
.bk-time:hover{border-color:var(--accent);background:var(--cream)}
.bk-time.selected{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-time-section{margin-bottom:24px}
.bk-time-section-label{font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:12px}

/* Guests */
.bk-guests{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.bk-guest{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.12);border-radius:2px;font-family:var(--serif);font-size:20px;font-weight:500;transition:all 0.2s}
.bk-guest:hover{border-color:var(--accent);background:var(--cream)}
.bk-guest.selected{background:var(--ink);color:#fff;border-color:var(--ink)}

/* Form fields */
.bk-field{margin-bottom:20px}
.bk-field label{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--stone);margin-bottom:8px;display:block}
.bk-field input,.bk-field textarea{width:100%;padding:12px 0;border:none;border-bottom:1px solid rgba(0,0,0,0.12);background:transparent;font-family:var(--sans);font-size:15px;color:var(--ink);outline:none;transition:border-color 0.2s}
.bk-field input:focus,.bk-field textarea:focus{border-color:var(--accent)}
.bk-field textarea{resize:none;min-height:80px;padding:12px 0}

/* Summary */
.bk-summary{background:var(--cream);padding:24px;border-radius:2px;margin-bottom:24px}
.bk-sum-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:14px}
.bk-sum-row:last-child{border-bottom:none}
.bk-sum-row strong{color:var(--ink);font-weight:500}
.bk-sum-row span{color:var(--stone)}

/* Success */
.bk-success{text-align:center;padding:48px 0}
.bk-success-icon{width:80px;height:80px;margin:0 auto 24px;background:var(--ok);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;animation:bkScaleIn 0.5s cubic-bezier(0.16,1,0.3,1)}
@keyframes bkScaleIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.bk-success h4{font-family:var(--serif);font-size:28px;font-weight:500;color:var(--ink);margin-bottom:12px}
.bk-success p{font-size:14px;color:var(--stone);line-height:1.6;max-width:380px;margin:0 auto 24px}

/* Footer actions */
.bk-footer{padding:24px 48px 40px;display:flex;gap:12px;justify-content:space-between;align-items:center}
.bk-step-indicator{display:flex;gap:6px;align-items:center}
.bk-step-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.12);transition:all 0.3s}
.bk-step-dot.active{background:var(--accent);width:24px;border-radius:4px}
.bk-actions{display:flex;gap:12px}
.bk-btn{padding:12px 28px;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;border:1px solid transparent}
.bk-btn-back{background:transparent;color:var(--stone);border-color:transparent}
.bk-btn-back:hover{color:var(--ink)}
.bk-btn-next{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-btn-next:hover{background:var(--accent);border-color:var(--accent)}
.bk-btn-next:disabled{background:rgba(0,0,0,0.15);border-color:transparent;cursor:not-allowed}
.bk-error{color:#c72828;font-size:13px;margin-top:12px;text-align:center}

@media(max-width:900px){
  nav{padding:0 20px;height:64px}
  .nav-links{display:none}
  .hero-inner{padding:100px 20px 120px}
  .about{padding:80px 20px}
  .about-inner{grid-template-columns:1fr;gap:48px}
  .menu{padding:80px 20px}
  .menu-item-head{flex-wrap:wrap}
  .menu-item-head .dots{display:none}
  .gallery{padding:80px 20px}
  .gallery-grid{grid-template-columns:repeat(2,1fr)}
  .gallery-item:nth-child(1){grid-row:auto}
  .reserve-cta{padding:100px 20px}
  .info{padding:80px 20px}
  .info-inner{grid-template-columns:1fr;gap:32px}
  .bk-modal{max-height:96vh}
  .bk-header,.bk-body{padding-left:24px;padding-right:24px}
  .bk-footer{padding:20px 24px 28px}
  .bk-dates{grid-template-columns:repeat(7,1fr);gap:4px}
  .bk-times{grid-template-columns:repeat(4,1fr)}
  .bk-guests{grid-template-columns:repeat(5,1fr)}
  body::after{font-size:60px}
}
</style>
</head>
<body>

<a href="https://webconceptor.fr" class="wc-home-btn" title="Retour WebConceptor">
  <span class="wc-home-btn-logo">W</span>
  <span>WebConceptor</span>
</a>
<div class="wc-demo-badge">Maquette</div>

<div class="top-strip">
  <strong>${esc(prospect.name.toUpperCase())}</strong> &nbsp;·&nbsp; ${esc(content.cuisineType || "Cuisine authentique")}${prospect.city ? " · " + esc(prospect.city) : ""}
</div>

<nav>
  <div class="logo">
    <span class="logo-name">${esc(prospect.name)}</span>
    <span class="logo-sub">Restaurant</span>
  </div>
  <ul class="nav-links">
    <li><a href="#about">L'adresse</a></li>
    <li><a href="#menu">La carte</a></li>
    <li><a href="#gallery">Ambiance</a></li>
    <li><a href="#info">Nous trouver</a></li>
  </ul>
  <button class="nav-cta" onclick="bkOpen()">Réserver une table</button>
</nav>

<section class="hero">
  <div class="hero-bg">${img(photoUrls[0], FALLBACK_PHOTOS[0], prospect.name, 'loading="eager"')}</div>
  <div class="hero-inner">
    <div class="hero-kicker">Bienvenue</div>
    <h1>${esc(content.heroTitle)}</h1>
    <p class="hero-desc">${esc(content.heroSubtitle)}</p>
    <div class="hero-ctas">
      <button class="btn-primary" onclick="bkOpen()">Réserver une table →</button>
      <a href="#menu" class="btn-outline">Voir la carte</a>
    </div>
    ${
      prospect.google_rating
        ? `<div class="hero-rating"><span class="stars">${"★".repeat(Math.round(prospect.google_rating))}</span><span>${prospect.google_rating.toFixed(1)}/5 · ${prospect.google_reviews_count || 0} avis Google</span></div>`
        : ""
    }
  </div>
</section>

<section id="about" class="about">
  <div class="about-inner">
    <div class="about-img">
      ${img(photoUrls[1], FALLBACK_PHOTOS[1], "Ambiance " + prospect.name, 'loading="lazy"')}
    </div>
    <div class="about-text">
      <div class="kicker">L'adresse</div>
      <h2>Une cuisine de <em>caractère</em></h2>
      <p>${esc(content.aboutText)}</p>
      <p class="about-signature">${esc(prospect.name)}</p>
    </div>
  </div>
</section>

<section id="menu" class="menu">
  <div class="menu-inner">
    <div class="menu-header">
      <div class="menu-kicker">La carte</div>
      <h2>Quelques suggestions</h2>
      <p class="menu-subtitle">Produits frais, de saison, travaillés avec passion</p>
    </div>
    ${
      entrees.length
        ? `<div class="menu-section">
      <div class="menu-section-title">Entrées</div>
      ${menuHtml(entrees)}
    </div>`
        : ""
    }
    ${
      plats.length
        ? `<div class="menu-section">
      <div class="menu-section-title">Plats</div>
      ${menuHtml(plats)}
    </div>`
        : ""
    }
    ${
      desserts.length
        ? `<div class="menu-section">
      <div class="menu-section-title">Desserts</div>
      ${menuHtml(desserts)}
    </div>`
        : ""
    }
    <div class="menu-cta">
      <button class="btn-primary" onclick="bkOpen()" style="background:var(--accent);border-color:var(--accent);color:#fff">Réserver une table →</button>
    </div>
  </div>
</section>

<section id="gallery" class="gallery">
  <div class="gallery-inner">
    <div class="gallery-header">
      <div class="gallery-kicker">Ambiance</div>
      <h2>Un lieu, une âme</h2>
    </div>
    <div class="gallery-grid">
      <div class="gallery-item">${img(photoUrls[0], FALLBACK_PHOTOS[0], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[1], FALLBACK_PHOTOS[1], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[2], FALLBACK_PHOTOS[2], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[3], FALLBACK_PHOTOS[3], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[1], FALLBACK_PHOTOS[2], "", 'loading="lazy"')}</div>
    </div>
  </div>
</section>

<section class="reserve-cta">
  <div class="reserve-cta-inner">
    <div class="reserve-kicker">Envie d'un bon moment ?</div>
    <h2>Réservez votre table <em>en quelques clics</em></h2>
    <p>Nous vous accueillons du mardi au samedi, midi et soir. Groupes et privatisations sur demande.</p>
    <button class="btn-primary" onclick="bkOpen()">Réserver maintenant →</button>
  </div>
</section>

<section id="info" class="info">
  <div class="info-inner">
    ${
      prospect.address
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg></div>
      <h3>Adresse</h3>
      <p>${esc(prospect.address)}</p>
    </div>`
        : ""
    }
    ${
      prospect.phone
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg></div>
      <h3>Téléphone</h3>
      <p><strong>${esc(prospect.phone)}</strong></p>
    </div>`
        : ""
    }
    ${
      prospect.hours
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
      <h3>Horaires</h3>
      <p>${esc(prospect.hours.split(" | ").slice(0, 3).join("<br>"))}</p>
    </div>`
        : ""
    }
  </div>
</section>

<footer>
  © 2026 — ${esc(prospect.name)} · Maquette générée par WebConceptor
</footer>

<!-- ─────────────────────────────────── -->
<!-- Premium Booking Modal               -->
<!-- ─────────────────────────────────── -->
<div class="bk-overlay" id="bk-overlay" onclick="if(event.target===this)bkClose()">
  <div class="bk-modal">
    <button class="bk-close" onclick="bkClose()" aria-label="Fermer">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>

    <div class="bk-header">
      <div class="bk-kicker">Réservation</div>
      <h3>${esc(prospect.name)}</h3>
      <p>Sélectionnez votre créneau</p>
    </div>

    <div class="bk-body">
      <!-- Step 1 : Date -->
      <div class="bk-step active" data-step="1">
        <span class="bk-label">Choisissez une date</span>
        <div class="bk-month-label" id="bk-month-label">—</div>
        <div class="bk-dates" id="bk-dates-head">
          <div class="bk-date-head">Lun</div>
          <div class="bk-date-head">Mar</div>
          <div class="bk-date-head">Mer</div>
          <div class="bk-date-head">Jeu</div>
          <div class="bk-date-head">Ven</div>
          <div class="bk-date-head">Sam</div>
          <div class="bk-date-head">Dim</div>
        </div>
        <div class="bk-dates" id="bk-dates"></div>
      </div>

      <!-- Step 2 : Time -->
      <div class="bk-step" data-step="2">
        <div class="bk-time-section">
          <div class="bk-time-section-label">Déjeuner</div>
          <div class="bk-times" id="bk-times-lunch"></div>
        </div>
        <div class="bk-time-section">
          <div class="bk-time-section-label">Dîner</div>
          <div class="bk-times" id="bk-times-dinner"></div>
        </div>
      </div>

      <!-- Step 3 : Guests -->
      <div class="bk-step" data-step="3">
        <span class="bk-label">Nombre de convives</span>
        <div class="bk-guests" id="bk-guests"></div>
      </div>

      <!-- Step 4 : Contact + summary -->
      <div class="bk-step" data-step="4">
        <div class="bk-summary" id="bk-summary"></div>
        <div class="bk-field">
          <label for="bk-name">Nom complet</label>
          <input type="text" id="bk-name" maxlength="80" placeholder="Marie Dupont" autocomplete="name">
        </div>
        <div class="bk-field">
          <label for="bk-email">Email</label>
          <input type="email" id="bk-email" maxlength="120" placeholder="marie@example.com" autocomplete="email">
        </div>
        <div class="bk-field">
          <label for="bk-phone">Téléphone</label>
          <input type="tel" id="bk-phone" maxlength="20" placeholder="06 12 34 56 78" autocomplete="tel">
        </div>
        <div class="bk-field">
          <label for="bk-notes">Demande particulière (optionnel)</label>
          <textarea id="bk-notes" maxlength="400" placeholder="Allergies, anniversaire, terrasse…"></textarea>
        </div>
        <div class="bk-error" id="bk-error" style="display:none"></div>
      </div>

      <!-- Step 5 : Success -->
      <div class="bk-step" data-step="5">
        <div class="bk-success">
          <div class="bk-success-icon">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          </div>
          <h4>Demande envoyée !</h4>
          <p>Nous vous confirmerons votre réservation par email dans les meilleurs délais.</p>
          <div class="bk-summary" id="bk-summary-final"></div>
        </div>
      </div>
    </div>

    <div class="bk-footer" id="bk-footer">
      <div class="bk-step-indicator">
        <div class="bk-step-dot active"></div>
        <div class="bk-step-dot"></div>
        <div class="bk-step-dot"></div>
        <div class="bk-step-dot"></div>
      </div>
      <div class="bk-actions">
        <button class="bk-btn bk-btn-back" id="bk-back" style="display:none" onclick="bkBack()">← Retour</button>
        <button class="bk-btn bk-btn-next" id="bk-next" onclick="bkNext()" disabled>Continuer →</button>
      </div>
    </div>
  </div>
</div>

<div class="wc-watermark">
  Maquette conçue par <strong>WEBCONCEPTOR</strong> &middot;
  <a href="https://webconceptor.fr" target="_blank">webconceptor.fr</a> &middot;
  Toute reproduction interdite
</div>

<script>
const BK = {
  step: 1,
  date: null,
  time: null,
  guests: null,
  prospectSlug: ${JSON.stringify(prospect.slug)},
  prospectName: ${JSON.stringify(prospect.name)},
};

const MONTHS = ["janv.","févr.","mars","avril","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const MONTHS_FULL = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FULL = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function bkOpen() {
  document.getElementById("bk-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  if (!document.getElementById("bk-dates").children.length) bkRenderDates();
  if (!document.getElementById("bk-times-lunch").children.length) bkRenderTimes();
  if (!document.getElementById("bk-guests").children.length) bkRenderGuests();
}
function bkClose() {
  document.getElementById("bk-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function bkRenderDates() {
  const el = document.getElementById("bk-dates");
  const monthLabel = document.getElementById("bk-month-label");
  el.innerHTML = "";
  const today = new Date();
  today.setHours(0,0,0,0);
  const firstDate = new Date(today);
  const dow = (firstDate.getDay() + 6) % 7;
  firstDate.setDate(firstDate.getDate() - dow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstDate);
    d.setDate(d.getDate() + i);
    const btn = document.createElement("button");
    btn.className = "bk-date";
    const past = d < today;
    const tooFar = (d - today) / (1000 * 60 * 60 * 24) > 60;
    if (past || tooFar) btn.classList.add("disabled");
    const iso = d.toISOString().slice(0, 10);
    btn.innerHTML = \`<span class="bk-date-num">\${d.getDate()}</span><span class="bk-date-mo">\${MONTHS[d.getMonth()]}</span>\`;
    btn.setAttribute("data-iso", iso);
    btn.onclick = () => {
      if (btn.classList.contains("disabled")) return;
      document.querySelectorAll(".bk-date.selected").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      BK.date = iso;
      bkUpdateNext();
    };
    el.appendChild(btn);
  }
  const firstVisible = new Date(firstDate);
  monthLabel.textContent = MONTHS_FULL[firstVisible.getMonth()] + " " + firstVisible.getFullYear();
}

function bkRenderTimes() {
  const lunchSlots = ["12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00"];
  const dinnerSlots = ["19:00","19:15","19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30"];
  const renderSlots = (targetId, slots) => {
    const t = document.getElementById(targetId);
    t.innerHTML = "";
    for (const s of slots) {
      const b = document.createElement("button");
      b.className = "bk-time";
      b.textContent = s;
      b.onclick = () => {
        document.querySelectorAll(".bk-time.selected").forEach(x => x.classList.remove("selected"));
        b.classList.add("selected");
        BK.time = s;
        bkUpdateNext();
      };
      t.appendChild(b);
    }
  };
  renderSlots("bk-times-lunch", lunchSlots);
  renderSlots("bk-times-dinner", dinnerSlots);
}

function bkRenderGuests() {
  const el = document.getElementById("bk-guests");
  el.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const b = document.createElement("button");
    b.className = "bk-guest";
    b.textContent = i === 10 ? "10+" : String(i);
    b.onclick = () => {
      document.querySelectorAll(".bk-guest.selected").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      BK.guests = i;
      bkUpdateNext();
    };
    el.appendChild(b);
  }
}

function bkUpdateNext() {
  const btn = document.getElementById("bk-next");
  const step = BK.step;
  let valid = false;
  if (step === 1) valid = !!BK.date;
  if (step === 2) valid = !!BK.time;
  if (step === 3) valid = !!BK.guests;
  if (step === 4) {
    const n = document.getElementById("bk-name").value.trim();
    const e = document.getElementById("bk-email").value.trim();
    const p = document.getElementById("bk-phone").value.trim();
    valid = n.length >= 2 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(e) && p.length >= 6;
  }
  btn.disabled = !valid;
}

["bk-name","bk-email","bk-phone"].forEach(id => {
  document.getElementById(id).addEventListener("input", bkUpdateNext);
});

function bkGoStep(n) {
  BK.step = n;
  document.querySelectorAll(".bk-step").forEach(s => s.classList.remove("active"));
  document.querySelector('.bk-step[data-step="' + n + '"]').classList.add("active");
  const dots = document.querySelectorAll(".bk-step-dot");
  dots.forEach((d, i) => { if (i < n) d.classList.add("active"); else d.classList.remove("active"); });
  document.getElementById("bk-back").style.display = n > 1 && n < 5 ? "" : "none";
  const nextBtn = document.getElementById("bk-next");
  if (n === 4) nextBtn.textContent = "Confirmer ma réservation →";
  else nextBtn.textContent = "Continuer →";
  if (n === 5) document.getElementById("bk-footer").style.display = "none";
  else document.getElementById("bk-footer").style.display = "";
  bkUpdateNext();
}

function bkBack() { if (BK.step > 1) bkGoStep(BK.step - 1); }

async function bkNext() {
  if (BK.step < 4) {
    if (BK.step === 3) bkBuildSummary();
    bkGoStep(BK.step + 1);
    return;
  }
  const btn = document.getElementById("bk-next");
  const err = document.getElementById("bk-error");
  err.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Envoi…";
  try {
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospect_slug: BK.prospectSlug,
        customer_name: document.getElementById("bk-name").value.trim(),
        customer_email: document.getElementById("bk-email").value.trim(),
        customer_phone: document.getElementById("bk-phone").value.trim(),
        booking_date: BK.date,
        booking_time: BK.time,
        guests: BK.guests,
        notes: document.getElementById("bk-notes").value.trim(),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Erreur lors de l'envoi");
    }
    document.getElementById("bk-summary-final").innerHTML = document.getElementById("bk-summary").innerHTML;
    bkGoStep(5);
  } catch (e) {
    err.textContent = e.message || "Erreur lors de l'envoi de la réservation";
    err.style.display = "";
    btn.disabled = false;
    btn.textContent = "Confirmer ma réservation →";
  }
}

function bkBuildSummary() {
  const d = new Date(BK.date + "T12:00:00");
  const dateStr = DAYS_FULL[d.getDay()] + " " + d.getDate() + " " + MONTHS_FULL[d.getMonth()];
  document.getElementById("bk-summary").innerHTML = \`
    <div class="bk-sum-row"><span>Date</span><strong>\${dateStr}</strong></div>
    <div class="bk-sum-row"><span>Heure</span><strong>\${BK.time}</strong></div>
    <div class="bk-sum-row"><span>Convives</span><strong>\${BK.guests}\${BK.guests >= 10 ? "+" : ""} personne\${BK.guests > 1 ? "s" : ""}</strong></div>
  \`;
}

document.addEventListener("keydown", (e) => { if (e.key === "Escape") bkClose(); });
</script>

</body>
</html>`;
}
