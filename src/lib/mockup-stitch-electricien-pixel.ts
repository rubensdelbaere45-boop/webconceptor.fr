/**
 * Template Stitch ELECTRICIEN — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/lectricien_name_1/code.html
 */
export type ElectricienPixelProspect = {
  id: string; slug: string; name: string;
  city?: string | null; address?: string | null;
  phone?: string | null; email?: string | null;
  hours?: string | null;
  google_rating?: number | null; google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  site_style_dna?: unknown;
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchElectricienPixelMockupHtml(p: ElectricienPixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>ARTISANAT LOCAL - Électricien</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-lowest": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "on-primary-container": "#858383",
                      "secondary-fixed": "#e4e2e2",
                      "on-secondary-fixed-variant": "#464747",
                      "on-primary-fixed-variant": "#474746",
                      "surface-container-low": "#f7f3f2",
                      "primary": "#000000",
                      "on-background": "#1c1b1b",
                      "on-tertiary-container": "#868382",
                      "inverse-surface": "#313030",
                      "surface-variant": "#e5e2e1",
                      "secondary-container": "#e1dfdf",
                      "on-tertiary-fixed": "#1c1b1a",
                      "secondary-fixed-dim": "#c7c6c6",
                      "tertiary-container": "#1c1b1a",
                      "on-error": "#ffffff",
                      "error-container": "#ffdad6",
                      "primary-fixed-dim": "#c8c6c5",
                      "on-secondary-fixed": "#1b1c1c",
                      "secondary": "#5e5e5e",
                      "on-primary": "#ffffff",
                      "on-error-container": "#93000a",
                      "surface-container-high": "#ebe7e6",
                      "surface": "#fdf8f8",
                      "inverse-primary": "#c8c6c5",
                      "primary-fixed": "#e5e2e1",
                      "tertiary": "#000000",
                      "on-surface": "#1c1b1b",
                      "on-primary-fixed": "#1c1b1b",
                      "surface-container": "#f1edec",
                      "inverse-on-surface": "#f4f0ef",
                      "surface-tint": "#5f5e5e",
                      "background": "#fdf8f8",
                      "tertiary-fixed": "#e6e2df",
                      "surface-container-highest": "#e5e2e1",
                      "on-surface-variant": "#444748",
                      "surface-bright": "#fdf8f8",
                      "error": "#ba1a1a",
                      "outline-variant": "#c4c7c7",
                      "surface-dim": "#ddd9d8",
                      "primary-container": "#1c1b1b",
                      "outline": "#747878",
                      "tertiary-fixed-dim": "#cac6c4",
                      "on-tertiary-fixed-variant": "#484645",
                      "on-secondary-container": "#626263",
                      "on-secondary": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-gap": "1rem",
                      "desktop-padding": "4rem",
                      "container-max": "1200px",
                      "section-gap": "5rem",
                      "mobile-padding": "1.5rem"
              },
              "fontFamily": {
                      "headline-lg-mobile": ["EB Garamond"],
                      "headline-display": ["EB Garamond"],
                      "headline-lg": ["EB Garamond"],
                      "label-sm": ["Plus Jakarta Sans"],
                      "body-md": ["Plus Jakarta Sans"],
                      "label-lg": ["Plus Jakarta Sans"]
              },
              "fontSize": {
                      "headline-lg-mobile": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "headline-display": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                      "headline-lg": ["36px", {"lineHeight": "1.3", "fontWeight": "500"}],
                      "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "label-lg": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700"}]
              }
            },
          },
        }
      </script>
