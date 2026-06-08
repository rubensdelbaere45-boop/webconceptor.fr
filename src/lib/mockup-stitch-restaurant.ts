/**
 * mockup-stitch-restaurant.ts
 * ─────────────────────────────────────────────────────────────
 * Copie pixel-pixel de la maquette Stitch "L'Armoire à Cuillères"
 * (design system "Artisanal Cacao & Comfort") — accueil_l_armoire_cuill_res.
 *
 * Utilise Tailwind CDN + Google Fonts (EB Garamond + DM Sans) +
 * Material Symbols, EXACTEMENT comme Stitch.
 *
 * Templatise uniquement : nom, ville, adresse, téléphone, horaires,
 * note Google, avis, copywriting IA.
 * Conserve les photos Google AI Imagen (aida-public) car elles sont
 * HD, stables et thématiques gourmand/cocooning.
 *
 * S'applique à : restaurant_gastronomique, restaurant_bistrot,
 * boulangerie_patisserie, chocolaterie_salon_the.
 * ─────────────────────────────────────────────────────────────
 */

interface StitchProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  hours?: string | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo?: string }> | null;
}

interface StitchCopy {
  hero_caps: string;
  hero_title: string;
  hero_subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  univers_title: string;
  univers_paragraph1: string;
  univers_paragraph2: string;
  univers_badge: string;
  savoir_faire_title: string;
  savoir_faire_subtitle: string;
  savoir_faire_cards: Array<{ title: string; body: string }>;
  testimonials: Array<{ author: string; quote: string }>;
  cta_final_title: string;
  cta_final_paragraph: string;
  cta_final_button: string;
  footer_tagline: string;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Photos Google AI Imagen — exactement celles de la maquette Stitch
// (URLs publiques, stables, HD, thématique gourmand/cocooning)
const STITCH_PHOTOS = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuACHDp0ORgtmyUs_ZCGH6oQ1PXtOMjyzSLjC9ktUKn8F4WNsjSDfNqqVCxGLY3eTjMAXubm1zsirfZVQUmGrfUs8HO_JnpctwxidVM4B2Dbt2cElLHGNZkkinr1HKSBTwSSO-XW2byMXzmX89mmZKf6jX9x32_9V1tRZ2o9ICN_31_9HDIjTCihWqVJULg3s_pnOxyzZYNLgY-KOxFeShKR6ksxAn7YpF89pIw0ciVwsTGkapzQXzd8XL-Yi8UQduRo1Dhb-AA9gRPZ",
  univers: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG6F6pTnWlAV2G2WMkupGrO8Wjz02a17WS9fEagbRiKXqOmq4Ali_F3uMFatPu8U_tjYe7gTVcdoxqRJKpfu1YLIDwP-nCu4CdMTXskaIPiVYU_WdgMAhkP0w8wkv4cENM-p65_dkAuZbPlAjDHySo44UbkGennaePHF71WkBvd1VDbJT9oZNE_fs_EOrOT07J5sRIsPHsTGVNsmalRyIONXILI5dt46jBJxxOtq9417b6qWmLDSujbAhgV0srBHSrochKtOV7ulWM",
  craft: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAh5Oh94aKUYhqBUztkV_kMIZAdo_0FO6hcvbQJOKX8BQTZikG6PK33cWCTiYudlVM8Z58Xnr4w-bo6wHRI2_dsDl5umzrfBDbKDu4_auA0sal1sAV65W4hfewG7zhtKNC2ZcscsP8rqW-zXQJ_jlcHVMsNN8Ds2LEumEKzHpGUrjYrn08HfuOFDFez-mYH8SDYh4y4AgkmQPcHoO5ipa5zTKNM5hSirb_jetkc-l7o1yCbj0Gq0qwb1ve7WHbjUbeDZtdMxy24Tg-",
};

