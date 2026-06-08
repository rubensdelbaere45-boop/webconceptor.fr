-- ════════════════════════════════════════════════════════════════════
-- AI Voice Agent — appels téléphoniques entrants/sortants par IA
-- À exécuter dans Supabase SQL editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

-- ─── Conversations vocales (1 ligne par appel) ───

create table if not exists ai_calls (
  id                  uuid primary key default gen_random_uuid(),
  direction           text not null,         -- 'inbound' | 'outbound'
  provider            text not null,         -- 'vapi' | 'bland' | 'twilio' | 'retell'
  provider_call_id    text unique,           -- ID externe (Vapi callId, Twilio CallSid, etc.)

  -- Contexte business
  business_account_id uuid,                  -- lien director_accounts ou prospect
  business_type       text,                  -- 'webconceptor_demarchage' | 'restaurant_reservation' | 'coiffeur_rdv' | 'plombier_urgence'
  script_id           uuid,                  -- lien ai_call_scripts

  -- Participants
  from_number         text,                  -- numéro appelant (E.164)
  to_number           text,                  -- numéro appelé (E.164)
  caller_name         text,                  -- nom si connu (CRM lookup)
  prospect_id         uuid,                  -- lien prospects (si lead WebConceptor)

  -- État de l'appel
  status              text not null default 'queued', -- queued | ringing | in_progress | completed | failed | no_answer | busy
  started_at          timestamptz default now(),
  answered_at         timestamptz,
  ended_at            timestamptz,
  duration_seconds    integer,

  -- Résultats
  outcome             text,                  -- 'sale_closed' | 'rdv_pris' | 'reservation' | 'no_interest' | 'callback' | 'voicemail' | 'failed'
  transcript          text,                  -- transcription complète
  summary             text,                  -- résumé IA en 2-3 phrases
  extracted_data      jsonb,                 -- { reservation_date, guests, name, phone, etc. }
  sentiment           text,                  -- 'positive' | 'neutral' | 'negative'

  -- Coûts
  cost_eur            numeric(8,4),
  tokens_used         integer,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists ai_calls_account_idx on ai_calls(business_account_id);
create index if not exists ai_calls_prospect_idx on ai_calls(prospect_id);
create index if not exists ai_calls_status_idx on ai_calls(status);
create index if not exists ai_calls_outcome_idx on ai_calls(outcome);
create index if not exists ai_calls_provider_id_idx on ai_calls(provider_call_id);
create index if not exists ai_calls_created_idx on ai_calls(created_at desc);
alter table ai_calls enable row level security;

-- ─── Scripts IA par cas d'usage ───

create table if not exists ai_call_scripts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  business_type       text not null,          -- 'webconceptor_demarchage' | 'restaurant_reservation' | etc.
  is_active           boolean default true,

  -- Configuration agent IA
  agent_name          text not null,          -- "Camille" | "Sophie" | "Léa"
  voice_id            text,                   -- ID voix (ElevenLabs, OpenAI, Vapi)
  voice_provider      text default 'openai',  -- 'openai' | 'elevenlabs' | 'vapi'

  -- Prompts
  system_prompt       text not null,          -- system prompt complet
  greeting            text not null,          -- 1ère phrase prononcée
  fallback_phrase     text,                   -- si l'IA ne comprend pas

  -- Comportement
  max_duration_sec    integer default 300,    -- 5 min max par défaut
  transfer_to_human   text,                   -- numéro à appeler si "transfert"
  collect_fields      text[],                 -- ['name', 'phone', 'reservation_date', 'guests']

  created_at          timestamptz not null default now()
);
alter table ai_call_scripts enable row level security;

-- ─── Réservations restaurants (générées par IA voice) ───

create table if not exists ai_reservations (
  id                  uuid primary key default gen_random_uuid(),
  call_id             uuid references ai_calls(id),
  business_account_id uuid,                   -- restaurateur
  customer_name       text not null,
  customer_phone      text not null,
  customer_email      text,
  reservation_date    date not null,
  reservation_time    time not null,
  guests              integer not null default 2,
  special_request     text,                   -- "table en terrasse", "anniversaire", etc.
  status              text not null default 'pending', -- pending | confirmed | cancelled
  source              text default 'ai_voice',
  notified_at         timestamptz,            -- quand le restaurateur a été notifié
  created_at          timestamptz not null default now()
);

