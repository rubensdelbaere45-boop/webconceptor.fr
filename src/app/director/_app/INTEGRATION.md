# WebDirector — Guide d'intégration Next.js 16 + Supabase + Stripe

> Document destiné à un autre agent (Claude) qui va brancher ce kit UI
> statique sur l'app de production. Tous les écrans sont des **Client
> Components** React purs. Aucun changement de composant n'est nécessaire
> pour brancher Supabase et Stripe — il suffit de fournir les bons
> *callbacks* aux props.

---

## 0. Préparation

### 0.1 Copier le dossier

Copiez l'intégralité de `src/director/` dans votre projet Next.js 16,
par exemple à `app/(director)/_ui/` ou `src/components/director/`.

### 0.2 Importer le CSS **une seule fois**

```tsx
// app/(director)/layout.tsx
import "./_ui/director.css";
import type { ReactNode } from "react";

export default function DirectorLayout({ children }: { children: ReactNode }) {
  return <div className="director-root">{children}</div>;
}
```

### 0.3 Supprimer `DevNav`

`DevNav.tsx` ne sert qu'à l'aperçu statique. En production, le routage
App Router prend le relais. Soit :

- vous ne montez plus `<DirectorApp showDevNav={false} />`, soit
- vous montez chaque écran à sa propre route (recommandé).

---

## 1. Authentification (Supabase Auth)

### 1.1 `LoginScreen`

`LoginScreen` valide l'email en local et appelle `onSuccess` / `onError`.
En production, branchez Supabase :

```tsx
// app/(director)/director/login/page.tsx
"use client";

import { LoginScreen } from "@/components/director";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return (
    <LoginScreen
      onSuccess={async () => {
        // déjà connecté dans handleSubmit — il faut donc plutôt
        // déclencher l'appel ici. Pour ça : voir variante ci-dessous.
      }}
      onError={(msg) => toast.error(msg)}
    />
  );
}
```

**Variante recommandée** — la validation locale du `LoginScreen` est
suffisante pour la démo, mais en prod on veut un vrai appel.
Solution la plus simple : *garder* le composant tel quel et brancher
Supabase directement dans le `onSuccess` à condition de remonter
`email` + `password`. Pour cela, ajoutez deux props (au choix de l'équipe
de prod) :

```tsx
// Patch minimal sur LoginScreen.tsx
type Props = {
  onSubmit: (email: string, password: string) => Promise<void>;  // <-- nouveau
  onError: (msg: string) => void;
};

// puis dans handleSubmit, remplacer le setTimeout par :
await props.onSubmit(email, password);
```

Et côté page :

```tsx
<LoginScreen
  onError={(msg) => toast.error(msg)}
  onSubmit={async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return toast.error("Identifiants invalides.");
    if (data.user?.user_metadata?.must_change_password) {
      router.push("/director/change-password");
    } else {
      router.push("/director/dashboard");
    }
  }}
/>;
```

### 1.2 `ChangePasswordScreen`

```tsx
"use client";
import { ChangePasswordScreen } from "@/components/director";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function Page() {
  const router = useRouter();
  const supabase = createBrowserClient(/* … */);
  return (
    <ChangePasswordScreen
      onError={(m) => toast.error(m)}
      onSuccess={async () => {
        const newPwd = /* récupéré via une prop, ou via un store */ "";
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        if (error) return toast.error(error.message);
        await supabase.auth.updateUser({
          data: { must_change_password: false },
        });
        router.push("/director/welcome");
      }}
    />
  );
}
```

Comme pour `LoginScreen`, vous pouvez extraire `pwd` via une prop
`onSubmit(pwd: string)` plutôt que de garder la simulation locale.

---

## 2. Marketplace + embauche d'agents

`DashboardScreen` reçoit la liste d'agents via `MOCK_AGENTS`. En prod,
remplacez par les agents Supabase :

```tsx
// app/(director)/director/dashboard/page.tsx (Server Component)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";

export default async function Page() {
  const supabase = createServerClient(/* … */);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: account } = await supabase
    .from("director_accounts")
    .select("first_name, business_name, tokens_balance")
    .eq("user_id", user!.id)
    .single();

  const { data: agents } = await supabase.from("director_agents").select("*");
  const { data: activities } = await supabase
    .from("director_activities")
    .select("*").order("created_at", { ascending: false }).limit(20);

  return (
    <DashboardClient
      firstName={account!.first_name}
      businessName={account!.business_name}
      tokens={account!.tokens_balance}
      agents={agents ?? []}
      activities={activities ?? []}
    />
  );
}
```

```tsx
// DashboardClient.tsx (Client Component, wrapper)
"use client";
import { DashboardScreen, AgentDetailPanel, type Agent } from "@/components/director";
import { useState } from "react";

export default function DashboardClient(props: { /* … */ }) {
  const [openAgent, setOpenAgent] = useState<Agent | null>(null);

  async function hire(agent: Agent) {
    const res = await fetch("/api/director/launch-action", {
      method: "POST",
      body: JSON.stringify({ agent_id: agent.id }),
    });
    if (!res.ok) return toast.error("Crédits insuffisants.");
    toast.success(`${agent.firstName} a rejoint votre équipe.`);
    setOpenAgent(null);
    // refresh server data
    router.refresh();
  }

  return (
    <>
      <DashboardScreen
        {...props}
        onOpenAgent={setOpenAgent}
        onHireAgent={hire}
        onOpenRecharge={() => setRechargeOpen(true)}
        onLogout={() => supabase.auth.signOut()}
      />
      <AgentDetailPanel
        agent={openAgent}
        canAfford={openAgent ? props.tokens >= openAgent.cost : false}
        onClose={() => setOpenAgent(null)}
        onHire={hire}
      />
    </>
  );
}
```

