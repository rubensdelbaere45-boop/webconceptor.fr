-- ════════════════════════════════════════════════════════════════════
-- EMAIL AGENT — table de log + colonnes regen
-- ════════════════════════════════════════════════════════════════════
-- Agent autonome qui lit les mails entrants sur contact@klyora.fr et
-- classifie + auto-répond + escalade Telegram selon l'intention.
-- ════════════════════════════════════════════════════════════════════

-- Log de tous les mails reçus + classification
create table if not exists prospect_email_messages (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid references prospects(id) on delete set null,
  from_email    text not null,
  from_name     text,
  subject       text,
  body_text     text,
  intent        text,
  reasoning     text,
  received_at   timestamptz default now(),
  created_at    timestamptz default now()
);

create index if not exists prospect_email_messages_prospect_idx
  on prospect_email_messages(prospect_id, received_at desc);

create index if not exists prospect_email_messages_intent_idx
  on prospect_email_messages(intent, received_at desc);

-- Flag de re-génération pour les prospects qui ont donné des instructions
alter table prospects
  add column if not exists regen_requested_at timestamptz,
  add column if not exists regen_instructions text,
  add column if not exists regen_done_at timestamptz;

create index if not exists prospects_regen_pending_idx
  on prospects(regen_requested_at desc)
  where regen_requested_at is not null
    and (regen_done_at is null or regen_done_at < regen_requested_at);
