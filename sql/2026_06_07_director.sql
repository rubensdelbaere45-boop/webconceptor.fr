-- ════════════════════════════════════════════════════════════════════
-- WebDirector — plateforme SaaS gamifiée crédits/agents IA
-- À exécuter dans Supabase SQL editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

-- ─── Comptes director (1 ligne par entreprise onboardée) ───

create table if not exists director_accounts (
  id                       uuid primary key default gen_random_uuid(),
  auth_user_id             uuid unique,                          -- lien Supabase Auth
  prospect_id              uuid,                                  -- lien éventuel prospects
  email                    text not null unique,
  business_name            text,
  business_type            text,
  city                     text,
  phone                    text,
  is_first_login           boolean not null default true,
  onboarded_at             timestamptz default now(),
  welcome_email_sent_at    timestamptz,
  last_login_at            timestamptz,
  temporary_password_used  boolean default false,
  tokens_balance           integer not null default 100,         -- 100 crédits offerts
  total_tokens_purchased   integer not null default 0,
  total_tokens_spent       integer not null default 0,
  stripe_customer_id       text,
  metadata                 jsonb default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists director_accounts_email_idx on director_accounts(email);
create index if not exists director_accounts_auth_user_idx on director_accounts(auth_user_id);
create index if not exists director_accounts_prospect_idx on director_accounts(prospect_id);
alter table director_accounts enable row level security;

-- ─── Logs des actions (achat crédits, lancement campagne, etc.) ───

create table if not exists director_actions (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid references director_accounts(id) on delete cascade,
  action_type         text not null,         -- "purchase_credits" | "launch_campaign" | "activate_agent" | "login" | "password_changed"
  tokens_delta        integer not null default 0,  -- positif si ajout, négatif si dépense
  tokens_balance_after integer,
  details             jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists director_actions_account_idx on director_actions(account_id);
create index if not exists director_actions_type_idx on director_actions(action_type);
create index if not exists director_actions_created_idx on director_actions(created_at desc);
alter table director_actions enable row level security;

-- ─── Campagnes lancées ───

create table if not exists director_campaigns (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid references director_accounts(id) on delete cascade,
  campaign_type   text not null,             -- "google_ads" | "meta_ads" | "agent_reputation" | "agent_seo" | "agent_chatbot"
  status          text not null default 'pending',  -- pending | running | paused | completed | error
  tokens_cost     integer not null,
  config          jsonb not null,
  n8n_workflow_id text,
  results         jsonb,
  launched_at     timestamptz default now(),
  completed_at    timestamptz
);

create index if not exists director_campaigns_account_idx on director_campaigns(account_id);
create index if not exists director_campaigns_status_idx on director_campaigns(status);
alter table director_campaigns enable row level security;

-- ─── Tracking onboarding sur table prospects ───
alter table prospects add column if not exists director_onboarded_at timestamptz;
create index if not exists prospects_director_onboarded_idx on prospects(director_onboarded_at);

-- ─── Pricing crédits (cache des prix Stripe) ───

create table if not exists director_credit_packs (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  credits             integer not null,
  price_eur           numeric(8,2) not null,
  stripe_price_id     text,
  bonus_credits       integer default 0,
  is_active           boolean default true,
  display_order       integer default 0,
  created_at          timestamptz not null default now()
);
alter table director_credit_packs enable row level security;

-- Seed des packs par défaut (4 paliers gamifiés)
insert into director_credit_packs (name, credits, price_eur, bonus_credits, display_order, is_active)
values
  ('Démarrage',  100,  9.99,   0,  1, true),
  ('Confort',    500,  39.99,  50, 2, true),
  ('Performance',1500, 99.99, 250, 3, true),
  ('Domination', 5000, 299.99,1000, 4, true)
on conflict do nothing;
