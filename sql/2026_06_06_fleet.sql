-- Migration : colonnes pour la WebConceptor Fleet (Profiler / Sniper / Closer / Déployeur)
-- À exécuter dans Supabase SQL editor.

-- ── Profiler (Agent 1) ──
alter table prospects add column if not exists sales_angle text;
alter table prospects add column if not exists custom_hook text;
alter table prospects add column if not exists profiled_at timestamptz;

-- ── QA Gatekeeper ──
alter table prospects add column if not exists qa_passed boolean;
alter table prospects add column if not exists qa_issues jsonb;
alter table prospects add column if not exists qa_checked_at timestamptz;

-- ── Sniper (Agent 2) ──
alter table prospects add column if not exists sniper_sent_at timestamptz;

-- ── Closer-Alert (Agent 3) ──
alter table prospects add column if not exists hot_alert_sent_at timestamptz;
alter table prospects add column if not exists modal_opened_at timestamptz;

-- ── Déployeur (Agent 4) — sur table orders ──
alter table orders add column if not exists deployed_at timestamptz;
alter table orders add column if not exists welcome_email_sent_at timestamptz;
alter table orders add column if not exists ionos_domain_status text;
alter table orders add column if not exists ionos_detail text;
alter table orders add column if not exists tier text;
alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists buyer_prenom text;
alter table orders add column if not exists buyer_nom text;
alter table orders add column if not exists buyer_adresse text;
alter table orders add column if not exists buyer_cp text;
alter table orders add column if not exists buyer_ville text;

-- Indexes
create index if not exists prospects_sales_angle_idx on prospects(sales_angle);
create index if not exists prospects_qa_passed_idx on prospects(qa_passed);
create index if not exists prospects_sniper_idx on prospects(sniper_sent_at);
create index if not exists prospects_hot_alert_idx on prospects(hot_alert_sent_at);
create index if not exists orders_deployed_idx on orders(deployed_at);
create index if not exists orders_status_paid_idx on orders(status) where status = 'paid';