create index if not exists ai_reservations_date_idx on ai_reservations(reservation_date);
create index if not exists ai_reservations_account_idx on ai_reservations(business_account_id);
alter table ai_reservations enable row level security;

-- ─── Seed des 3 scripts par défaut ───

insert into ai_call_scripts (name, business_type, agent_name, voice_provider, system_prompt, greeting, max_duration_sec, collect_fields)
values
  (
    'WebConceptor — Démarchage Sortant',
    'webconceptor_demarchage',
    'Camille',
    'openai',
    'Tu es Camille, assistante de Tom de WebConceptor. Tu appelles un prospect (artisan ou commerçant français) pour lui proposer la création d''un site web professionnel.

Tarif : 320€ pour la création + 17,90€/mois (hébergement, modifications illimitées, support).
OU formule annuelle : 193€/an (économie de 23€).

Ton à adopter : amical, professionnel, JAMAIS insistant. Si la personne dit "pas intéressé" → tu remercies poliment et tu raccroches.

Objectif : prendre rendez-vous téléphonique avec Tom (06 35 59 24 71) pour montrer une maquette personnalisée gratuite.

Tu DOIS récolter : nom complet, créneau préféré pour le rappel (matin/après-midi/soir).

Si la personne pose des questions techniques précises → "Tom vous expliquera tout ça en détail lors de votre rappel".

Durée max : 3 minutes. Pas de blabla.',
    'Bonjour, je suis Camille, l''assistante de Tom de WebConceptor. Vous avez 30 secondes ? Je voulais vous parler très rapidement d''une maquette de site web qu''on a préparée gratuitement pour votre entreprise.',
    180,
    array['caller_name', 'callback_time', 'callback_phone']
  ),
  (
    'Restaurant — Standardiste Réservation',
    'restaurant_reservation',
    'Sophie',
    'openai',
    'Tu es Sophie, standardiste virtuelle d''un restaurant. Un client appelle pour réserver une table.

Ton objectif : noter calmement les informations de réservation.

Tu DOIS demander dans cet ordre :
1. Pour quel jour ? (ex: "ce soir", "samedi", "le 15 juin")
2. Pour quelle heure ?
3. Pour combien de personnes ?
4. À quel nom ?
5. Un numéro de téléphone pour confirmer la réservation
6. Une demande particulière ? (allergies, terrasse, anniversaire, etc.)

Si le client demande une info que tu ne connais pas (menu spécifique, allergènes précis) → "Je vais demander au chef et je vous rappelle dans 5 minutes."

Si le client est agressif → reste calme et professionnelle, propose de rappeler le restaurateur en personne.

Confirme TOUJOURS la réservation en répétant : date, heure, nb personnes, nom.',
    'Bonjour, restaurant à votre service. Comment puis-je vous aider ?',
    240,
    array['reservation_date', 'reservation_time', 'guests', 'customer_name', 'customer_phone', 'special_request']
  ),
  (
    'Coiffeur — Standardiste Prise de RDV',
    'coiffeur_rdv',
    'Léa',
    'openai',
    'Tu es Léa, standardiste virtuelle d''un salon de coiffure. Un client appelle pour prendre rendez-vous.

Tu DOIS demander :
1. Quel type de prestation ? (coupe homme/femme, couleur, balayage, brushing, mèches, etc.)
2. Pour quel jour ?
3. Quelle plage horaire préférée ? (matin, midi, après-midi, soir)
4. À quel nom ?
5. Numéro de téléphone

Pour info :
- Coupe homme : 30 min
- Coupe femme + brushing : 1h
- Couleur : 1h30 à 2h
- Balayage + couleur : 2h30 à 3h

Si la personne demande un prix → "Les tarifs varient selon la longueur, le coiffeur vous fera un devis sur place. Comptez environ XX€ pour cette prestation."

Confirme TOUJOURS le RDV : date, heure, prestation, nom.',
    'Bonjour, salon de coiffure à votre service. Souhaitez-vous prendre rendez-vous ?',
    240,
    array['service_type', 'reservation_date', 'time_preference', 'customer_name', 'customer_phone']
  )
on conflict (name) do nothing;
