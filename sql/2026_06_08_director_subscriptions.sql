-- ════════════════════════════════════════════════════════════════════
-- WebDirector — Abonnement plateforme
-- 29,90 €/mois  OU  320 €/an (= 26,67 €/mois équivalent)
-- ════════════════════════════════════════════════════════════════════

create table if not exists director_subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  account_id               uuid not null,                          -- director_accounts.id
  stripe_subscription_id   text unique,
  stripe_customer_id       text,
  stripe_price_id          text,
  plan                     text not null,                          -- 'monthly' | 'yearly'
  amount_cents             integer not null,                       -- 2990 ou 32000
  currency                 text not null default 'eur',
  status                   text not null,                          -- active | past_due | canceled | trialing | incomplete
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean default false,
  canceled_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists director_subs_account_idx on director_subscriptions(account_id);
create index if not exists director_subs_status_idx on director_subscriptions(status);
create index if not exists director_subs_stripe_idx on director_subscriptions(stripe_subscription_id);

alter table director_subscriptions enable row level security;

-- Ajout colonne is_subscribed sur director_accounts (cache)
alter table director_accounts add column if not exists is_subscribed boolean default false;
alter table director_accounts add column if not exists subscription_plan text;
alter table director_accounts add column if not exists subscription_renews_at timestamptz;

-- Ajout colonne pour identifier le numéro Vapi inbound d'un compte
alter table director_accounts add column if not exists vapi_inbound_number text;
alter table director_accounts add column if not exists business_type text;

create index if not exists director_accounts_vapi_idx on director_accounts(vapi_inbound_number);
