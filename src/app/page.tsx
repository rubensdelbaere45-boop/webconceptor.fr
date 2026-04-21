"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* ══════════════════════════════════════════
   DATA
   ══════════════════════════════════════════ */

const sites = [
  { name: "Proxi", type: "Commerce de proximité", city: "France", img: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=900&q=80&auto=format&fit=crop", url: "/exemples/proxi.html" },
  { name: "Maison Tête", type: "Restaurant", city: "Lyon", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop", url: "/exemples/maison-tete.html" },
  { name: "Studio Lamarre", type: "Architecte", city: "Paris", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80&auto=format&fit=crop", url: "/exemples/studio-lamarre.html" },
  { name: "Domaine Pontevès", type: "Vigneron", city: "Provence", img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=900&q=80&auto=format&fit=crop", url: "/exemples/domaine-ponteves.html" },
  { name: "Clara Nové", type: "Photographe", city: "Bordeaux", img: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=900&q=80&auto=format&fit=crop", url: "/exemples/clara-nove.html" },
  { name: "Cabinet Moreau", type: "Avocat", city: "Paris", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80&auto=format&fit=crop", url: "/exemples/cabinet-moreau.html" },
  { name: "Dr. Lefèvre", type: "Médecin", city: "Marseille", img: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&q=80&auto=format&fit=crop", url: "/exemples/dr-lefevre.html" },
  { name: "L\u2019Atelier Sato", type: "Pâtisserie", city: "Lyon", img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=80&auto=format&fit=crop", url: "/exemples/atelier-sato.html" },
  { name: "Maison Rivière", type: "Hôtel", city: "Nice", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80&auto=format&fit=crop", url: "/exemples/maison-riviere.html" },
];

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Trouvé sur Google",
    desc: "Vos clients vous cherchent en ligne. Soyez là où ils regardent.",
    color: "from-blue-500/10 to-indigo-500/10",
    iconBg: "bg-blue-500 text-white"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: "Crédibilité instantanée",
    desc: "Un site professionnel inspire confiance dès la première visite.",
    color: "from-purple-500/10 to-pink-500/10",
    iconBg: "bg-purple-500 text-white"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Disponible 24h/24",
    desc: "Votre vitrine ne ferme jamais. Même le dimanche à 3h du matin.",
    color: "from-amber-500/10 to-orange-500/10",
    iconBg: "bg-amber-500 text-white"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Plus de clients",
    desc: "Convertissez les visiteurs en rendez-vous, réservations ou appels.",
    color: "from-emerald-500/10 to-teal-500/10",
    iconBg: "bg-emerald-500 text-white"
  },
];

const testimonials = [
  { quote: "Un site qui reflète parfaitement notre identité. Les clients nous disent que ça fait la différence.", author: "Marie T.", role: "Restauratrice, Lyon" },
  { quote: "Rapide, professionnel, à l\u2019écoute. Mon cabinet a triplé sa visibilité en ligne en trois mois.", author: "Pierre M.", role: "Avocat, Paris" },
  { quote: "Je cherchais un site élégant et simple. Le résultat dépasse largement mes attentes.", author: "Sophie L.", role: "Architecte, Bordeaux" },
];

const included = [
  "Design sur-mesure",
  "Responsive mobile",
  "Contenu rédigé",
  "SEO Google",
  "Conformité RGPD",
  "Domaine 1 an",
  "SSL sécurisé",
  "Retours illimités",
];

const sereniteItems = [
  { text: "Mises à jour sur simple email", bold: true },
  { text: "Promos & animations", bold: true },
  { text: "Actualités & horaires", bold: true },
  { text: "Hébergement sécurisé", bold: false },
  { text: "Sauvegardes quotidiennes", bold: false },
  { text: "Support sous 24h", bold: false },
  { text: "Domaine + SSL inclus", bold: false },
  { text: "Maintenance technique", bold: false },
];

const faqs = [
  {
    q: "Combien de temps pour livrer un site ?",
    a: "5 jours ouvrés en moyenne. Dès validation de votre devis, nous concevons la maquette en 48h, puis nous intégrons votre contenu et apportons les ajustements jusqu\u2019à satisfaction complète."
  },
  {
    q: "Que se passe-t-il si je n\u2019aime pas le résultat ?",
    a: "Retours illimités jusqu\u2019à votre satisfaction — c\u2019est inclus dans les 599€. Vous ne payez que quand vous êtes 100% satisfait du rendu final."
  },
  {
    q: "Le site est-il vraiment à moi après paiement ?",
    a: "Oui, 100%. Vous êtes propriétaire du site, du code source, du nom de domaine. Vous pouvez l\u2019héberger où vous voulez, le modifier, le revendre. Nous ne détenons rien."
  },
  {
    q: "Dois-je fournir du contenu ou des photos ?",
    a: "Non, nous nous occupons de la rédaction et pouvons utiliser des photos libres de droit. Si vous avez vos propres contenus, tant mieux. Sinon, nous créons tout."
  },
  {
    q: "C\u2019est quoi la Formule Sérénité ?",
    a: "50€/mois pour des mises à jour illimitées sur simple email : promos, actualités, changements d\u2019horaires, nouvelles photos, bannières événementielles. Vous envoyez un email, on applique dans la journée. Sans engagement, résiliable à tout moment."
  },
  {
    q: "Je peux refondre un site existant ?",
    a: "Oui, c\u2019est même 70% de nos projets. Nous analysons votre site actuel (performance, SEO, design), identifions ce qui fonctionne, et livrons une nouvelle version optimisée — tout en gardant ce qui marche déjà."
  },
  {
    q: "Les paiements sont-ils sécurisés ?",
    a: "Oui. Tous les paiements passent par Stripe, leader mondial du paiement en ligne (Netflix, Shopify, Zoom l\u2019utilisent). Vos données bancaires ne transitent jamais par nos serveurs."
  },
];

/* ══════════════════════════════════════════
   VARIANTS
   ══════════════════════════════════════════ */

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease } } };
const heroWord = { hidden: { opacity: 0, y: 24, filter: "blur(10px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } } };
const stagger = (d = 0.1) => ({ hidden: {}, visible: { transition: { staggerChildren: d, delayChildren: 0.1 } } });
const starPop = { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 15 } } };

/* ══════════════════════════════════════════
   COUNTER COMPONENT
   ══════════════════════════════════════════ */

function Counter({ to, suffix = "", duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(animate);
      else setValue(to);
    };
    requestAnimationFrame(animate);
  }, [isInView, to, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

/* ══════════════════════════════════════════
   FAQ ITEM
   ══════════════════════════════════════════ */

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      className="border-b border-[#eeeeee]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-[12px] font-bold text-[#0066ff] tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[15px] font-semibold text-[#0a0a0a]">{q}</span>
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease }}
          className="w-5 h-5 text-[#a3a3a3] flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease }}
        className="overflow-hidden"
      >
        <p className="text-[14px] text-[#525252] leading-relaxed pl-10 pb-5 pr-4">{a}</p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   PROXI LOGO (inline SVG style)
   ══════════════════════════════════════════ */

function ProxiLogo() {
  return (
    <img
      src="/logos/proxi.png"
      alt="Proxi Aubenton — Client WebConceptor"
      className="h-12 w-auto select-none"
      draggable={false}
    />
  );
}

/* ══════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="bg-white text-[#0a0a0a] min-h-screen">

      {/* ─── NAV ─── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-black/[0.04]"
      >
        <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[13px] text-[#737373]">
            <a href="#realisations" className="hover:text-[#0a0a0a] transition-colors">Réalisations</a>
            <a href="#tarif" className="hover:text-[#0a0a0a] transition-colors">Tarif</a>
            <a href="#faq" className="hover:text-[#0a0a0a] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/code" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors hidden sm:block">
              J&apos;ai un code
            </Link>
            <Link href="/auth/login" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors hidden sm:block">
              Mon espace
            </Link>
            <Link href="/demande" className="px-4 py-1.5 bg-[#0066ff] text-white text-[13px] font-medium rounded-full hover:bg-[#0052cc] transition-colors">
              Créer mon site
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-14">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-purple-50/30 to-white pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/[0.15] to-cyan-400/[0.1] rounded-full blur-3xl pointer-events-none glow-orb" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-purple-400/[0.12] to-pink-400/[0.08] rounded-full blur-3xl pointer-events-none glow-orb" style={{ animationDelay: "3s" }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px), linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e5] rounded-full text-[13px] text-[#525252] mb-10 shadow-sm"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot-anim" />
            <span>Agence française &middot; Disponible</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={stagger(0.08)}
            initial="hidden"
            animate="visible"
            className="text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] mb-8"
          >
            {["Création", "&", "refonte"].map((w) => (
              <motion.span key={w} variants={heroWord} className="inline-block mr-[0.2em]">{w}</motion.span>
            ))}
            <br />
            {["de", "sites"].map((w) => (
              <motion.span key={w} variants={heroWord} className="inline-block mr-[0.2em]">{w}</motion.span>
            ))}
            {["professionnels."].map((w) => (
              <motion.span key={w} variants={heroWord} className="inline-block gradient-text">{w}</motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-[#525252] text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Design premium, livraison en 5 jours. <strong>À partir de 599 € TTC</strong> — <span className="text-[#0066ff] font-semibold">ou 3× sans frais</span>.<br />
            <span className="text-[#a3a3a3] text-base">Hébergement &amp; maintenance en option — 50 €/mois.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/demande" className="px-7 py-3.5 bg-[#0a0a0a] text-white text-[15px] font-medium rounded-full hover:bg-[#262626] transition-colors inline-flex items-center gap-2 shadow-lg shadow-black/10">
                Démarrer mon projet
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </motion.div>
            <a href="#realisations" className="px-7 py-3.5 bg-white border border-[#e5e5e5] text-[#525252] text-[15px] font-medium rounded-full hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all inline-flex items-center justify-center">
              Voir nos réalisations
            </a>
          </motion.div>

          {/* Trust badges — moyens de paiement acceptés */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="flex flex-col items-center gap-3 mb-16"
          >
            <p className="text-[11px] text-[#a3a3a3] uppercase tracking-[0.2em]">Paiement sécurisé</p>
            <div className="flex items-center justify-center gap-5 flex-wrap">
              {/* Logo Klarna — 3x sans frais */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#FFA8CD] rounded-md" title="Paiement en 3 fois sans frais via Klarna">
                <svg viewBox="0 0 452 100" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto" aria-label="Klarna">
                  <path fill="#17120F" d="M80 0H0v100h80V0zm53 0v100h50V0h-50zm128 0v100h50V0h-50zm73 27c-12.7 0-23 10.3-23 23s10.3 23 23 23 23-10.3 23-23-10.3-23-23-23zm85 0c-12.7 0-23 10.3-23 23s10.3 23 23 23 23-10.3 23-23-10.3-23-23-23z"/>
                </svg>
                <span className="text-[11px] font-bold text-[#17120F]">3× sans frais</span>
              </div>
              {/* Logo Stripe */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] rounded-md" title="Paiements sécurisés par Stripe (Netflix, Shopify, Zoom)">
                <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto" aria-label="Stripe">
                  <path fill="#fff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.63l.21 1.05a4.7 4.7 0 0 1 3.26-1.24c2.92 0 5.67 2.63 5.67 7.34 0 5.13-2.72 7.59-5.73 7.59zM40 9.08c-.95 0-1.54.35-1.97.84l.02 6.12c.4.44.98.78 1.95.78 1.54 0 2.57-1.68 2.57-3.9 0-2.14-1.05-3.84-2.57-3.84zM32.57 5.38l-4.13.88v-3.38l4.13-.87v3.37zm0 1.25v13.35h-4.13V6.63h4.13zM22.37 7.15v12.58h-4.1v-12h-2.46l-.01-3.54h2.46c0-1.28.66-3.55 4.45-3.55 1.67 0 2.85.4 3.35.63v3.58c-.52-.23-1.46-.5-2.25-.5-.8 0-1.44.2-1.44 1.1v1.72h3.69v3.54h-3.69zM12.16 8.7c-.87-.2-3.3-.72-3.3 1.19v9.84H4.74V5.57h3.5l.12 1.16c.86-1.57 2.62-1.35 3.8-1.35v3.32zM0 0h4.12v19.73H0V0z"/>
                </svg>
              </div>
              {/* Badge cartes */}
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e5e5e5] rounded-md">
                <svg viewBox="0 0 48 32" className="h-4 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
                  <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                  <path fill="#fff" d="M20.72 21.3l1.88-10.63h3l-1.88 10.63h-3zm13.8-10.36c-.6-.23-1.52-.48-2.68-.48-2.96 0-5.04 1.5-5.06 3.66-.02 1.6 1.5 2.48 2.64 3.02 1.17.54 1.57.9 1.56 1.38-.01.75-.94 1.1-1.8 1.1-1.2 0-1.84-.18-2.82-.6l-.38-.17-.42 2.45c.7.3 1.98.57 3.3.58 3.14 0 5.18-1.48 5.2-3.78.03-1.26-.79-2.22-2.54-3.01-1.06-.52-1.7-.86-1.7-1.38 0-.46.55-.96 1.74-.96 1 0 1.7.2 2.26.42l.27.13.4-2.36zm7.3-.27h-2.3c-.72 0-1.26.2-1.57.93l-4.44 9.7h3.14l.63-1.68h3.84l.36 1.68H44l-2.18-10.63zm-3.67 6.93c.24-.6 1.18-2.98 1.18-2.98-.02.03.25-.62.4-1.02l.2 1 .7 3H38.15zM18.2 10.67l-2.94 7.3-.32-1.46c-.55-1.68-2.28-3.5-4.22-4.4l2.67 8.19h3.18l4.72-9.63H18.2z"/>
                </svg>
                <svg viewBox="0 0 48 32" className="h-4 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
                  <rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e5e5"/>
                  <circle cx="19" cy="16" r="8" fill="#EB001B"/>
                  <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
                  <path fill="#FF5F00" d="M24 10a8 8 0 0 1 0 12 8 8 0 0 1 0-12z"/>
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Animated stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
                <Counter to={50} suffix="+" />
              </p>
              <p className="text-[12px] text-[#a3a3a3] mt-1 uppercase tracking-wider">Sites livrés</p>
            </div>
            <div className="text-center border-x border-[#e5e5e5]">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
                <Counter to={5} />
              </p>
              <p className="text-[12px] text-[#a3a3a3] mt-1 uppercase tracking-wider">Jours de délai</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
                <Counter to={100} suffix="%" />
              </p>
              <p className="text-[12px] text-[#a3a3a3] mt-1 uppercase tracking-wider">Satisfaits</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST BAR (Proxi + clients) ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-y border-[#f5f5f5] bg-white/50 backdrop-blur px-6 py-10"
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-[#a3a3a3] tracking-[0.2em] uppercase mb-8">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <motion.a
              href="https://proxi-aubenton.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="inline-block"
            >
              <ProxiLogo />
            </motion.a>

            {/* Industry categories */}
            {[
              "CABINETS MÉDICAUX",
              "RESTAURATION",
              "ARTISANS BTP",
              "AVOCATS",
              "HÔTELLERIE",
            ].map((cat) => (
              <span
                key={cat}
                className="text-[11px] font-semibold text-[#a3a3a3] tracking-[0.15em] hover:text-[#525252] transition-colors"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-center text-[12px] text-[#a3a3a3] mt-8">
            Commerces de proximité, professions libérales, artisans et entreprises en France.
          </p>
        </div>
      </motion.section>

      {/* ─── POURQUOI UN SITE ─── */}
      <section className="px-6 py-24 bg-gradient-to-b from-white to-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Pourquoi ?</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Un site web, ça change tout.</h2>
            <p className="text-[#737373] mt-4 max-w-md mx-auto">Les 4 raisons pour lesquelles vos concurrents vous prennent des clients.</p>
          </motion.div>

          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className={`rounded-2xl p-7 bg-gradient-to-br ${b.color} border border-white relative overflow-hidden`}
              >
                <div className={`w-11 h-11 rounded-xl ${b.iconBg} flex items-center justify-center mb-5 shadow-sm`}>
                  {b.icon}
                </div>
                <h3 className="text-[16px] font-bold mb-2 tracking-tight">{b.title}</h3>
                <p className="text-[13px] text-[#525252] leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TEMOIGNAGES ─── */}
      <section className="px-6 py-24 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Témoignages</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Ce qu&apos;ils en disent.</h2>
          </motion.div>

          <motion.div
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#f5f5f5] rounded-2xl p-7 shadow-sm"
              >
                <motion.div variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.svg key={i} variants={starPop} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </motion.div>
                <p className="text-[14px] text-[#525252] leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-[13px] font-semibold">{t.author}</p>
                <p className="text-[12px] text-[#a3a3a3]">{t.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── REALISATIONS ─── */}
      <section id="realisations" className="px-4 sm:px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Portfolio</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Nos réalisations</h2>
            <p className="text-[#737373] mt-3">Chaque site est unique. Cliquez pour découvrir.</p>
          </motion.div>

          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {sites.map((site) => (
              <motion.a
                key={site.name}
                variants={fadeUp}
                whileHover={{ scale: 0.985 }}
                transition={{ duration: 0.4, ease }}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e5e5e5]"
              >
                <motion.img
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.7, ease }}
                  src={site.img}
                  alt={site.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white text-lg font-semibold">{site.name}</p>
                  <p className="text-white/60 text-[13px]">{site.type} &middot; {site.city}</p>
                </div>
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-white/80 backdrop-blur text-[9px] font-bold tracking-widest text-[#0a0a0a] rounded">WEBCONCEPTOR</span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TARIF ─── */}
      <section id="tarif" className="px-6 py-24 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-16">
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Tarif</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Un prix clair. Zéro surprise.</h2>
          </motion.div>

          <motion.div variants={stagger(0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="max-w-3xl mx-auto grid md:grid-cols-2 gap-5">
            {/* 599€ */}
            <motion.div variants={scaleIn} whileHover={{ y: -4 }} className="bg-[#0a0a0a] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-[12px] text-white/40 mb-1">À partir de</p>
                <p className="text-5xl font-extrabold tracking-tight mb-1">599 <span className="text-xl font-medium text-white/50">&euro;</span></p>
                <p className="text-[13px] text-white/40 mb-8">Paiement unique &middot; Livraison 5 jours</p>
                <div className="space-y-2.5 mb-8">
                  {included.map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[13px] text-white/70">{i}</span>
                    </div>
                  ))}
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/demande" className="block w-full py-3 bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-full text-center">Démarrer mon projet</Link>
                </motion.div>
                <p className="text-[11px] text-white/20 text-center mt-3">Sans Formule Sérénité, aucune modification après livraison.</p>
              </div>
            </motion.div>

            {/* Sérénité */}
            <motion.div variants={scaleIn} whileHover={{ y: -4, boxShadow: "0 20px 60px -12px rgba(0,102,255,0.15)" }} className="bg-white rounded-2xl border-2 border-[#0066ff] p-8 relative overflow-hidden breathe-border">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/[0.04] rounded-full blur-3xl" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0066ff] text-white text-[11px] font-semibold rounded-full mb-4">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
                  90% des clients
                </span>
                <p className="text-[13px] text-[#0066ff] font-semibold mb-1">Formule Sérénité</p>
                <p className="text-5xl font-extrabold tracking-tight mb-1">50 <span className="text-xl font-medium text-[#a3a3a3]">&euro;<span className="text-[13px]">/mois</span></span></p>
                <p className="text-[13px] text-[#a3a3a3] mb-8">Votre site reste vivant. Un email suffit.</p>
                <div className="space-y-2.5 mb-6">
                  {sereniteItems.map((i) => (
                    <div key={i.text} className="flex items-center gap-2.5">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${i.bold ? "text-[#0066ff]" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className={`text-[13px] ${i.bold ? "text-[#0a0a0a] font-medium" : "text-[#737373]"}`}>{i.text}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#fafafa] rounded-lg p-3 mb-4">
                  <p className="text-[12px] text-[#525252]"><span className="font-semibold text-[#0a0a0a]">&ldquo;Un email et c&apos;est à jour dans la journée.&rdquo;</span><br /><span className="text-[#a3a3a3]">— Marie T., Lyon</span></p>
                </div>
                <p className="text-[11px] text-[#a3a3a3] text-center">Sans engagement</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Questions fréquentes</h2>
            <p className="text-[#737373] mt-3">Tout ce que vous devez savoir avant de démarrer.</p>
          </motion.div>

          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="border-t border-[#eeeeee]"
          >
            {faqs.map((faq, i) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-[14px] text-[#737373] mb-4">Une autre question ?</p>
            <a
              href="mailto:contact@webconceptor.fr"
              className="text-[14px] font-semibold text-[#0066ff] hover:underline"
            >
              contact@webconceptor.fr →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="px-6 py-24 bg-[#fafafa]">
        <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#0066ff] via-[#4f46e5] to-[#7c3aed] rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none float-orb" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none float-orb" style={{ animationDelay: "3s" }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">Prêt à lancer votre site ?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">Décrivez votre projet en 5 minutes. Réponse garantie sous 48h.</p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Link href="/demande" className="px-8 py-4 bg-white text-[#0066ff] text-[15px] font-semibold rounded-full hover:bg-white/90 transition-colors inline-flex items-center gap-2 shadow-xl">
                  Créer mon site gratuitement
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </motion.div>
              <p className="text-white/60 text-[12px] mt-5">Gratuit &middot; Sans engagement &middot; Réponse sous 48h</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#f5f5f5] px-6 py-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 bg-[#0066ff] rounded-lg flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">W</span>
                </span>
                <span className="text-[16px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
              </div>
              <p className="text-[13px] text-[#737373] max-w-xs leading-relaxed">
                Agence française de création et refonte de sites professionnels.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-[13px] text-[#737373]">
              <a href="#realisations" className="hover:text-[#0a0a0a] transition-colors">Réalisations</a>
              <a href="#tarif" className="hover:text-[#0a0a0a] transition-colors">Tarif</a>
              <a href="#faq" className="hover:text-[#0a0a0a] transition-colors">FAQ</a>
              <Link href="/code" className="hover:text-[#0a0a0a] transition-colors">J&apos;ai un code</Link>
              <Link href="/auth/login" className="hover:text-[#0a0a0a] transition-colors">Connexion</Link>
            </div>
          </div>

          <div className="pt-8 border-t border-[#f5f5f5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#a3a3a3]">
              &copy; 2026 WebConceptor &middot; Fait en France
            </p>
            <div className="flex flex-wrap gap-5 text-[12px] text-[#a3a3a3]">
              <Link href="/mentions-legales" className="hover:text-[#0a0a0a] transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-[#0a0a0a] transition-colors">CGU</Link>
              <Link href="/confidentialite" className="hover:text-[#0a0a0a] transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
