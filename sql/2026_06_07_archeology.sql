-- Migration : colonnes pour le Rénovateur/Archéologue
-- À exécuter dans Supabase SQL editor (idempotent).

alter table prospects add column if not exists is_outdated boolean;
alter table prospects add column if not exists is_pre_2015 boolean;
alter table prospects add column if not exists obsolete_score integer;
alter table prospects add column if not exists obsolete_signals jsonb;
alter table prospects add column if not exists obsolete_checked_at timestamptz;
alter table prospects add column if not exists outdated_email_sent_at timestamptz;

create index if not exists prospects_outdated_idx on prospects(is_outdated) where is_outdated = true;
create index if not exists prospects_pre2015_idx on prospects(is_pre_2015) where is_pre_2015 = true;
create index if not exists prospects_obsolete_score_idx on prospects(obsolete_score desc);
