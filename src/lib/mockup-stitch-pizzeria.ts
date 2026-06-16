/* ══════════════════════════════════════════
   MOCKUP STITCH — PUPAZZO PIZZERIA (artisanale + 3D Three.js)

   Template pixel-pixel adapté du design Stitch "Pupazzo Pizzeria
   - Artisanal & Authentic" :
   - Hero pleine page avec image bg + animation 3D pizza Three.js
   - Section "Notre Histoire" (Tradition & Passion)
   - Section "Notre Pizzeria" (adresse, tél, horaires)
   - Footer Material 3 sobre

   Palette : rouge profond #790703 (primary), beige clair #fcf9f8 (surface),
   typo EB Garamond pour les titres, Plus Jakarta Sans pour le corps.

   Usage : generateStitchPizzeriaMockupHtml(prospect) → HTML complet,
   appelé par /api/prospect/send quand business_type === "pizzeria".
   ══════════════════════════════════════════ */

import { resolveHeroPhoto, resolveSecondaryPhotos } from "@/lib/photo-resolver";

export interface PizzeriaProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website_photos?: string[] | null;
  reviews?: Array<{ author?: string; text?: string; rating?: number }> | null;
}

function escape(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function generateStitchPizzeriaMockupHtml(p: PizzeriaProspect): string {
  const name = escape(p.name).toUpperCase();
  const city = escape(p.city || "");
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const email = escape(p.email || "");
  const heroPhoto = resolveHeroPhoto(p.website_photos || null, "pizzeria");
  const secondaryPhotos = resolveSecondaryPhotos(p.website_photos || null, "pizzeria", 4, p.slug);
  const photo2 = secondaryPhotos[0] || heroPhoto;
  const photo3 = secondaryPhotos[1] || heroPhoto;

  // Adresse complète pour navigation
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : Klyora Sites
  https://klyora.fr
  Maquette personnalisée pour ${escape(p.name)}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex,noarchive">
<meta name="author" content="Klyora Sites — https://klyora.fr">
<title>${escape(p.name)} — Pizzeria artisanale${city ? ` à ${escape(p.city || "")}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface": "#fcf9f8",
          "surface-dim": "#dcd9d9",
          "surface-bright": "#fcf9f8",
          "surface-container-low": "#f6f3f2",
          "surface-container": "#f0eded",
          "surface-container-high": "#eae7e7",
          "surface-container-highest": "#e4e2e1",
          "on-surface": "#1b1c1c",
          "on-surface-variant": "#59413d",
          "outline": "#8d716c",
          "outline-variant": "#e0bfba",
          "primary": "#790703",
          "on-primary": "#ffffff",
          "primary-container": "#9b2317",
          "on-primary-container": "#ffb1a4",
          "secondary": "#5a6333",
          "on-secondary": "#ffffff",
          "secondary-container": "#dbe5a9",
          "secondary-fixed": "#dee8ac",
          "secondary-fixed-dim": "#c2cc92",
          "tertiary": "#3b3a34",
          "on-tertiary": "#ffffff",
          "tertiary-container": "#53514b",
          "on-tertiary-container": "#c7c4bc",
          "background": "#fcf9f8",
          "on-background": "#1b1c1c",
          "primary-fixed-dim": "#ffb4a8",
        },
        fontFamily: {
          "display": ["EB Garamond", "serif"],
          "body": ["Plus Jakarta Sans", "sans-serif"],
        },
        fontSize: {
          "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
          "headline-lg": ["48px", { lineHeight: "1.2" }],
          "headline-lg-mobile": ["32px", { lineHeight: "1.2" }],
          "headline-md": ["32px", { lineHeight: "1.3" }],
          "headline-sm": ["24px", { lineHeight: "1.4" }],
          "body-lg": ["18px", { lineHeight: "1.6" }],
          "body-md": ["16px", { lineHeight: "1.6" }],
          "label-lg": ["14px", { lineHeight: "1.4", letterSpacing: "0.05em" }],
          "label-sm": ["11px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
        },
        maxWidth: { "container-max": "1200px" },
        padding: { "margin-mobile": "1.5rem", "margin-desktop": "4rem" },
      },
    },
  };
</script>
<style>
  body { font-family: "Plus Jakarta Sans", sans-serif; }
  .font-display { font-family: "EB Garamond", serif; }
  .font-display-lg { font-family: "EB Garamond", serif; font-size: 64px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 600; }
  .font-headline-lg { font-family: "EB Garamond", serif; font-weight: 500; }
  .font-headline-md { font-family: "EB Garamond", serif; font-weight: 500; }
  .font-headline-sm { font-family: "EB Garamond", serif; font-weight: 600; }
  .font-body-lg, .font-body-md, .font-label-lg, .font-label-sm { font-family: "Plus Jakarta Sans", sans-serif; }
  .opacity-0-init { opacity: 0; }
  .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(40px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animation-delay-100 { animation-delay: 0.1s; }
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-300 { animation-delay: 0.3s; }
  .texture-overlay {
    pointer-events: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.045 0'/></filter><rect width='80' height='80' filter='url(%23n)'/></svg>");
    opacity: 0.4;
  }
</style>
</head>
<body class="bg-background text-on-background antialiased relative min-h-screen flex flex-col">
<div class="texture-overlay fixed inset-0 z-50"></div>

<!-- Nav -->
<nav class="bg-surface/95 w-full top-0 sticky z-40 border-b border-outline-variant/30 backdrop-blur-sm transition-all duration-300">
  <div class="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4">
    <div class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight hover:scale-105 transition-transform duration-300 cursor-pointer">
      ${name}
    </div>
    <div class="hidden md:flex space-x-8 items-center">
      <a class="text-on-surface-variant font-label-lg hover:text-primary hover:-translate-y-0.5 transition-all duration-300" href="#our-story">NOTRE HISTOIRE</a>
      <a class="text-on-surface-variant font-label-lg hover:text-primary hover:-translate-y-0.5 transition-all duration-300" href="#location">VENIR</a>
      ${phone ? `<a class="text-on-surface-variant font-label-lg hover:text-primary hover:-translate-y-0.5 transition-all duration-300" href="tel:${phone.replace(/\s/g, "")}">${phone}</a>` : ""}
    </div>
    ${phone ? `<a href="tel:${phone.replace(/\s/g, "")}" class="bg-primary text-on-primary font-label-lg px-6 py-3 rounded hover:bg-primary-container hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 hidden md:block">RÉSERVER</a>` : ""}
  </div>
</nav>

<main class="flex-grow">
<!-- Hero -->
<section class="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0 bg-black/60 z-10"></div>
  <img alt="${escape(p.name)} Hero" class="absolute inset-0 w-full h-full object-cover opacity-50" src="${heroPhoto}"/>
  <div class="absolute inset-0 z-15 flex items-center justify-center opacity-80 mix-blend-screen pointer-events-none" id="hero-3d-container"></div>
  <div class="relative z-20 text-center px-margin-mobile max-w-container-max mx-auto flex flex-col items-center">
    <h1 class="font-display-lg text-[40px] md:text-display-lg text-white mb-4 drop-shadow-2xl text-center opacity-0-init animate-fade-in-up animation-delay-100">
      ${name}
    </h1>
    <p class="font-headline-md text-[20px] md:text-headline-md text-surface-container-low mb-8 max-w-2xl text-center opacity-0-init animate-fade-in-up animation-delay-200">
      Pizzas artisanales${city ? ` à ${escape(p.city || "")}` : ""}
    </p>
    <a class="bg-primary text-on-primary font-label-lg px-8 py-4 rounded hover:bg-primary-container hover:scale-105 hover:shadow-xl transition-all duration-300 border border-outline/20 backdrop-blur-sm opacity-0-init animate-fade-in-up animation-delay-300" href="#location">
      VOIR LA PIZZERIA
    </a>
  </div>
</section>

<!-- Our Story -->
<section class="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low overflow-hidden" id="our-story">
  <div class="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
    <div class="space-y-6 reveal-on-scroll">
      <span class="font-label-lg text-label-lg text-secondary tracking-widest uppercase inline-block animate-pulse">Tradition &amp; Passion</span>
      <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">L'Art de la Pizza Artisanale</h2>
      <p class="font-body-lg text-body-lg text-on-surface-variant">
        Chez ${escape(p.name)}, chaque pâte est pétrie avec soin, reposée longuement pour une légèreté incomparable, et cuite à feu vif pour capturer toute l'essence de la tradition italienne.
      </p>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Ingrédients de première qualité sélectionnés personnellement — des tomates San Marzano vibrantes à la mozzarella la plus fraîche — pour une expérience authentique et mémorable à chaque bouchée.
      </p>
    </div>
    <div class="relative h-[500px] w-full rounded-xl overflow-hidden border border-outline-variant/30 shadow-lg reveal-on-scroll animation-delay-200 group">
      <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out" alt="Pizza ${escape(p.name)}" src="${photo2}"/>
    </div>
  </div>
</section>

<!-- Location -->
<section class="py-24 px-margin-mobile md:px-margin-desktop bg-surface" id="location">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16 reveal-on-scroll">
      <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">Notre Pizzeria</h2>
      <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
        Venez goûter, sur place ou à emporter.
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
      <div class="group bg-surface-container rounded-xl overflow-hidden border border-outline-variant/50 hover:border-outline hover:shadow-2xl transition-all duration-500 flex flex-col hover:-translate-y-2 reveal-on-scroll animation-delay-100">
        <div class="relative h-64 w-full overflow-hidden">
          <img alt="${escape(p.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" src="${photo3}"/>
          <div class="absolute top-4 left-4 bg-surface/90 backdrop-blur px-3 py-1 rounded font-label-sm text-label-sm text-on-surface border border-outline-variant/30">
            SUR PLACE &amp; À EMPORTER
          </div>
        </div>
        <div class="p-8 flex-grow flex flex-col justify-between">
          <div>
            <h3 class="font-headline-md text-headline-md text-on-surface mb-2 group-hover:text-primary transition-colors duration-300">${name}</h3>
            ${city ? `<p class="font-label-lg text-label-lg text-secondary mb-6 tracking-wide">${escape((p.city || "").toUpperCase())}</p>` : ""}
            <div class="space-y-4 mb-8">
              ${address ? `<div class="flex items-start space-x-3 text-on-surface-variant"><span class="material-symbols-outlined text-outline mt-1">location_on</span><span class="font-body-md text-body-md">${address}${city ? `<br/>${city}` : ""}</span></div>` : ""}
              ${phone ? `<div class="flex items-center space-x-3 text-on-surface-variant"><span class="material-symbols-outlined text-outline">call</span><a href="tel:${phone.replace(/\s/g, "")}" class="font-body-md text-body-md hover:text-primary">${phone}</a></div>` : ""}
              ${email ? `<div class="flex items-center space-x-3 text-on-surface-variant"><span class="material-symbols-outlined text-outline">mail</span><a href="mailto:${email}" class="font-body-md text-body-md hover:text-primary">${email}</a></div>` : ""}
            </div>
          </div>
          ${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="w-full block text-center py-3 bg-primary text-on-primary font-label-lg rounded hover:bg-primary-container hover:shadow-lg hover:scale-[1.02] transition-all duration-300">M'Y RENDRE</a>` : ""}
        </div>
      </div>
    </div>
  </div>
</section>
</main>

<!-- Footer -->
<footer class="bg-tertiary w-full border-t border-outline-variant/10">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
    <div class="space-y-6 reveal-on-scroll">
      <div class="font-headline-md text-headline-md text-on-tertiary">${name}</div>
      <div class="text-on-tertiary/80 font-body-md text-body-md space-y-2">
        ${phone ? `<p>${phone}</p>` : ""}
        ${email ? `<p>${email}</p>` : ""}
        ${address ? `<p>${address}${city ? `, ${city}` : ""}</p>` : ""}
      </div>
    </div>
    <div class="flex flex-col space-y-4 md:items-center reveal-on-scroll animation-delay-100">
      <h4 class="font-label-lg text-label-lg text-secondary-fixed mb-2">NAVIGATION</h4>
      <a class="text-on-tertiary/80 font-label-sm text-label-sm hover:text-secondary-fixed-dim transition-all" href="#our-story">NOTRE HISTOIRE</a>
      <a class="text-on-tertiary/80 font-label-sm text-label-sm hover:text-secondary-fixed-dim transition-all" href="#location">VENIR</a>
    </div>
    <div class="flex items-end justify-start md:justify-end reveal-on-scroll animation-delay-200">
      <p class="font-label-sm text-label-sm text-on-tertiary/60 uppercase tracking-widest max-w-[260px] md:text-right">
        © 2026 ${name} · Site Klyora Sites · Artisanal &amp; Authentique
      </p>
    </div>
  </div>
</footer>

<script>
  // Scroll reveal
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0-init');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      el.classList.add('opacity-0-init');
      observer.observe(el);
    });
  });

  // 3D Pizza scene
  const container = document.getElementById('hero-3d-container');
  if (container && typeof THREE !== 'undefined') {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const l1 = new THREE.PointLight(0xffffff, 1); l1.position.set(5,5,5); scene.add(l1);
    const l2 = new THREE.PointLight(0xffccaa, 0.5); l2.position.set(-5,-2,2); scene.add(l2);

    const pizza = new THREE.Group();
    const crust = new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 16, 100), new THREE.MeshStandardMaterial({ color: 0xcc8e35, roughness: 0.8, metalness: 0.1 }));
    crust.rotation.x = Math.PI / 2; pizza.add(crust);
    const cheese = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0xffe66d, roughness: 0.4 }));
    pizza.add(cheese);
    const basilMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const basilGeo = new THREE.CircleGeometry(0.2, 32);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(basilGeo, basilMat);
      const a = (i / 6) * Math.PI * 2;
      b.position.set(Math.cos(a) * 1.2, 0.06, Math.sin(a) * 1.2);
      b.rotation.x = -Math.PI / 2; pizza.add(b);
    }
    const tomMat = new THREE.MeshStandardMaterial({ color: 0x9b2317 });
    const tomGeo = new THREE.CircleGeometry(0.3, 32);
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(tomGeo, tomMat);
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      t.position.set(Math.cos(a) * 0.6, 0.07, Math.sin(a) * 0.6);
      t.rotation.x = -Math.PI / 2; pizza.add(t);
    }
    pizza.scale.set(1.5, 1.5, 1.5); pizza.position.set(1, -1, -2); scene.add(pizza);
    camera.position.z = 5; camera.position.y = 1; camera.lookAt(0, 0, 0);
    function animate() {
      requestAnimationFrame(animate);
      pizza.rotation.y += 0.005;
      pizza.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
      renderer.render(scene, camera);
    }
    window.addEventListener('resize', () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    animate();
  }
</script>
</body>
</html>`;
}
