-- ════════════════════════════════════════════════════════════════════
-- WebDirector — Auto-provisioning des comptes depuis prospection cold
-- ════════════════════════════════════════════════════════════════════

-- ─── Colonnes auto-provisioning sur director_accounts ───

alter table director_accounts add column if not exists must_change_password boolean default false;
alter table director_accounts add column if not exists auto_provisioned boolean default false;
alter table director_accounts add column if not exists provisioned_from_prospect_id uuid;
alter table director_accounts add column if not exists provisional_password_hash text; -- bcrypt, jamais le password en clair
alter table director_accounts add column if not exists diagnostic_completed_at timestamptz;
alter table director_accounts add column if not exists diagnostic_report jsonb;

-- ─── Colonnes business pre-rempli (Scrapling + INSEE) ───

alter table director_accounts add column if not exists siret text;
alter table director_accounts add column if not exists code_naf text;
alter table director_accounts add column if not exists business_address text;
alter table director_accounts add column if not exists google_rating numeric(2,1);
alter table director_accounts add column if not exists google_reviews_count integer;
alter table director_accounts add column if not exists website_url text;
alter table director_accounts add column if not exists instagram_url text;
alter table director_accounts add column if not exists facebook_url text;
alter table director_accounts add column if not exists hours_of_operation text;
alter table director_accounts add column if not exists photos jsonb;
alter table director_accounts add column if not exists last_diagnostic_at timestamptz;

create index if not exists director_accounts_prospect_idx on director_accounts(provisioned_from_prospect_id);
create index if not exists director_accounts_email_idx on director_accounts(email);

-- ─── Diagnostic table pour historique ───

create table if not exists director_diagnostics (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null,
  triggered_at        timestamptz not null default now(),
  completed_at        timestamptz,
  failles_detected    jsonb not null default '[]'::jsonb,
  agents_recommended  jsonb not null default '[]'::jsonb,
  raw_ia_response     text,
  source              text default 'manual'   -- 'manual' | 'first_login' | 'admin'
);

create index if not exists director_diagnostics_account_idx on director_diagnostics(account_id);
alter table director_diagnostics enable row level security;

-- ─── Flag agent "coming soon" pour Meta Ads / Google Ads paid features ───
-- (utilisé côté UI pour griser le bouton)

create table if not exists director_agent_status (
  agent_slug    text primary key,
  status        text not null default 'live',     -- 'live' | 'coming_soon' | 'beta' | 'disabled'
  reason        text,
  updated_at    timestamptz not null default now()
);

insert into director_agent_status (agent_slug, status, reason) values
  ('google_ads', 'coming_soon', 'Configuration Google Ads API en cours'),
  ('meta_ads',   'coming_soon', 'Configuration Meta Ads API en cours')
on conflict (agent_slug) do update set status = excluded.status, reason = excluded.reason, updated_at = now();
