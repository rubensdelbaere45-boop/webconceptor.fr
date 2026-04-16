"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/* ══════════════════════════════════════════
   DATA
   ══════════════════════════════════════════ */

const sites = [
  { name: "Maison Tete", type: "RESTAURANT GASTRONOMIQUE", city: "Lyon", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop", url: "/exemples/maison-tete.html" },
  { name: "Studio Lamarre", type: "ARCHITECTE D'INTERIEUR", city: "Paris", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80&auto=format&fit=crop", url: "/exemples/studio-lamarre.html" },
  { name: "Domaine Ponteves", type: "DOMAINE VITICOLE", city: "Provence", img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=900&q=80&auto=format&fit=crop", url: "/exemples/domaine-ponteves.html" },
  { name: "Clara Nove", type: "PHOTOGRAPHE", city: "Bordeaux", img: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=900&q=80&auto=format&fit=crop", url: "/exemples/clara-nove.html" },
  { name: "Cabinet Moreau", type: "AVOCAT", city: "Paris", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80&auto=format&fit=crop", url: "/exemples/cabinet-moreau.html" },
  { name: "Dr. Lefevre", type: "CABINET MEDICAL", city: "Marseille", img: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&q=80&auto=format&fit=crop", url: "/exemples/dr-lefevre.html" },
  { name: "L'Atelier Sato", type: "PATISSERIE JAPONAISE", city: "Lyon", img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=80&auto=format&fit=crop", url: "/exemples/atelier-sato.html" },
  { name: "Maison Riviere", type: "HOTEL BOUTIQUE", city: "Nice", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80&auto=format&fit=crop", url: "/exemples/maison-riviere.html" },
];

const steps = [
  { n: "01", title: "Vous decrivez", desc: "Un formulaire intelligent pose les bonnes questions sur votre activite, vos clients et vos objectifs.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> },
  { n: "02", title: "Nous concevons", desc: "Design sur-mesure, contenu optimise, SEO local, conformite RGPD. Tout est inclus.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
  { n: "03", title: "Vous validez", desc: "Votre site est pret en 5 jours. Retours illimites, puis mise en ligne sur votre domaine.", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg> },
];

const stats = [
  { value: "50+", label: "Sites livres" },
  { value: "5j", label: "Delai moyen" },
  { value: "100%", label: "Clients satisfaits" },
  { value: "24/7", label: "Support inclus" },
];

const included = [
  "Design sur-mesure unique",
  "Site responsive mobile",
  "Contenu redige pour vous",
  "SEO optimise (Google)",
  "Conformite RGPD",
  "Nom de domaine 1 an",
  "Certificat SSL securise",
  "Retours illimites",
];

const sereniteItems = [
  { text: "Mises a jour du contenu sur simple email", highlight: true },
  { text: "Promos, actualites, changements d'horaires", highlight: true },
  { text: "Bannieres et animations promotionnelles", highlight: true },
  { text: "Hebergement rapide et securise", highlight: false },
  { text: "Sauvegardes automatiques quotidiennes", highlight: false },
  { text: "Support prioritaire sous 24h", highlight: false },
  { text: "Renouvellement domaine + SSL inclus", highlight: false },
  { text: "Maintenance technique & securite", highlight: false },
];

const testimonials = [
  { quote: "Un site qui reflete parfaitement notre identite. Les clients nous disent que ca fait la difference.", author: "Marie T.", role: "Restauratrice, Lyon" },
  { quote: "Rapide, professionnel, a l'ecoute. Mon cabinet a triple sa visibilite en ligne en trois mois.", author: "Pierre M.", role: "Avocat, Paris" },
  { quote: "Je cherchais un site elegant et simple. Le resultat depasse largement mes attentes.", author: "Sophie L.", role: "Architecte, Bordeaux" },
];

/* ══════════════════════════════════════════
   FRAMER MOTION VARIANTS
   ══════════════════════════════════════════ */

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease } },
};

const heroWord = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
};

const stagger = (delay = 0.1, childDelay = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: childDelay } },
});

const starPop = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
};

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="bg-white text-[#0a0a0a] min-h-screen">

      {/* ─── NAV ─── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8, ease }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-black/[0.04]"
      >
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-[#0066ff] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Web<span className="text-[#0066ff]">Conceptor</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-[#737373]">
            <a href="#realisations" className="hover:text-[#0a0a0a] transition-colors">Realisations</a>
            <a href="#methode" className="hover:text-[#0a0a0a] transition-colors">Methode</a>
            <a href="#tarif" className="hover:text-[#0a0a0a] transition-colors">Tarif</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/dashboard/enter-code" className="px-4 py-2 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full hover:bg-[#262626] transition-all btn-shine">
              Entrer un code
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-blue-500/[0.05] via-purple-500/[0.04] to-blue-500/[0.05] rounded-full blur-3xl pointer-events-none glow-orb" />

        {/* Particles */}
        {[12, 28, 45, 62, 78, 90].map((left, i) => (
          <div key={i} className="particle" style={{ left: `${left}%`, animationDelay: `${i * 2}s` }} />
        ))}

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-full text-[13px] text-[#525252] mb-10"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot-anim" />
            Disponible — Livraison en 5 jours
          </motion.div>

          {/* Headline word-by-word */}
          <motion.h1
            variants={stagger(0.1, 0.15)}
            initial="hidden"
            animate="visible"
            className="text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em] mb-8"
          >
            {["Des", "sites", "web", "qui"].map((word) => (
              <motion.span key={word} variants={heroWord} className="inline-block mr-[0.25em]">
                {word}
              </motion.span>
            ))}
            <br />
            {["inspirent", "confiance."].map((word) => (
              <motion.span key={word} variants={heroWord} className="inline-block mr-[0.25em] gradient-text">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease }}
            className="text-lg sm:text-xl text-[#737373] max-w-xl mx-auto mb-12 leading-relaxed"
          >
            WebConceptor cree des sites professionnels sur-mesure
            pour les cabinets, restaurants et entreprises francaises.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link href="/dashboard/enter-code" className="group px-7 py-3.5 bg-[#0a0a0a] text-white text-[15px] font-medium rounded-full hover:bg-[#262626] transition-colors btn-shine flex items-center justify-center gap-2">
                Creer mon site
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </motion.div>
            <a href="#realisations" className="px-7 py-3.5 border border-[#e5e5e5] text-[#525252] text-[15px] font-medium rounded-full hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all flex items-center justify-center">
              Voir nos realisations
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-[#e5e5e5] flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2.5 bg-[#a3a3a3] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-y border-[#f5f5f5] bg-[#fafafa]">
        <motion.div
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-[#e5e5e5]"
        >
          {stats.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center px-6">
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tighter stat-number text-[#0a0a0a]">{s.value}</p>
              <p className="text-[13px] text-[#737373] mt-2 tracking-wide uppercase">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── REALISATIONS ─── */}
      <section id="realisations" className="py-28 sm:py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-20"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-4">Portfolio</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#0a0a0a]">Nos realisations</h2>
            <p className="text-lg text-[#737373] mt-5 max-w-lg mx-auto">Chaque site est une creation unique. Cliquez pour decouvrir.</p>
          </motion.div>

          <motion.div
            variants={stagger(0.1, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="grid sm:grid-cols-2 gap-5"
          >
            {sites.map((site) => (
              <motion.a
                key={site.name}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: "0 25px 60px -12px rgba(0,0,0,0.12)" }}
                transition={{ duration: 0.4, ease }}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl overflow-hidden border border-[#f5f5f5] bg-white"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f5f5]">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease }}
                    src={site.img}
                    alt={site.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold tracking-widest text-[#0a0a0a] rounded-md">WEBCONCEPTOR</span>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                    <span className="px-4 py-2 bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-full">Voir le site</span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[15px] text-[#0a0a0a] tracking-tight">{site.name}</p>
                    <p className="text-[11px] text-[#a3a3a3] tracking-[0.08em] mt-1 uppercase">{site.type} &middot; {site.city}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center group-hover:border-[#0a0a0a] group-hover:bg-[#0a0a0a] transition-all duration-300">
                    <svg className="w-3.5 h-3.5 text-[#a3a3a3] group-hover:text-white transition-colors -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── METHODE ─── */}
      <section id="methode" className="py-28 sm:py-36 px-6 bg-[#fafafa] border-y border-[#f5f5f5]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-20"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-4">Methode</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#0a0a0a]">Trois etapes. C&apos;est tout.</h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease }}
              viewport={{ once: true }}
              className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px bg-[#e5e5e5] origin-left"
            />

            <motion.div
              variants={stagger(0.15, 0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {steps.map((step) => (
                <motion.div
                  key={step.n}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border border-[#f5f5f5] p-8 sm:p-10 hover:border-[#e5e5e5] transition-colors"
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-[#0066ff] mb-6"
                  >
                    {step.icon}
                  </motion.div>
                  <p className="text-[13px] font-bold text-[#0066ff] tracking-widest mb-3">{step.n}</p>
                  <h3 className="text-xl font-bold tracking-tight mb-3 text-[#0a0a0a]">{step.title}</h3>
                  <p className="text-[15px] text-[#737373] leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TARIF ─── */}
      <section id="tarif" className="py-28 sm:py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-4">Tarif</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#0a0a0a]">Un prix clair. Zero surprise.</h2>
            <p className="text-lg text-[#737373] mt-5 max-w-lg mx-auto">Tout est inclus dans un tarif unique. Pas de frais caches, pas d&apos;abonnement obligatoire.</p>
          </motion.div>

          <motion.div
            variants={stagger(0.15, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {/* Card 599€ */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative bg-[#0a0a0a] rounded-2xl p-8 sm:p-10 text-white overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[12px] font-semibold text-white/80 mb-6">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                  Le plus populaire
                </div>
                <p className="text-[14px] text-white/50 font-medium mb-2">Votre site professionnel</p>
                <p className="text-[13px] text-white/40 mb-1">a partir de</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">599</span>
                  <span className="text-xl font-semibold text-white/60">&euro;</span>
                </div>
                <p className="text-[14px] text-white/50 mb-8 leading-relaxed">Paiement unique. Le site est a vous, pour toujours. Livraison en 5 jours.</p>

                <motion.div variants={stagger(0.04, 0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                  {included.map((item) => (
                    <motion.div key={item} variants={fadeUp} className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[14px] text-white/80">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/dashboard/enter-code" className="block w-full py-3.5 bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-full text-center hover:bg-[#f5f5f5] transition-colors">
                    Commencer mon site
                  </Link>
                </motion.div>
                <p className="text-[12px] text-white/30 text-center mt-4">Sans Formule Serenite, le site reste tel quel apres livraison.</p>
              </div>
            </motion.div>

            {/* Card Serenite 50€/mois */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -4, boxShadow: "0 20px 60px -12px rgba(0,102,255,0.15)" }}
              transition={{ duration: 0.3 }}
              className="relative bg-white rounded-2xl border-2 border-[#0066ff] p-8 sm:p-10 flex flex-col overflow-hidden breathe-border"
            >
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/[0.06] rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0066ff] rounded-full text-[12px] font-semibold text-white mb-6 self-start">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
                  Recommande &middot; 90% des clients
                </div>
                <p className="text-[14px] text-[#0066ff] font-semibold mb-2">Formule Serenite</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#0a0a0a]">50</span>
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold text-[#a3a3a3]">&euro;</span>
                    <span className="text-[12px] text-[#a3a3a3] -mt-1">/ mois</span>
                  </div>
                </div>
                <p className="text-[14px] text-[#525252] mb-8 leading-relaxed">
                  Votre site reste <strong className="text-[#0a0a0a]">vivant et a jour</strong>. Un email suffit pour modifier quoi que ce soit.
                </p>

                <motion.div variants={stagger(0.04, 0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3.5 mb-8 flex-1">
                  {sereniteItems.map((item) => (
                    <motion.div key={item.text} variants={fadeUp} className="flex items-center gap-3">
                      <svg className={`w-4 h-4 flex-shrink-0 ${item.highlight ? "text-[#0066ff]" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className={`text-[14px] ${item.highlight ? "text-[#0a0a0a] font-medium" : "text-[#525252]"}`}>{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-[#fafafa] border border-[#f5f5f5] rounded-xl p-4 mb-6">
                  <p className="text-[13px] text-[#525252] leading-relaxed">
                    <span className="font-semibold text-[#0a0a0a]">&ldquo;Je leur envoie un email et le site est a jour dans la journee.&rdquo;</span>
                    <br />
                    <span className="text-[12px] text-[#a3a3a3] mt-1 inline-block">— Marie T., restauratrice a Lyon</span>
                  </p>
                </motion.div>

                <p className="text-[13px] text-[#a3a3a3] text-center">Sans engagement &middot; Resiliable a tout moment</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 text-center text-[14px] text-[#a3a3a3]"
          >
            Tarif indicatif. Chaque projet est unique — contactez-nous pour un devis personnalise adapte a vos besoins.
          </motion.p>
        </div>
      </section>

      {/* ─── TEMOIGNAGES ─── */}
      <section className="py-20 px-6 bg-[#fafafa] border-y border-[#f5f5f5]">
        <motion.div
          variants={stagger(0.12, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.author}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#f5f5f5] rounded-2xl p-8"
            >
              <motion.div
                variants={stagger(0.06, 0)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex gap-1 mb-5"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.svg key={i} variants={starPop} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
              </motion.div>
              <p className="text-[15px] text-[#525252] leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-[14px] font-semibold text-[#0a0a0a]">{t.author}</p>
                <p className="text-[12px] text-[#a3a3a3] mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-28 sm:py-36 px-6">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative bg-[#0a0a0a] rounded-3xl p-12 sm:p-20 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none float-orb" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none float-orb" style={{ animationDelay: "3s" }} />
            <div className="relative z-10">
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5"
              >
                Pret a lancer votre site ?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-[#a3a3a3] text-lg mb-10 max-w-md mx-auto"
              >
                Contactez-nous ou entrez votre code projet pour demarrer.
              </motion.p>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/dashboard/enter-code" className="group px-7 py-3.5 bg-white text-[#0a0a0a] text-[15px] font-semibold rounded-full hover:bg-[#f5f5f5] transition-colors flex items-center justify-center gap-2">
                    Creer mon site
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </Link>
                </motion.div>
                <Link href="/auth/register" className="px-7 py-3.5 border border-white/20 text-white text-[15px] font-medium rounded-full hover:border-white/50 transition-all flex items-center justify-center">
                  Creer un compte
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="border-t border-[#f5f5f5] bg-white"
      >
        <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#0066ff] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </span>
                <span className="text-[15px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
              </Link>
              <p className="text-[13px] text-[#a3a3a3] mt-3">Sites web professionnels pour les entreprises francaises.</p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8 text-[13px] text-[#737373]">
              <a href="#realisations" className="hover:text-[#0a0a0a] transition-colors">Realisations</a>
              <a href="#methode" className="hover:text-[#0a0a0a] transition-colors">Methode</a>
              <Link href="/auth/login" className="hover:text-[#0a0a0a] transition-colors">Connexion</Link>
              <Link href="/dashboard/enter-code" className="hover:text-[#0a0a0a] transition-colors">Code projet</Link>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-[#f5f5f5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#a3a3a3]">&copy; 2026 WebConceptor &middot; webconceptor.fr</p>
            <p className="text-[12px] text-[#a3a3a3]">Fait avec soin en France</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
