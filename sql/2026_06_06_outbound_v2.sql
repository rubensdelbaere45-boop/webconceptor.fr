-- Migration : nouvelles colonnes pour tracking outbound V2 segmenté.
-- À exécuter dans Supabase SQL editor.

-- closer-opened : workflow "Closer les 191" (status='opened')
alter table prospects add column if not exists closer_sent_at timestamptz;
create index if not exists prospects_closer_idx on prospects(closer_sent_at);

-- distress-signals : segments A (no website) + B (rating < 3.8)
alter table prospects add column if not exists distress_email_sent_at timestamptz;
alter table prospects add column if not exists distress_segment text;
create index if not exists prospects_distress_idx on prospects(distress_email_sent_at);

-- Optionnel : champ prospect contact_first_name / last_name pour prefill plus fin
alter table prospects add column if not exists contact_first_name text;
alter table prospects add column if not exists contact_last_name text;

-- google_reviews_count si pas déjà présent
alter table prospects add column if not exists google_reviews_count integer;
