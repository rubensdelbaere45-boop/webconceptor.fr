# Klyora Director — Kit UI premium pour Next.js 16 + Supabase

5 écrans React TSX **Client Components** + un système de design
inspiré de **Stripe Dashboard × Linear × Mercury**, prêts à être
branchés à votre back Next.js 16 / Supabase / Stripe.

> Pour les détails d'intégration côté Next.js 16 + Supabase + Stripe,
> voir **[INTEGRATION.md](./INTEGRATION.md)**.

---

## Aperçu (1 minute)

- **Sidebar fixe** à gauche (Vue d'ensemble, Mon équipe, Marketplace, Activité, Facturation) + bloc « Tom est là » + compte utilisateur
- **Top bar collant** avec titre contextuel, recherche `⌘K` (décorative), pastille crédits, bouton **Recharger** + notifications
- **Hero KPI** : 3 tuiles (Crédits, Agents actifs, Performance estimée) avec sparklines SVG
- **Section « Votre équipe »** : empty state premium → strip d'agents actifs avec live-dot pulsant
- **Marketplace** : grille bento de 6 agents persona, segmented filter par catégorie
- **Slide-over agent** : header dégradé persona, pitch, métrique hero, deliverables, témoignage, FAQ accordéon
- **Modale de recharge** : 4 packs avec badge bonus + paiement Stripe simulé

---

## Arborescence

```
src/director/
├── index.ts                       ← Point d'entrée unique (re-exports)
├── design-tokens.css              ← Variables CSS (couleurs, type, ombres, motion)
├── director.css                   ← Styles scopés + animations
├── mockData.ts                    ← Données mockées + types TS publics
├── DirectorApp.tsx                ← Orchestrateur statique
├── components/
│   ├── Sidebar.tsx                ← Sidebar fixe (5 sections + Tom + compte)
│   ├── Topbar.tsx                 ← Top bar collant (titre + ⌘K + crédits + recharge)
│   ├── KpiTile.tsx                ← Tuile métrique avec delta + sparkline
│   ├── Sparkline.tsx              ← Mini-courbe SVG zero-dep
│   ├── ActiveAgentChip.tsx        ← Carte compacte agent actif (strip)
│   ├── AgentCard.tsx              ← Carte agent (marketplace, bento)
│   ├── AgentDetailPanel.tsx       ← Slide-over premium
│   ├── AgentAvatar.tsx            ← Avatar initiales dégradé
│   ├── CreditOrb.tsx              ← Pastille crédits (navy)
│   ├── Toast.tsx                  ← Pile de toasts (success/error/info)
│   └── DevNav.tsx                 ← Sélecteur d'écran (dev only)
└── screens/
    ├── LoginScreen.tsx            ← Split-screen + panneau visuel premium
    ├── ChangePasswordScreen.tsx   ← Carte centrée + 4 règles live
    ├── WelcomeScreen.tsx          ← Diagnostic + 3 douleurs
    ├── DashboardScreen.tsx        ← Console complète (sidebar + topbar + sections)
    └── RechargeModal.tsx          ← Modale 4 packs + Stripe lock
```

Tous les fichiers commencent par `"use client"` → **App Router** Next.js 16 ready.

---

## Import minimal

```tsx
// app/(director)/layout.tsx
import "@/director/director.css";

// app/(director)/director/page.tsx
"use client";
import { DirectorApp } from "@/director";
export default function Page() {
  return <DirectorApp showDevNav={false} />;
}
```

Ou un écran par route — voir [INTEGRATION.md](./INTEGRATION.md).

---

## Système de design

| Token                  | Valeur                                     |
| ---------------------- | ------------------------------------------ |
| Background             | `#F7F7F8`                                  |
| Surface                | `#FFFFFF`                                  |
| Texte primaire         | `#111827`                                  |
| Accent (Stripe-y navy) | `#0A2540`                                  |
| Police                 | Inter / Inter Display, tabular-nums actif  |
| Rayons                 | 6 → 22 px                                  |
| Ombres                 | 5 niveaux (xs → xl) très subtils           |
| Gradients persona      | 6 (Léa, Maxime, Sophie, Antoine, Camille, Pack) |

Toutes les valeurs sont des **variables CSS** (`--wd-*`) → trivialement
ré-utilisables dans votre app de prod.

---

## Identifiants de démo

```
Email      : tom@plomberie-martin.fr
Mot de passe : Tom4283!
```

(Validation locale uniquement, pour la preview statique.)

---

## Identifiants `data-testid`

Tous les éléments interactifs et toutes les valeurs critiques exposent un
`data-testid` stable préfixé `director-…`. Exemples :

- `director-login-submit`, `director-login-email-input`
- `director-kpi-credits`, `director-kpi-team`, `director-kpi-perf`
- `director-agent-card-google_ads`, `director-agent-card-google_ads-hire`
- `director-detail-panel`, `director-detail-hire`, `director-detail-faq-0`
- `director-recharge-pack-p3`, `director-recharge-confirm`
- `director-toast-success`, `director-toast-info`

Compatibles **Playwright** / **Cypress** sans config supplémentaire.
