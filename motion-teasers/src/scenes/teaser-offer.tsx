import { makeScene2D, Layout, Rect, Txt, Img, Circle } from '@motion-canvas/2d';
import {
  createRef,
  waitFor,
  all,
  chain,
  Color,
  easeOutCubic,
  easeOutBack,
  easeInOutCubic,
} from '@motion-canvas/core';

/**
 * Teaser 10s — Offre "Site Web GRATUIT"
 * Format: 1080x1350 (Instagram portrait) — passe en feed + reels + stories
 *
 * Variables injectées au build :
 * - name : nom du prospect
 * - city : ville
 * - type : type de business (restaurant, plombier...)
 *
 * Frames :
 *  0.0-1.5s  Logo WebConceptor + tagline
 *  1.5-3.5s  Prix barré 320€ → APPARITION GRATUIT
 *  3.5-6.0s  "Pour [Nom prospect] à [Ville]"
 *  6.0-8.0s  Bénéfices : 5 jours · hébergement · maintenance
 *  8.0-10s   CTA : "Réservez votre site → 50€/mois"
 */

export default makeScene2D(function* (view) {
  // Récup variables depuis projet
  const name = (view.scene().variables.get<string>('name', 'Votre commerce'))();
  const city = (view.scene().variables.get<string>('city', 'France'))();

  // Fond doré WebConceptor
  view.fill(new Color('#0a0a0a'));

  // Conteneur principal
  const root = createRef<Layout>();
  view.add(
    <Layout ref={root} width={1080} height={1350} layout direction="column" alignItems="center" justifyContent="center" gap={40}>
    </Layout>
  );

  // ── Frame 1 : Logo + tagline ─────────────────────────────────
  const logo = createRef<Txt>();
  const tagline = createRef<Txt>();

  root().add(
    <>
      <Txt ref={logo} text="WebConceptor" fontFamily="Inter" fontSize={88} fontWeight={800} fill="#FFD700" opacity={0} y={-50}/>
      <Txt ref={tagline} text="Votre site web professionnel" fontFamily="Inter" fontSize={36} fontWeight={400} fill="#999" opacity={0}/>
    </>
  );

  yield* all(
    logo().opacity(1, 0.6, easeOutCubic),
    logo().y(0, 0.6, easeOutCubic),
    tagline().opacity(1, 0.8, easeOutCubic),
  );
  yield* waitFor(0.8);
  yield* all(
    logo().opacity(0, 0.4),
    tagline().opacity(0, 0.4),
  );

  // ── Frame 2 : Prix barré → GRATUIT ──────────────────────────
  const oldPriceWrapper = createRef<Layout>();
  const oldPrice = createRef<Txt>();
  const oldPriceCross = createRef<Rect>();
  const newPrice = createRef<Txt>();
  const gratuitLabel = createRef<Txt>();

  root().add(
    <>
      <Layout ref={oldPriceWrapper} layout={false}>
        <Txt ref={oldPrice} text="320€" fontFamily="Inter" fontSize={180} fontWeight={900} fill="#fff" opacity={0}/>
        <Rect ref={oldPriceCross} width={0} height={12} fill="#FF3B30" radius={6} rotation={-12}/>
      </Layout>
      <Txt ref={newPrice} text="0€" fontFamily="Inter" fontSize={220} fontWeight={900} fill="#FFD700" opacity={0} scale={0.5}/>
      <Txt ref={gratuitLabel} text="GRATUIT" fontFamily="Inter" fontSize={64} fontWeight={800} fill="#FFD700" opacity={0} letterSpacing={8}/>
    </>
  );

  yield* oldPrice().opacity(1, 0.4, easeOutCubic);
  yield* waitFor(0.4);
  yield* oldPriceCross().width(360, 0.4, easeOutCubic);
  yield* waitFor(0.3);
  yield* all(
    oldPriceWrapper().opacity(0, 0.4),
    chain(
      waitFor(0.2),
      all(
        newPrice().opacity(1, 0.5, easeOutBack),
        newPrice().scale(1, 0.6, easeOutBack),
      )
    ),
  );
  yield* gratuitLabel().opacity(1, 0.4, easeOutCubic);
  yield* waitFor(1.0);
  yield* all(
    newPrice().opacity(0, 0.4),
    gratuitLabel().opacity(0, 0.4),
  );

  // ── Frame 3 : Personnalisation prospect ──────────────────────
  const pourLabel = createRef<Txt>();
  const prospectName = createRef<Txt>();
  const prospectCity = createRef<Txt>();

  root().add(
    <>
      <Txt ref={pourLabel} text="POUR" fontFamily="Inter" fontSize={48} fontWeight={600} fill="#FFD700" letterSpacing={12} opacity={0}/>
      <Txt ref={prospectName} text={name} fontFamily="Inter" fontSize={100} fontWeight={800} fill="#fff" opacity={0} textAlign="center" maxWidth={1000} textWrap/>
      <Txt ref={prospectCity} text={`à ${city}`} fontFamily="Inter" fontSize={48} fontWeight={400} fill="#999" opacity={0}/>
    </>
  );

  yield* pourLabel().opacity(1, 0.5, easeOutCubic);
  yield* prospectName().opacity(1, 0.7, easeOutCubic);
  yield* prospectCity().opacity(1, 0.6, easeOutCubic);
  yield* waitFor(1.2);
  yield* all(
    pourLabel().opacity(0, 0.4),
    prospectName().opacity(0, 0.4),
    prospectCity().opacity(0, 0.4),
  );

  // ── Frame 4 : Bénéfices ─────────────────────────────────────
  const bencontainer = createRef<Layout>();
  root().add(
    <Layout ref={bencontainer} layout direction="column" gap={32} opacity={0}>
      {['✅ Site livré en 5 jours', '✅ Hébergement & sécurité inclus', '✅ Modifications illimitées', '✅ 50€/mois sans engagement'].map((t, i) => (
        <Txt text={t} fontFamily="Inter" fontSize={52} fontWeight={600} fill="#fff" textAlign="left"/>
      ))}
    </Layout>
  );
  yield* bencontainer().opacity(1, 0.5, easeOutCubic);
  yield* waitFor(2.0);
  yield* bencontainer().opacity(0, 0.4);

  // ── Frame 5 : CTA ───────────────────────────────────────────
  const ctaBg = createRef<Rect>();
  const ctaText = createRef<Txt>();
  const url = createRef<Txt>();

  root().add(
    <>
      <Rect ref={ctaBg} width={0} height={140} fill="#FFD700" radius={16}>
        <Txt ref={ctaText} text="Je veux mon site →" fontFamily="Inter" fontSize={56} fontWeight={800} fill="#0a0a0a" opacity={0}/>
      </Rect>
      <Txt ref={url} text="webconceptor.fr" fontFamily="Inter" fontSize={44} fontWeight={500} fill="#FFD700" opacity={0} marginTop={40}/>
    </>
  );

  yield* ctaBg().width(720, 0.6, easeOutBack);
  yield* ctaText().opacity(1, 0.4);
  yield* url().opacity(1, 0.5);
  yield* waitFor(2.0);
});
