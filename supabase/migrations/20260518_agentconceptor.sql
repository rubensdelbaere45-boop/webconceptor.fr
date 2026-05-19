-- ══════════════════════════════════════════════════════════════
-- AGENTConceptor — Tables supplémentaires
-- Migration : 2026-05-18 v2
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- Abonnements multi-produits AGENTConceptor
-- Une ligne par client, avec les agents souscrits
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agentconceptor_subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT        UNIQUE,
  stripe_session_id       TEXT        UNIQUE,
  owner_email             TEXT        NOT NULL,
  owner_name              TEXT,
  business_name           TEXT        NOT NULL,
  business_type           TEXT        DEFAULT 'general',
  phone                   TEXT,
  city                    TEXT,
  -- Agents actifs (booléens)
  has_chatbot             BOOLEAN     DEFAULT FALSE,
  has_reputation          BOOLEAN     DEFAULT FALSE,
  has_devis               BOOLEAN     DEFAULT FALSE,
  has_contenu             BOOLEAN     DEFAULT FALSE,
  has_fidelisation        BOOLEAN     DEFAULT FALSE,
  has_pack                BOOLEAN     DEFAULT FALSE,
  -- Tokens pour les différents agents
  chatbot_token           TEXT,
  devis_token             TEXT        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  gmb_auth_token          TEXT,
  -- Montant mensuel total
  monthly_amount          INTEGER     DEFAULT 0,   -- en centimes
  -- État
  status                  TEXT        DEFAULT 'active',  -- active | paused | cancelled
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agentconceptor_subs_email_idx
  ON public.agentconceptor_subscriptions(owner_email);

CREATE INDEX IF NOT EXISTS agentconceptor_subs_devis_token_idx
  ON public.agentconceptor_subscriptions(devis_token);

-- ─────────────────────────────────────────
-- Agent Devis — Formulaires remplis par les clients
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devis_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   UUID        REFERENCES public.agentconceptor_subscriptions(id),
  devis_token       TEXT        NOT NULL,
  -- Infos client
  client_name       TEXT        NOT NULL,
  client_email      TEXT        NOT NULL,
  client_phone      TEXT,
  -- Projet
  project_type      TEXT,
  project_description TEXT      NOT NULL,
  project_address   TEXT,
  budget_range      TEXT,
  desired_date      TEXT,
  -- Devis généré
  devis_html        TEXT,
  devis_number      TEXT,       -- ex: DEVIS-2026-0001
  devis_amount      TEXT,       -- estimation IA
  -- Status
  status            TEXT        DEFAULT 'pending', -- pending | generated | sent | accepted | declined
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS devis_requests_token_idx
  ON public.devis_requests(devis_token);

-- ─────────────────────────────────────────
-- Agent Contenu — Abonnements posts sociaux
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contenu_subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agentconceptor_sub_id   UUID        REFERENCES public.agentconceptor_subscriptions(id),
  owner_email             TEXT        NOT NULL,
  owner_name              TEXT,
  business_name           TEXT        NOT NULL,
  business_type           TEXT        DEFAULT 'general',
  city                    TEXT,
  tone                    TEXT        DEFAULT 'professionnel',  -- professionnel | fun | inspirant
  posts_sent              INTEGER     DEFAULT 0,
  last_send_at            TIMESTAMPTZ,
  status                  TEXT        DEFAULT 'active',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.agentconceptor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis_requests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenu_subscriptions        ENABLE ROW LEVEL SECURITY;
