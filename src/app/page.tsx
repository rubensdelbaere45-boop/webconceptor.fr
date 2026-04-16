"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/* ── Data ── */
const sites = [
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
  { icon: "🔍", title: "Trouvé sur Google", desc: "Vos clients vous cherchent en ligne. Soyez là où ils regardent.", color: "from-blue-500/10 to-indigo-500/10" },
  { icon: "✨", title: "Crédibilité instantanée", desc: "Un site professionnel inspire confiance dès la première visite.", color: "from-purple-500/10 to-pink-500/10" },
  { icon: "🕐", title: "Disponible 24h/24", desc: "Votre vitrine ne ferme jamais. Même le dimanche à 3h du matin.", color: "from-amber-500/10 to-orange-500/10" },
  { icon: "📈", title: "Plus de clients", desc: "Convertissez les visiteurs en rendez-vous, réservations ou appels.", color: "from-emerald-500/10 to-teal-500/10" },
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

/* ── Variants ── */
const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease } } };
const heroWord = { hidden: { opacity: 0, y: 24, filter: "blur(10px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } } };
const stagger = (d = 0.1) => ({ hidden: {}, visible: { transition: { staggerChildren: d, delayChildren: 0.1 } } });
const starPop = { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 15 } } };

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
          <div className="flex items-center gap-4">
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
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/[0.08] to-purple-400/[0.08] rounded-full blur-3xl pointer-events-none glow-orb" />

        <div className="relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e5] rounded-full text-[13px] text-[#525252] mb-10 shadow-sm"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot-anim" />
            50+ sites livrés en France
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={stagger(0.08)}
            initial="hidden"
            animate="visible"
            className="text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] max-w-3xl mb-8"
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
            className="text-[#737373] text-lg max-w-md mx-auto mb-10 leading-relaxed"
          >
            Création de sites sur-mesure ou refonte de votre site existant. Design premium, livraison en 5 jours.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/demande" className="px-7 py-3.5 bg-[#0066ff] text-white text-[15px] font-medium rounded-full hover:bg-[#0052cc] transition-colors inline-flex items-center gap-2">
                Créer mon site
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </motion.div>
            <a href="#realisations" className="px-7 py-3.5 border border-[#e5e5e5] text-[#525252] text-[15px] font-medium rounded-full hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all inline-flex items-center justify-center">
              Voir nos réalisations
            </a>
          </motion.div>

          {/* Stats inline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex items-center justify-center gap-8 mt-16 text-[13px] text-[#a3a3a3]"
          >
            <span><strong className="text-[#0a0a0a] text-[15px]">50+</strong> sites livrés</span>
            <span className="w-px h-4 bg-[#e5e5e5]" />
            <span><strong className="text-[#0a0a0a] text-[15px]">5 jours</strong> de délai</span>
            <span className="w-px h-4 bg-[#e5e5e5] hidden sm:block" />
            <span className="hidden sm:inline"><strong className="text-[#0a0a0a] text-[15px]">100%</strong> satisfaits</span>
          </motion.div>
        </div>
      </section>

      {/* ─── POURQUOI UN SITE ? ─── */}
      <section className="px-6 py-24 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Pourquoi ?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Un site web, ça change tout.</h2>
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
                whileHover={{ y: -4 }}
                className={`rounded-2xl p-6 bg-gradient-to-br ${b.color} border border-white/60`}
              >
                <span className="text-3xl block mb-4">{b.icon}</span>
                <h3 className="text-[15px] font-bold mb-2">{b.title}</h3>
                <p className="text-[13px] text-[#525252] leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TEMOIGNAGES ─── */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Témoignages</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ils nous font confiance.</h2>
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
                className="bg-[#fafafa] border border-[#f5f5f5] rounded-2xl p-7"
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
      <section id="realisations" className="px-4 sm:px-6 py-24 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Portfolio</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nos réalisations</h2>
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
      <section id="tarif" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center mb-16">
            <p className="text-[13px] font-semibold text-[#0066ff] tracking-widest uppercase mb-3">Tarif</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Un prix clair. Zéro surprise.</h2>
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
                  <Link href="/demande" className="block w-full py-3 bg-white text-[#0a0a0a] text-[13px] font-semibold rounded-full text-center">Demander un devis</Link>
                </motion.div>
                <p className="text-[11px] text-white/20 text-center mt-3">Sans Formule Sérénité, aucune modification après livraison.</p>
              </div>
            </motion.div>

            {/* Sérénité */}
            <motion.div variants={scaleIn} whileHover={{ y: -4, boxShadow: "0 20px 60px -12px rgba(0,102,255,0.12)" }} className="bg-white rounded-2xl border-2 border-[#0066ff] p-8 relative overflow-hidden breathe-border">
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

      {/* ─── CTA FINAL ─── */}
      <section className="px-6 py-24">
        <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#0066ff] to-[#4f46e5] rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none float-orb" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Prêt à lancer votre site ?</h2>
              <p className="text-white/70 text-lg mb-8 max-w-sm mx-auto">Décrivez votre projet. Réponse sous 48h.</p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/demande" className="px-8 py-4 bg-white text-[#0066ff] text-[15px] font-semibold rounded-full hover:bg-white/90 transition-colors inline-block">
                  Créer mon site gratuitement
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#f5f5f5] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </span>
            <span className="text-[13px] text-[#a3a3a3]">&copy; 2026 WebConceptor</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[12px] text-[#a3a3a3]">
            <Link href="/mentions-legales" className="hover:text-[#0a0a0a] transition-colors">Mentions légales</Link>
            <Link href="/cgu" className="hover:text-[#0a0a0a] transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-[#0a0a0a] transition-colors">Confidentialité</Link>
            <Link href="/auth/login" className="hover:text-[#0a0a0a] transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