function parseHoursList(raw: string | null | undefined): Array<{ day: string; hours: string }> | null {
  if (!raw) return null;
  const lines = raw.split(/\s*[\|\n]\s*/).map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const dayMap: Record<string, string> = {
    lun: "Lundi", lundi: "Lundi", mar: "Mardi", mardi: "Mardi",
    mer: "Mercredi", mercredi: "Mercredi", jeu: "Jeudi", jeudi: "Jeudi",
    ven: "Vendredi", vendredi: "Vendredi", sam: "Samedi", samedi: "Samedi",
    dim: "Dimanche", dimanche: "Dimanche",
  };
  const out: Array<{ day: string; hours: string }> = [];
  for (const line of lines) {
    const m = line.match(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun|mar|mer|jeu|ven|sam|dim)\s*[:\-]?\s*(.+)$/i);
    if (m) out.push({ day: dayMap[m[1].toLowerCase()] || m[1], hours: m[2].trim() });
  }
  return out.length >= 2 ? out : null;
}

function starsHtml(rating: number | null | undefined): string {
  const r = rating || 5;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let out = "";
  for (let i = 0; i < full; i++) out += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>`;
  if (half) out += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star_half</span>`;
  return out;
}

export function renderStitchRestaurant(prospect: StitchProspect, copy: StitchCopy): string {
  const city = prospect.city || "votre ville";
  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const ratingDisplay = prospect.google_rating ? prospect.google_rating.toFixed(1) : "4.8";
  const reviewsCount = prospect.google_reviews_count || 200;
  const hoursList = parseHoursList(prospect.hours);

  // Avis : 4 max (Stitch en montre 4 dans le carousel infini)
  const reviewsForTestimonials = (prospect.reviews && prospect.reviews.length >= 3
    ? prospect.reviews.slice(0, 4)
    : copy.testimonials.map(t => ({ author: t.author, rating: 5, text: t.quote }))
  );

  return `<!DOCTYPE html>
<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(prospect.name)} | ${esc(city)}</title>
<meta name="description" content="${esc(copy.footer_tagline)}"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&amp;family=EB+Garamond:ital,wght@0,400..800;1,400..800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
              "creamy-beige": "#DCD7CA",
              "deep-cacao": "#2D1B17",
              "milky-ganache": "#8D6E63",
              "soft-gold": "#C5A059",
              "berry-accent": "#CD2653",
              "primary": "#110403",
              "primary-container": "#2d1b17",
              "on-surface": "#221a16",
              "on-surface-variant": "#4f4442",
              "surface": "#fff8f6",
              "surface-container": "#fceae4",
              "surface-container-low": "#fff1ec",
              "surface-container-high": "#f6e5df",
              "surface-container-highest": "#f0dfd9",
              "background": "#fff8f6",
              "outline-variant": "#d3c3c0",
              "tertiary-container": "#20201d",
              "tertiary-fixed-dim": "#c9c6c2",
              "inverse-on-surface": "#ffede7"
            },
            "borderRadius": {"DEFAULT":"0.25rem","lg":"0.5rem","xl":"0.75rem","full":"9999px"},
            "spacing": {"unit":"8px","section-gap":"80px","margin-mobile":"20px","gutter":"24px","container-max":"1200px"},
            "fontFamily": {
              "body-lg":["DM Sans"],"body-md":["DM Sans"],
              "headline-md":["EB Garamond"],"headline-sm":["EB Garamond"],
              "display-lg-mobile":["EB Garamond"],"display-lg":["EB Garamond"],
              "label-caps":["DM Sans"]
            },
            "fontSize": {
              "body-lg":["18px",{"lineHeight":"1.6","fontWeight":"400"}],
              "body-md":["16px",{"lineHeight":"1.6","fontWeight":"400"}],
              "headline-md":["32px",{"lineHeight":"1.3","fontWeight":"500"}],
              "headline-sm":["24px",{"lineHeight":"1.4","fontWeight":"500"}],
              "display-lg-mobile":["40px",{"lineHeight":"1.2","fontWeight":"600"}],
              "display-lg":["56px",{"lineHeight":"1.1","letterSpacing":"-0.02em","fontWeight":"600"}],
              "label-caps":["12px",{"lineHeight":"1.0","letterSpacing":"0.1em","fontWeight":"700"}]
            }
          }
        }
      }
    </script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  .scrolling-text { animation: scroll 28s linear infinite; }
  @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .reveal { opacity: 0; transform: translateY(20px); transition: all 0.8s ease-out; }
  .reveal.active { opacity: 1; transform: translateY(0); }
  .leaf-divider::after {
    content: 'eco'; font-family: 'Material Symbols Outlined'; font-size: 24px;
    color: #C5A059; display: block; margin: 20px auto; text-align: center;
  }
</style>
</head>
<body class="bg-background text-on-background selection:bg-soft-gold/30 selection:text-deep-cacao">

<!-- Header sticky transparent backdrop-blur -->
<header class="bg-surface/90 sticky top-0 backdrop-blur-md z-50 border-b border-milky-ganache/20">
<nav class="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-gutter py-4 w-full max-w-container-max mx-auto">
<div class="font-headline-md text-headline-md font-medium text-deep-cacao">
${esc(prospect.name)}
</div>
<div class="hidden md:flex items-center gap-8">
<a class="font-headline-sm text-headline-sm tracking-wide text-soft-gold border-b-2 border-soft-gold pb-1" href="#">Accueil</a>
<a class="font-headline-sm text-headline-sm tracking-wide text-on-surface-variant hover:text-soft-gold transition-colors" href="#savoir-faire">Savoir-Faire</a>
<a class="font-headline-sm text-headline-sm tracking-wide text-on-surface-variant hover:text-soft-gold transition-colors" href="#avis">Avis</a>
<a class="font-headline-sm text-headline-sm tracking-wide text-on-surface-variant hover:text-soft-gold transition-colors" href="#contact">Contact</a>
</div>
<a href="${phoneClean ? `tel:${phoneClean}` : "#contact"}" class="mt-4 md:mt-0 bg-deep-cacao text-creamy-beige px-8 py-2 rounded-full font-label-caps uppercase tracking-widest hover:bg-soft-gold hover:text-deep-cacao transition-all duration-300">
${esc(copy.cta_primary)}
</a>
</nav>
</header>

<main>

<!-- Hero Section — full-bleed avec photo Imagen + overlay gradient -->
<section class="relative min-h-[921px] flex items-center justify-center overflow-hidden bg-primary-container">
<div class="absolute inset-0 opacity-60">
<img alt="${esc(prospect.name)}" class="w-full h-full object-cover" src="${STITCH_PHOTOS.hero}"/>
</div>
<div class="absolute inset-0 bg-gradient-to-t from-deep-cacao via-transparent to-transparent"></div>
<div class="relative z-10 text-center px-margin-mobile max-w-3xl">
<span class="inline-block font-label-caps text-soft-gold mb-6 tracking-[0.3em] uppercase">${esc(copy.hero_caps)}</span>
<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-creamy-beige mb-8">
${esc(copy.hero_title)}
</h1>
<p class="font-body-lg text-body-lg text-creamy-beige/90 mb-10 leading-relaxed italic">
${esc(copy.hero_subtitle)}
</p>
<div class="flex flex-col sm:flex-row gap-4 justify-center">
<a href="#savoir-faire" class="bg-soft-gold text-deep-cacao px-10 py-4 rounded-full font-label-caps tracking-widest hover:bg-creamy-beige transition-all duration-300 shadow-xl shadow-soft-gold/10">
${esc(copy.cta_secondary)}
</a>
<a href="#contact" class="border border-soft-gold text-soft-gold px-10 py-4 rounded-full font-label-caps tracking-widest hover:bg-soft-gold/10 transition-all duration-300">
${esc(copy.cta_primary)}
</a>
</div>
</div>
</section>

<!-- Our Universe Section (Cocooning) -->
<section class="py-section-gap px-margin-mobile md:px-gutter max-w-container-max mx-auto reveal">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
<div class="relative">
<div class="aspect-[4/5] bg-surface-container-high rounded-xl overflow-hidden shadow-2xl">
<img alt="${esc(copy.univers_title)}" class="w-full h-full object-cover" src="${STITCH_PHOTOS.univers}"/>
</div>
<div class="absolute -bottom-8 -right-8 w-48 h-48 bg-soft-gold/10 backdrop-blur-md rounded-full items-center justify-center p-8 text-center border border-soft-gold/20 hidden md:flex">
<p class="font-headline-sm text-headline-sm text-deep-cacao italic">${esc(copy.univers_badge)}</p>
</div>
</div>
<div>
<h2 class="font-headline-md text-headline-md text-deep-cacao mb-8 border-l-4 border-soft-gold pl-6">${esc(copy.univers_title)}</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-6">
${esc(copy.univers_paragraph1)}
</p>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-8">
${esc(copy.univers_paragraph2)}
</p>
<div class="flex gap-12">
<div>
<div class="font-headline-sm text-headline-sm text-deep-cacao">${esc(ratingDisplay)}/5</div>
<div class="flex text-soft-gold">${starsHtml(prospect.google_rating)}</div>
<div class="font-label-caps text-on-surface-variant mt-2 uppercase tracking-widest">${reviewsCount} avis Google</div>
</div>
<div class="border-l border-milky-ganache/30 pl-12">
<div class="font-headline-sm text-headline-sm text-deep-cacao">${esc(city)}</div>
<div class="font-label-caps text-on-surface-variant mt-2 uppercase tracking-widest">Notre ancrage</div>
</div>
</div>
</div>
</div>
</section>

<!-- Savoir-Faire Bento Grid -->
<section id="savoir-faire" class="bg-surface-container-low py-section-gap">
<div class="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
<div class="text-center mb-16">
<h2 class="font-headline-md text-headline-md text-deep-cacao mb-4">${esc(copy.savoir_faire_title)}</h2>
<p class="font-body-md text-body-md text-milky-ganache italic uppercase tracking-widest">${esc(copy.savoir_faire_subtitle)}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter">

<!-- Card 1 (span 2 + photo intégrée) -->
<div class="md:col-span-2 bg-surface rounded-xl p-10 border border-milky-ganache/10 group overflow-hidden">
<div class="flex justify-between items-start mb-8">
<span class="material-symbols-outlined text-4xl text-soft-gold">bakery_dining</span>
<span class="font-label-caps text-soft-gold opacity-50">01</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-deep-cacao mb-4">${esc(copy.savoir_faire_cards[0]?.title || "Notre savoir-faire")}</h3>
<p class="font-body-md text-body-md text-on-surface-variant">${esc(copy.savoir_faire_cards[0]?.body || "")}</p>
<div class="mt-8 overflow-hidden rounded-lg h-48">
<img alt="${esc(copy.savoir_faire_cards[0]?.title || "")}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="${STITCH_PHOTOS.craft}"/>
</div>
</div>

<!-- Card 2 (dark deep-cacao avec icône or) -->
<div class="md:col-span-1 bg-deep-cacao text-creamy-beige rounded-xl p-10 flex flex-col justify-between">
<div>
<span class="material-symbols-outlined text-4xl text-soft-gold mb-8">restaurant_menu</span>
<h3 class="font-headline-sm text-headline-sm mb-4">${esc(copy.savoir_faire_cards[1]?.title || "Une signature")}</h3>
<p class="font-body-md text-body-md opacity-80">${esc(copy.savoir_faire_cards[1]?.body || "")}</p>
</div>
<a class="flex items-center gap-2 font-label-caps text-soft-gold mt-8 group" href="#contact">
Découvrir
<span class="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
</a>
</div>

<!-- Card 3 (cercle or centré) -->
<div class="md:col-span-1 bg-surface rounded-xl p-10 border border-milky-ganache/10 flex flex-col items-center justify-center text-center">
<div class="w-20 h-20 rounded-full border border-soft-gold flex items-center justify-center mb-6">
<span class="material-symbols-outlined text-3xl text-soft-gold">verified</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-deep-cacao mb-2">${esc(copy.savoir_faire_cards[2]?.title || "Qualité")}</h3>
<p class="font-body-md text-body-md text-on-surface-variant italic">${esc(copy.savoir_faire_cards[2]?.body || "")}</p>
</div>

</div>
</div>
</section>

<!-- Testimonials carousel infini -->
<section id="avis" class="py-section-gap overflow-hidden">
<div class="text-center mb-12 px-margin-mobile">
<h2 class="font-headline-md text-headline-md text-deep-cacao mb-3">Ils en parlent</h2>
<p class="font-body-md text-milky-ganache italic">${esc(ratingDisplay)}/5 sur ${reviewsCount} avis Google</p>
</div>
<div class="flex scrolling-text gap-gutter whitespace-nowrap py-10">
${[...reviewsForTestimonials, ...reviewsForTestimonials].map(r => `
<div class="min-w-[400px] p-8 bg-surface border border-milky-ganache/15 rounded-xl shadow-sm inline-block mx-4 whitespace-normal">
<div class="flex gap-1 text-soft-gold mb-4">${starsHtml(("rating" in r ? (r as any).rating : 5) as number)}</div>
<p class="font-body-md text-body-md text-on-surface italic mb-4">«&nbsp;${esc((r as any).text || (r as any).quote)}&nbsp;»</p>
<div class="font-label-caps text-milky-ganache uppercase tracking-widest">${esc((r as any).author)}</div>
</div>`).join("")}
</div>
</section>

<!-- Final CTA -->
<section id="contact" class="py-section-gap px-margin-mobile text-center bg-creamy-beige">
<div class="max-w-2xl mx-auto">
<span class="material-symbols-outlined text-soft-gold text-5xl mb-6">local_cafe</span>
<h2 class="font-headline-md text-headline-md text-deep-cacao mb-6">${esc(copy.cta_final_title)}</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-10">${esc(copy.cta_final_paragraph)}</p>
<a href="${phoneClean ? `tel:${phoneClean}` : "#"}" class="inline-block bg-deep-cacao text-creamy-beige px-12 py-5 rounded-full font-label-caps tracking-[0.2em] hover:scale-105 transition-transform duration-300">
${esc(copy.cta_final_button)}
</a>
${prospect.phone ? `<p class="mt-6 font-headline-sm text-headline-sm text-deep-cacao">${esc(prospect.phone)}</p>` : ""}
${prospect.address ? `<p class="mt-2 text-on-surface-variant">${esc(prospect.address)}</p>` : ""}
</div>
</section>

</main>

<footer class="bg-deep-cacao mt-section-gap border-t border-soft-gold/30">
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter px-margin-mobile md:px-gutter py-12 max-w-container-max mx-auto text-center md:text-left">
<div class="space-y-4">
<div class="font-headline-sm text-headline-sm text-soft-gold">${esc(prospect.name)}</div>
<p class="font-body-md text-body-md text-creamy-beige/60 leading-relaxed">${esc(copy.footer_tagline)}</p>
</div>
<div class="space-y-4 flex flex-col items-center md:items-start">
<div class="font-label-caps text-soft-gold uppercase mb-2 tracking-widest">Horaires</div>
${hoursList
  ? hoursList.map(h => `<div class="font-body-md text-body-md text-creamy-beige/80"><span class="font-medium">${esc(h.day)}</span> · ${esc(h.hours)}</div>`).join("")
  : `<p class="font-body-md text-body-md text-creamy-beige/80">Sur rendez-vous</p>`
}
</div>
<div class="space-y-4 flex flex-col items-center md:items-start">
<div class="font-label-caps text-soft-gold uppercase mb-2 tracking-widest">Contact</div>
${prospect.address ? `<div class="font-body-md text-body-md text-creamy-beige/80">${esc(prospect.address)}</div>` : ""}
${prospect.phone ? `<a class="font-body-md text-body-md text-creamy-beige/80 hover:text-soft-gold transition-colors" href="tel:${phoneClean}">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a class="font-body-md text-body-md text-creamy-beige/80 hover:text-soft-gold transition-colors" href="mailto:${esc(prospect.email)}">${esc(prospect.email)}</a>` : ""}
<div class="mt-4 font-body-md text-creamy-beige/60">© ${new Date().getFullYear()} ${esc(prospect.name)}.</div>
</div>
</div>
</footer>

<script>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      e.preventDefault();
      const t = document.querySelector(this.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });
</script>

</body></html>`;
}

export type { StitchProspect, StitchCopy };