<style>
        .texture-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        .shadow-level-1 {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .text-accent { color: #ca8a04; }
        .bg-accent { background-color: #ca8a04; }
        .border-accent { border-color: #ca8a04; }

        .parallax-container {
            position: relative;
            overflow: hidden;
        }

        .img-mask {
            clip-path: polygon(0 0, 100% 0, 100% 90%, 0% 100%);
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md text-body-md antialiased overflow-x-hidden selection:bg-accent selection:text-white relative">
<div class="texture-overlay"></div>
<!-- TopNavBar -->
<nav class="bg-surface/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant">
<div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
<a class="font-headline-lg text-headline-lg tracking-tighter text-primary" href="#">
            ARTISANAT LOCAL
        </a>
<div class="hidden md:flex items-center gap-8">
<a class="font-label-lg text-label-lg text-primary border-b-2 border-primary pb-1" href="#">Savoir-faire</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#">Réalisations</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
</div>
<div class="hidden md:block">
<a class="font-label-lg text-label-lg bg-primary text-on-primary px-6 py-3 rounded-none hover:bg-zinc-800 transition-all" href="#">DEVIS GRATUIT</a>
</div>
<button class="md:hidden text-primary">
<span class="material-symbols-outlined" style="font-size: 32px;">menu</span>
</button>
</div>
</nav>
<main class="pt-20">
<!-- Hero Section: Immersive Split Layout -->
<section class="relative min-h-[90vh] flex items-center bg-surface-container-lowest overflow-hidden">
<div class="grid grid-cols-1 lg:grid-cols-12 w-full max-w-full">
<!-- Left Content -->
<div class="lg:col-span-5 flex flex-col justify-center px-mobile-padding md:px-desktop-padding py-12 md:py-24 z-10">
<div class="flex flex-col gap-8 max-w-xl">
<div class="space-y-4">
<span class="font-label-sm text-label-sm text-accent uppercase tracking-[0.2em] bg-accent/10 px-4 py-1.5 inline-block">
                            Expertise Électrique de Pointe
                        </span>
<h1 class="font-headline-display text-[56px] leading-[1.1] text-primary">
                            ${name}
                        </h1>
<p class="font-body-md text-lg text-on-surface-variant leading-relaxed">
                            À ${city}, nous redéfinissons l'art de l'installation électrique. Une précision technique sans compromis pour une sécurité absolue de vos infrastructures.
                        </p>
</div>
<div class="flex flex-wrap gap-4 pt-4">
<a class="font-label-lg text-label-lg bg-primary text-on-primary px-10 py-5 hover:bg-zinc-800 transition-all uppercase tracking-widest" href="#">
                            Lancer votre projet
                        </a>
<a class="font-label-lg text-label-lg bg-transparent text-primary border border-primary px-10 py-5 hover:bg-surface-variant transition-all uppercase tracking-widest" href="#">
                            Découvrir nos solutions
                        </a>
</div>
<div class="grid grid-cols-3 gap-6 pt-12 border-t border-outline-variant">
<div class="flex flex-col gap-2">
<span class="material-symbols-outlined text-accent text-3xl">verified</span>
<span class="font-label-sm text-label-sm text-on-surface uppercase tracking-tight">Qualifelec</span>
</div>
<div class="flex flex-col gap-2">
<span class="material-symbols-outlined text-accent text-3xl">description</span>
<span class="font-label-sm text-label-sm text-on-surface uppercase tracking-tight">Étude Gratuite</span>
</div>
<div class="flex flex-col gap-2">
<span class="material-symbols-outlined text-accent text-3xl">shield</span>
<span class="font-label-sm text-label-sm text-on-surface uppercase tracking-tight">Décennale</span>
</div>
</div>
</div>
</div>
<!-- Right Visual: High Impact Macro -->
<div class="lg:col-span-7 relative h-[50vh] lg:h-auto min-h-[500px]">
<div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest to-transparent z-10 hidden lg:block"></div>
<img alt="Close-up detail of a professional electrical panel with organized wiring and industrial components, focus on precision and technical perfection." class="object-cover w-full h-full grayscale-[10%] contrast-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaCUkdW5i0W5Fud1RjIhTrOz62CwhoyWsHQHplS6OUfu54qw3_7dqL0MLMgQyBGeX7hfk7DzW5_tF0ik6BRr4n0SPLFY9aYQrRQehiElIh2-3agdnRnr7WycJ9V9D0R9p5jw8KJ0yb8eQVVFyth1T6UN-RcP5lBBMyD0hclV8rX_Y3c2QMnqAXGqZtnR0fkOSrzCiJYRvov_t2ZJG1HeBC7eS4Nxji-RiwdP7nxAMzaNQko11z7K88oaCu1sdtd-69XmMoBW0Mk_0"/>
<!-- Geometric Accent -->
<div class="absolute bottom-12 right-12 w-32 h-32 border-r-4 border-b-4 border-accent opacity-50"></div>
</div>
</div>
</section>
<!-- Technical Mastery Section: Dark Contrast -->
<section class="bg-primary text-on-primary py-section-gap relative overflow-hidden">
<div class="absolute top-0 right-0 w-1/3 h-full opacity-10">
<img alt="Technical pattern of circuit boards and copper wiring" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5vJ4Om6wIBarpus0vLeMt9AjQkHt5oqnGdEAmU4SER6ZBIVpG5PyCzRkS3f56RpaIF8gqekOhe5hwPVM66sp1NZ6MxDel29J0rfd4Unc_Xyy6fdTMY27SCNH1TZDXJRkjvsur25fC6CCZcHryoegrpdcc4dTstho_FTQYbBUQJ2gOgttIuf8wXbyy8dXl0Ge2xucGQz9WZ_MVnLD3PS4VK8HVgNykzYy-Ajvf8DHAFK4Nvh4bdpEmWVcWDpRwFpiFWSc7ARqSfDE"/>
</div>
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding relative z-10">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
<div class="relative group">
<div class="absolute -inset-4 bg-accent/20 scale-95 group-hover:scale-100 transition-transform duration-700"></div>
<img alt="Industrial electrical components and high-precision tools on a dark workshop surface" class="relative z-10 w-full h-[600px] object-cover shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVxbtsRbozmxqfYzEDY6MOSNcLvHVB0RZgQWNDbBjwp9UhCiOcbKE8JWcJEc4Ebv6L9dapSOuju-GD7iL9vjgEic-AwjeIVQ0ugPVahpE_unQg8tklHGZKLVtEvNzeeoFuiqDz6AR50dAdGg6NHY_A_--0OztIvL48q9YkTHwesGvZpEemJMn3iBOo8iv99N5GLO8iiwf3II2zyt5pYdFLtNcYAgH4Hh_bi5vmUYiMJJ2unCGpyznmBw1cqdWm26eVp7jFQonxZ-k"/>
</div>
<div class="flex flex-col gap-8">
<h2 class="font-headline-display text-headline-display">La Précision comme Signature</h2>
<div class="space-y-6 text-surface-variant font-body-md text-lg">
<p>Chaque raccordement, chaque gainage et chaque module est installé avec une rigueur mathématique. Nous croyons que la beauté d'une installation électrique réside dans son organisation invisible.</p>
<ul class="space-y-4">
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-accent mt-1">check_circle</span>
<div>
<h4 class="font-bold text-white">Domotique Intégrée</h4>
<p class="text-sm opacity-80">Systèmes intelligents pour une gestion optimisée de l'énergie.</p>
</div>
</li>
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-accent mt-1">check_circle</span>
<div>
<h4 class="font-bold text-white">Mise en Conformité</h4>
<p class="text-sm opacity-80">Remise aux normes NF C 15-100 pour une sécurité totale.</p>
</div>
</li>
</ul>
</div>
</div>
</div>
</div>
</section>
<!-- Materiality Section: Large Side-by-Side -->
<section class="grid grid-cols-1 md:grid-cols-2 bg-surface-container-low">
<div class="h-[600px] relative overflow-hidden">
<img alt="Macro shot of brushed copper and metallic conduit textures" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmKwfrLCK_LzsC7DSC2q8PFXOCtk5vviX7fvl5FcSEYKIEIY-fBdydnZ3eqCSMOuAKjl8w3vY2asF3ovO-p5xOYr52Wt40c5KyVWikXIhnBeCwJkvVSY7ChiclIgYa89n1NfmEPnR-BzK4oeWpyhLDkNifTSBkF6ellMtKkqQh3ApHlh2do_MrSO6l6rEeNlt-8vl5QSCbBD8jmJmHkScGDRkkzR9_75QlTkUmDucq_rbUswTY5G8AWBFxE60l2xmPBOEi4ZP5PYE"/>
<div class="absolute inset-0 bg-primary/20"></div>
</div>
<div class="flex flex-col justify-center p-12 md:p-24 bg-white border-l border-outline-variant">
<span class="font-label-sm text-accent tracking-widest mb-4">L'ART DE LA MATIÈRE</span>
<h3 class="font-headline-lg text-4xl mb-6">Matériaux Nobles, Sécurité Durable</h3>
<p class="text-on-surface-variant leading-relaxed mb-8">Nous sélectionnons exclusivement des composants de rang industriel pour garantir la pérennité de vos installations. Du cuivre haute pureté aux disjoncteurs de dernière génération, la qualité ne souffre d'aucune concession.</p>
<div class="grid grid-cols-2 gap-8">
<div class="border-l-2 border-accent pl-4">
<span class="block font-headline-lg text-3xl">100%</span>
<span class="text-xs uppercase tracking-widest opacity-60">Matériel Certifié</span>
</div>
<div class="border-l-2 border-accent pl-4">
<span class="block font-headline-lg text-3xl">15+</span>
<span class="text-xs uppercase tracking-widest opacity-60">Ans d'Expertise</span>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-highest w-full border-t border-outline-variant">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding py-16">
<div class="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
<div class="md:col-span-4">
<div class="font-headline-lg text-3xl text-primary mb-4">ARTISANAT LOCAL</div>
<p class="text-on-surface-variant max-w-xs">L'excellence de l'installation électrique au service du patrimoine et de l'innovation.</p>
</div>
<div class="md:col-span-4 flex flex-col gap-4">
<span class="font-label-lg text-primary uppercase tracking-widest">Liens Utiles</span>
<nav class="flex flex-col gap-2">
<a class="text-on-surface-variant hover:text-accent transition-colors" href="#">Mentions Légales</a>
<a class="text-on-surface-variant hover:text-accent transition-colors" href="#">Confidentialité</a>
<a class="text-on-surface-variant hover:text-accent transition-colors" href="#">Réalisations</a>
</nav>
</div>
<div class="md:col-span-4 flex flex-col gap-4">
<span class="font-label-lg text-primary uppercase tracking-widest">Contact</span>
<p class="text-on-surface-variant italic">Disponible pour vos projets à ${city} et ses environs.</p>
<div class="h-px bg-outline-variant w-full my-2"></div>
<div class="font-body-md text-sm text-on-surface-variant">
                    © ${year} MAÎTRE ARTISAN. EXCELLENCE &amp; TRADITION.
                </div>
</div>
</div>
</div>
</footer>
</body></html>`;
}
