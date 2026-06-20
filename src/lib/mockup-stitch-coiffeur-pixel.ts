/**
 * Template Stitch COIFFEUR — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/coiffeur_name/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type CoiffeurPixelProspect = {
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
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchCoiffeurPixelMockupHtml(p: CoiffeurPixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>

<html class="scroll-smooth" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${name} - Salon de coiffure à ${city}</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&amp;family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Theme Configuration -->
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-fixed-dim": "#cac6c4",
                    "surface-container-lowest": "#ffffff",
                    "tertiary-container": "#1c1b1a",
                    "on-tertiary-container": "#868382",
                    "primary": "#000000",
                    "surface-tint": "#5f5e5e",
                    "secondary": "#5e5e5e",
                    "primary-fixed": "#e5e2e1",
                    "tertiary-fixed": "#e6e2df",
                    "on-tertiary": "#ffffff",
                    "tertiary": "#000000",
                    "secondary-fixed-dim": "#c7c6c6",
                    "surface-container-high": "#ebe7e6",
                    "inverse-on-surface": "#f4f0ef",
                    "secondary-container": "#e1dfdf",
                    "on-surface": "#1c1b1b",
                    "outline-variant": "#c4c7c7",
                    "on-secondary": "#ffffff",
                    "error-container": "#ffdad6",
                    "surface-bright": "#fdf8f8",
                    "primary-container": "#1c1b1b",
                    "on-background": "#1c1b1b",
                    "on-error-container": "#93000a",
                    "surface-dim": "#ddd9d8",
                    "outline": "#747878",
                    "surface-container-highest": "#e5e2e1",
                    "surface-container-low": "#f7f3f2",
                    "secondary-fixed": "#e4e2e2",
                    "inverse-primary": "#c8c6c5",
                    "on-tertiary-fixed-variant": "#484645",
                    "on-tertiary-fixed": "#1c1b1a",
                    "primary-fixed-dim": "#c8c6c5",
                    "on-primary-container": "#858383",
                    "on-primary": "#ffffff",
                    "on-primary-fixed": "#1c1b1b",
                    "on-error": "#ffffff",
                    "surface": "#fdf8f8",
                    "on-surface-variant": "#444748",
                    "inverse-surface": "#313030",
                    "on-secondary-fixed": "#1b1c1c",
                    "surface-container": "#f1edec",
                    "on-secondary-container": "#626263",
                    "background": "#fdf8f8",
                    "error": "#ba1a1a",
                    "on-secondary-fixed-variant": "#464747",
                    "surface-variant": "#e5e2e1",
                    "on-primary-fixed-variant": "#474746"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "stack-gap": "1rem",
                    "section-gap": "5rem",
                    "container-max": "1200px",
                    "mobile-padding": "1.5rem",
                    "desktop-padding": "4rem"
            },
            "fontFamily": {
                    "headline-lg": [
                            "EB Garamond"
                    ],
                    "label-sm": [
                            "Plus Jakarta Sans"
                    ],
                    "headline-lg-mobile": [
                            "EB Garamond"
                    ],
                    "label-lg": [
                            "Plus Jakarta Sans"
                    ],
                    "body-md": [
                            "Plus Jakarta Sans"
                    ],
                    "headline-display": [
                            "EB Garamond"
                    ]
            },
            "fontSize": {
                    "headline-lg": [
                            "36px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "500"
                            }
                    ],
                    "label-sm": [
                            "12px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "0.05em",
                                    "fontWeight": "600"
                            }
                    ],
                    "headline-lg-mobile": [
                            "30px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "600"
                            }
                    ],
                    "label-lg": [
                            "14px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "0.08em",
                                    "fontWeight": "700"
                            }
                    ],
                    "body-md": [
                            "16px",
                            {
                                    "lineHeight": "1.6",
                                    "fontWeight": "400"
                            }
                    ],
                    "headline-display": [
                            "48px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "-0.01em",
                                    "fontWeight": "600"
                            }
                    ]
            }
    },
        },
      }
    </script>
<style>
        /* Grain overlay implementation without base64 */
        .grain-overlay::before {
            content: "";
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.04;
            background-image: repeating-radial-gradient(circle at 17% 32%, white, black 0.00085px);
            mix-blend-mode: multiply;
        }
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.filled {
            font-variation-settings: 'FILL' 1;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md text-body-md grain-overlay antialiased selection:bg-surface-variant selection:text-on-surface">
<!-- TopNavBar -->
<header class="bg-surface/95 backdrop-blur-sm sticky top-[54px] z-40 border-b border-outline-variant w-full shadow-sm">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<div class="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">
                ${name}
            </div>
<!-- Desktop Nav -->
<nav class="hidden md:flex items-center gap-8">
<a class="font-label-lg text-label-lg text-primary border-b-2 border-primary pb-1 scale-95 transition-transform" href="#accueil">Accueil</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<button class="hidden md:block bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-DEFAULT hover:opacity-80 transition-opacity duration-300 uppercase tracking-widest">
                Devis
            </button>
<!-- Mobile Menu Toggle -->
<button class="md:hidden text-on-surface p-2">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding py-section-gap grid grid-cols-1 md:grid-cols-12 gap-stack-gap items-center min-h-[819px]" id="accueil">
<div class="md:col-span-5 flex flex-col gap-8 z-10">
<span class="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest">Sur-mesure, soin du cheveu</span>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-display md:text-headline-display text-primary leading-tight">
                    Salon de coiffure à ${city}
                </h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">
                    L'excellence du savoir-faire français dédiée à la beauté de vos cheveux. Un espace pensé pour la détente, la précision et le soin profond.
                </p>
<div>
<button class="bg-primary text-on-primary font-label-lg text-label-lg px-8 py-4 rounded-DEFAULT hover:opacity-80 transition-opacity duration-300 uppercase tracking-widest inline-flex items-center gap-2">
                        Réserver en ligne
                        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
<div class="md:col-span-7 h-[500px] md:h-[700px] w-full relative rounded-xl overflow-hidden shadow-sm">
<div class="absolute inset-0 bg-surface-container-high mix-blend-multiply opacity-20 z-10"></div>
<img class="w-full h-full object-cover grayscale-[20%]" data-alt="A wide architectural shot of an empty, high-end hair salon interior. The design is modern, minimalist, and deeply elegant, featuring creamy textured walls, dark wood accents, and subtle touches of old rose (vieux rose) in the upholstery. The space is illuminated by soft, natural light creating a serene, premium atmosphere. No people or faces are visible. The overall aesthetic is clean, luxurious, and highly professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMluk9R3koQVZ-vTqWOiSUqLYEP7cDnZMUuv7x8cdTg_Kfj9qHYNYWzf7LDIwV3OVEWNJtYkeqshJVFJok3zx5eN4B-8XitMrIxoAhlStsrTJAvGqQY-XUmywo490s7etISCipUfUAb6zbnysH7Wss74asuOA7JaHVA21Dj2R8opC0q8hrb-gfbjz_k2Jw_baFubWmfeHAqXZ2pZ5kucyeNuFimBNE22Lcld_q4p11q2Uxmeo4c5V5aRe9HY4gJfRW-9zX6dFvNbM"/>
</div>
</section>
<!-- Savoir-faire Section -->
<section class="bg-surface-container-low py-section-gap border-y border-outline-variant" id="savoir-faire">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding grid grid-cols-1 md:grid-cols-2 gap-[4rem] items-center">
<div class="order-2 md:order-1 h-[600px] rounded-xl overflow-hidden shadow-sm relative">
<img class="w-full h-full object-cover" data-alt="A highly detailed, ultra-sharp macro photograph of professional hair cutting scissors and a high-quality tortoiseshell comb laid perfectly flat on a finely textured, cream-colored surface. The composition is rigorous and geometric. Lighting is soft and directional, highlighting the metallic sheen of the scissors against the warm background. The mood conveys precision, heritage, and absolute mastery of the craft. No hands or faces." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwTXwqHVNXftAQwOTYx-I__Hsv5DimTlOHNkWk4nUyqKC-ae3n8AR16mTeLgIqBoZwd47eYaqNAXx6OmPwDX0-xNVrXne6VzRvUYwH1Hua7ytZ1Nes0k1OVIS8gCKJpEbPlJoWbto5QCxTQzwoDL1ahUiLi5BEXw6ank7jtl_gaDG5fG9i4zSEayOPV0PAQNe3nWnSIJVh4ufBtz7IzXW6aB_nLTUTe9TpCUsDSclKcYdpDTauPkH3uSM-NN6TVJap-lV9KD8t-yc"/>
</div>
<div class="order-1 md:order-2 flex flex-col gap-6">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
                        L'art du geste juste
                    </h2>
<div class="w-12 h-[1px] bg-outline-variant"></div>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Chaque coupe, chaque coloration est pensée comme une pièce unique. Nous privilégions une approche architecturale du cheveu, où la structure rencontre la fluidité naturelle. Notre maîtrise technique s'efface pour laisser place à l'évidence d'un style qui vous est propre.
                    </p>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Nos outils sont le prolongement de notre vision : des ciseaux affûtés avec une précision chirurgicale, des peignes façonnés dans des matières nobles. C'est dans ce respect inébranlable du métier que réside notre promesse de qualité.
                    </p>
</div>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding py-section-gap flex flex-col gap-12" id="services">
<div class="text-center flex flex-col items-center gap-4">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
                    Nos Prestations
                </h2>
<div class="w-12 h-[1px] bg-outline-variant"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Coupe & Coiffage -->
<div class="md:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-shadow">
<div class="w-full md:w-1/2 h-64 md:h-auto relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A focused, artistic shot of a single, stylish vintage-inspired styling chair upholstered in a muted old rose (vieux rose) velvet. The chair sits in a sunlit corner of an elegant salon with smooth, creamy walls. The lighting is moody yet inviting, highlighting the texture of the fabric and the solid, reliable structure of the chair. No people." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRtDjlUxZ4EMu_lkpKewKN7KNbbDFnAD3R4LYBsPeE5ZgUkYmO6bQ1XhCU2d79ywuzT-kCby_NwrGU2acjj2h6Cr_zPxGp5Dqt3GwzRTUo8rd2hmXM1-M_MAmUsZVXHTF5VcN0Ec9wTiqls1Y8hqqrl-jF-9fIwte_YNZ9JQ2sszAfOU7SfjDlF49HuS4YY1bJ8l9EKLH1g3tJiv-3iKy15w1eYiI_jJgBNvCcRrhwWEjglyeitEv_ZjSWEe8cAlL028vlipVoMII"/>
</div>
<div class="p-8 flex flex-col justify-center w-full md:w-1/2">
<h3 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-2">Coupe &amp; Coiffage</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-6">Une architecture capillaire sur-mesure, respectant la nature de vos cheveux et la morphologie de votre visage.</p>
<span class="font-label-sm text-label-sm text-secondary uppercase border-b border-secondary w-fit pb-1 group-hover:text-primary group-hover:border-primary transition-colors">Découvrir</span>
</div>
</div>
<!-- Couleur -->
<div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
<div class="h-48 relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A beautifully composed close-up shot of premium hair coloring mixing bowls and brushes laid out on a dark, polished wood surface. The tools are clean and professional. Soft, warm directional lighting highlights the textures. The background is slightly out of focus, emphasizing the high-end nature of the technical process. No faces, clean aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI3UJy9JBV2sMvBoMlvFRuBw7B-rvG9uvBzojILqPcTNYJz5A7oWidUtsGo8zy6tVn71e8CJjZnAiaQM6SNSTrvupd7t2ExThcyFlhRgqOipeTwRiCaJEY8BzyN_4vY0XV-ED4ilSKuFuQgZuI6hqc8Gli0M8msPh8OwmCSe-uZaWGa6Ss9JSxdEeDcIIjbskqLu9uxzScLLWuj_SrdU3XPwQMbjvgwTidkL8ejRYkN5eYzWzxtL6AqaDgQdKgO-ZyigB-PWcMHK0"/>
</div>
<div class="p-6 flex flex-col flex-grow justify-between">
<div>
<h3 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-2">Couleur</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Balayage, coloration végétale, nuances subtiles.</p>
</div>
</div>
</div>
<!-- Soins Profonds -->
<div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
<div class="h-48 relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A beautifully composed close-up shot of premium hair care products arranged meticulously on a dark, polished wood shelf. The bottles are elegant and minimalist, reflecting a luxurious aesthetic. Soft, warm directional lighting highlights the textures of the bottles and creates subtle reflections. No faces." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-zmjjSheIFazywdiaXvW4YkLjlD0UTd1Xxx74MhobhLl8qx4ZeO_FCQ_2i8XJakszu9RUm_9zB3Zy_uhdC2iXE4ydn31-K4ifDm4Z_s6LAvGX_7yJq9gNwIGFDNNE1r9fBGfw5DnIMeApHXiRDA3P0ydc1Vz7gJNFn-7zSOUWNp2JBnqarp9AsEayaN5ovGBr-5_GRu3czsmdOAjN7E3JTz7xfMx-5H_QmLYcBiuigrxOhTFGuAY-CHFHeMF3LwQxEIWSIo48Fxo"/>
</div>
<div class="p-6 flex flex-col flex-grow justify-between">
<div>
<h3 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-2">Soins Profonds</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Rituels réparateurs et bains nutritifs ciblés.</p>
</div>
</div>
</div>
<!-- Coiffure Mariage -->
<div class="md:col-span-2 bg-surface-container-low rounded-xl shadow-sm border border-outline-variant/30 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
<div class="absolute inset-0 bg-surface-variant/20 z-0"></div>
<div class="z-10 flex flex-col items-center">
<span class="material-symbols-outlined text-[32px] text-primary mb-4">favorite</span>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-3">Coiffure Mariage</h3>
<p class="font-body-md text-body-md text-on-surface-variant max-w-lg mb-6">
                            L'accompagnement exclusif pour le jour de votre cérémonie. Essais, conseils personnalisés et réalisation minutieuse pour une tenue parfaite.
                        </p>
<button class="border border-outline text-primary font-label-lg text-label-lg px-6 py-2 rounded-DEFAULT hover:bg-primary hover:text-on-primary transition-colors duration-300 uppercase tracking-widest">
                            Prendre Rendez-vous
                        </button>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding py-section-gap" id="contact">
<div class="grid grid-cols-1 md:grid-cols-2 gap-12 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-8 md:p-12">
<div class="flex flex-col gap-8">
<div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary mb-2">
                            L'Atelier
                        </h2>
<p class="font-body-md text-body-md text-on-surface-variant">Nous vous accueillons sur rendez-vous.</p>
</div>
<div class="flex flex-col gap-6">
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">location_on</span>
<div>
<h4 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">Adresse</h4>
<p class="font-body-md text-body-md text-on-surface-variant">${addressDisplay}'Artisanat<br/>${city}</p>
</div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">schedule</span>
<div>
<h4 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">Horaires</h4>
<p class="font-body-md text-body-md text-on-surface-variant">Mardi - Samedi : 9h00 - 19h00<br/>Fermé le Lundi et Dimanche</p>
</div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">call</span>
<div>
<h4 class="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">Téléphone</h4>
<p class="font-body-md text-body-md text-on-surface-variant">${phoneDisplay}</p>
</div>
</div>
</div>
</div>
<div class="h-64 md:h-auto rounded-lg overflow-hidden bg-surface-variant">
<img class="w-full h-full object-cover grayscale-[30%] mix-blend-multiply opacity-90" data-alt="An abstract, tightly cropped architectural detail of a classic French building facade in soft morning light. The image features elegant stonework and a subtle wrought iron detail, conveying a sense of established local presence and reliable heritage. The color palette is composed of warm creams and cool grays. No people, highly structured and calm." data-location="${city}" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANLRZ2gL4A8OPWpYaIxc5W-MTZd8ZS3cDmChy5-sego9ZI-7y89Mgx31anuKo3PJ28iwCNoSA5FWPqoYC8SCfeqr5j0Poju1Q8ir-msCxKc2UQWIUV_QZrMOzwm2odBXyiyvkVDZ6a3Y_YmSJW2S9Gr9AMQp_UooP8WV-YMr0PLrl0lz7SeThjXaRNJvFMdHKfmtftLUY7Oo4ZnsjzDmEBHUCQNFrDbbp_BEICUl6dsV4k-bSjfmjPvgp5vVALA9tKlCKHyhuLXP4"/>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high w-full border-t border-outline-variant">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<div class="flex flex-col gap-4">
<span class="font-headline-lg text-headline-lg text-on-surface">${name}</span>
<p class="font-body-md text-body-md text-on-surface-variant max-w-xs">
                    L'exigence au service de votre beauté, au cœur de ${city}.
                </p>
</div>
<div class="flex flex-col gap-4">
<h4 class="font-label-sm text-label-sm text-primary uppercase tracking-widest">Navigation</h4>
<nav class="flex flex-col gap-2">
<a class="font-body-md text-body-md text-primary font-bold hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#accueil">Accueil</a>
<a class="font-body-md text-body-md text-on-surface-variant/70 hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#savoir-faire">Savoir-faire</a>
<a class="font-body-md text-body-md text-on-surface-variant/70 hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#services">Services</a>
</nav>
</div>
<div class="flex flex-col gap-4">
<h4 class="font-label-sm text-label-sm text-primary uppercase tracking-widest">Informations</h4>
<nav class="flex flex-col gap-2">
<a class="font-body-md text-body-md text-on-surface-variant/70 hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#">Mentions Légales</a>
<a class="font-body-md text-body-md text-on-surface-variant/70 hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#">Confidentialité</a>
<a class="font-body-md text-body-md text-on-surface-variant/70 hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#">CGV</a>
</nav>
<div class="mt-4 pt-4 border-t border-outline-variant/30">
<p class="font-label-sm text-label-sm text-on-surface-variant">© ${year} ${name}. Tous droits réservés.</p>
</div>
</div>
</div>
</footer>
<!-- Mobile Floating Action Button (FAB) -->
<button class="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-on-primary rounded-full p-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface">
<span class="material-symbols-outlined filled">calendar_month</span>
</button>
</body></html>`;
}
