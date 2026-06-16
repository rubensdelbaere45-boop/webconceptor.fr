-- ════════════════════════════════════════════════════════════════════
-- Gate par code d'accès — protection légale contre constat d'huissier
-- ════════════════════════════════════════════════════════════════════
-- Suite à une mise en demeure (juin 2026), toutes les maquettes prospects
-- doivent être protégées par un code unique transmis par mail.
-- Le constat d'huissier "page accessible publiquement" n'est plus possible.
-- ════════════════════════════════════════════════════════════════════

alter table prospects
  add column if not exists access_code text,
  add column if not exists access_code_generated_at timestamptz,
  add column if not exists access_code_sent_at timestamptz,
  add column if not exists access_code_first_unlocked_at timestamptz,
  add column if not exists access_code_unlock_count int default 0;

-- Index pour lookup par code (uniqueness vérifiée applicativement,
-- collision proba ~ 1/32^8 = 1/1e12, négligeable)
create index if not exists prospects_access_code_idx
  on prospects(access_code)
  where access_code is not null;

-- Log de chaque tentative (réussie ou non) — utile pour Telegram
-- alert + détection bot/huissier
create table if not exists prospect_access_attempts (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  slug        text not null,
  code_tried  text,
  success     boolean not null,
  ip          text,
  user_agent  text,
  referer     text,
  created_at  timestamptz default now()
);

create index if not exists prospect_access_attempts_prospect_idx
  on prospect_access_attempts(prospect_id, created_at desc);