### 2.1 Route API `launch-action`

```ts
// app/api/director/launch-action/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const supabase = createServerClient(/* … */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { agent_id } = await req.json();

  // 1. Récupère le coût
  const { data: agent } = await supabase
    .from("director_agents").select("cost").eq("id", agent_id).single();

  // 2. Déduit les crédits (transaction RPC recommandée pour atomicité)
  const { error } = await supabase.rpc("director_hire_agent", {
    agent_id, p_user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
```

Stored procedure SQL associée (à créer en migration) :

```sql
create or replace function director_hire_agent(p_user_id uuid, agent_id text)
returns void
language plpgsql
as $$
declare
  v_cost int;
  v_balance int;
begin
  select cost into v_cost from director_agents where id = agent_id;
  select tokens_balance into v_balance from director_accounts where user_id = p_user_id;
  if v_balance < v_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;
  update director_accounts
    set tokens_balance = tokens_balance - v_cost
    where user_id = p_user_id;
  insert into director_activities (user_id, label, delta)
    values (p_user_id, 'Agent embauché', -v_cost);
end;
$$;
```

---

## 3. Recharge crédits (Stripe Checkout)

```tsx
<RechargeModal
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={async (pack) => {
    const res = await fetch("/api/director/checkout-credits", {
      method: "POST",
      body: JSON.stringify({ pack_id: pack.id }),
    });
    const { url } = await res.json();
    window.location.href = url;   // Redirige vers Stripe Checkout
  }}
/>;
```

```ts
// app/api/director/checkout-credits/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PACKS = {
  p1: { name: "Démarrage",   price_cents:   999, credits:  100 },
  p2: { name: "Confort",     price_cents:  3999, credits:  550 },
  p3: { name: "Performance", price_cents:  9999, credits: 1750 },
  p4: { name: "Domination",  price_cents: 29999, credits: 6000 },
};

export async function POST(req: Request) {
  const { pack_id } = await req.json();
  const pack = PACKS[pack_id as keyof typeof PACKS];
  if (!pack) return NextResponse.json({ error: "unknown_pack" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: pack.price_cents,
        product_data: { name: `Pack ${pack.name}` },
      },
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/director/dashboard?recharge=success`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/director/dashboard?recharge=cancel`,
    metadata: { pack_id, credits: String(pack.credits) },
  });

  return NextResponse.json({ url: session.url });
}
```

### 3.1 Webhook Stripe

```ts
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(
    await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET!,
  );
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const credits = parseInt(s.metadata!.credits, 10);
    const userId  = s.metadata!.user_id;  // injecté en amont
    await supabaseAdmin.rpc("director_add_credits", { p_user_id: userId, p_credits: credits });
  }
  return new Response("ok");
}
```

---

## 4. Schéma Supabase suggéré

```sql
-- Comptes
create table director_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  business_name text not null,
  city text,
  tokens_balance int not null default 100,
  created_at timestamptz default now()
);

-- Catalogue d'agents (en lecture seule pour les clients)
create table director_agents (
  id text primary key,
  first_name text not null,
  job_title text not null,
  category text not null,
  cost int not null,
  payload jsonb not null,        -- pitch, deliverables, testimonial, faq, color, …
  featured boolean default false
);

-- Agents actifs (jointure)
create table director_user_agents (
  user_id uuid references auth.users(id) on delete cascade,
  agent_id text references director_agents(id),
  hired_at timestamptz default now(),
  primary key (user_id, agent_id)
);

-- Activité
create table director_activities (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  label text not null,
  delta int not null default 0,
  created_at timestamptz default now()
);

-- RLS minimal
alter table director_accounts enable row level security;
create policy "own row" on director_accounts for all using (auth.uid() = user_id);
alter table director_user_agents enable row level security;
create policy "own row" on director_user_agents for all using (auth.uid() = user_id);
alter table director_activities enable row level security;
create policy "own row" on director_activities for all using (auth.uid() = user_id);
```

---

## 5. Variables d'environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey…
SUPABASE_SERVICE_ROLE_KEY=ey…           # API routes serveur uniquement
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
NEXT_PUBLIC_APP_URL=https://app.webdirector.fr
```

---

## 6. Checklist de mise en prod

- [ ] `director.css` importé une fois dans le layout racine
- [ ] `DevNav` retiré (ou `showDevNav={false}` sur `DirectorApp`)
- [ ] Chaque écran branché à sa route App Router
- [ ] `LoginScreen` / `ChangePasswordScreen` patchés pour remonter `email`+`password` (voir §1)
- [ ] Routes API `/api/director/launch-action` et `/api/director/checkout-credits` créées
- [ ] Webhook Stripe configuré sur `checkout.session.completed`
- [ ] Migrations SQL appliquées (tables + RLS + RPC)
- [ ] Données mockées (`MOCK_AGENTS`, `MOCK_PACKS`) répliquées dans Supabase
- [ ] Suppression des `console.log("TODO: …")` une fois branchés

---

## 7. FAQ rapide

**Q. Puis-je remplacer les styles inline par Tailwind ?**
Oui — les styles inline sont là par souci d'isolation. Ils peuvent
être réécrits en classes Tailwind sans changer la structure JSX.

**Q. Tous les textes sont en français. Comment internationaliser ?**
Extraire les chaînes vers un fichier `messages/fr.ts` et utiliser
`next-intl` ou `react-intl`. Les écrans n'ont pas de logique conditionnelle
sur la langue.

**Q. Pourquoi tous les composants ont-ils `"use client"` ?**
Ils gèrent du state local (formulaires, onglets, slide-overs). En App
Router, vous pouvez très bien les wrapper dans un Server Component
qui fetch les données puis les passe en props.
