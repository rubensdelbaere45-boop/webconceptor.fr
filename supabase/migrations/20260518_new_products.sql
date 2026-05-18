-- ══════════════════════════════════════════════════════════════
-- Nouveaux produits SaaS WebConceptor
-- Migration : 2026-05-18
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. CHATBOT IA (79€/mois)
-- Widget JS embeddable + page standalone
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chatbot_subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token                 TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  business_name         TEXT        NOT NULL,
  business_type         TEXT        DEFAULT 'general',
  owner_email           TEXT        NOT NULL,
  owner_name            TEXT,
  phone                 TEXT,
  address               TEXT,
  city                  TEXT,
  hours                 TEXT        DEFAULT 'Lundi-Vendredi 9h-18h',
  booking_url           TEXT,
  website_url           TEXT,
  accent_color          TEXT        DEFAULT '#0066ff',
  welcome_message       TEXT        DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  faqs                  JSONB       DEFAULT '[]',
  status                TEXT        DEFAULT 'active',   -- active | paused | cancelled
  messages_count        INTEGER     DEFAULT 0,
  onboarding_done       BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour lookup rapide par token (appelé à chaque message)
CREATE INDEX IF NOT EXISTS chatbot_subscriptions_token_idx
  ON public.chatbot_subscriptions(token);

CREATE INDEX IF NOT EXISTS chatbot_subscriptions_stripe_sub_idx
  ON public.chatbot_subscriptions(stripe_subscription_id);

-- ─────────────────────────────────────────
-- 2. AGENT AVIS GOOGLE (149€/mois)
-- Répond automatiquement aux avis Google My Business
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gmb_subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  owner_email             TEXT        NOT NULL,
  owner_name              TEXT,
  business_name           TEXT        NOT NULL,
  business_type           TEXT        DEFAULT 'general',
  phone                   TEXT,
  city                    TEXT,
  -- Google OAuth
  google_account_id       TEXT,       -- ex: "accounts/123456789"
  google_location_id      TEXT,       -- ex: "locations/987654321"
  google_access_token     TEXT,       -- courte durée
  google_refresh_token    TEXT,       -- longue durée (à chiffrer)
  google_token_expiry     TIMESTAMPTZ,
  -- Config
  response_tone           TEXT        DEFAULT 'professionnel',  -- professionnel | chaleureux | formel
  auto_respond            BOOLEAN     DEFAULT TRUE,
  respond_to_positive     BOOLEAN     DEFAULT TRUE,
  respond_to_negative     BOOLEAN     DEFAULT TRUE,
  business_description    TEXT,       -- contexte pour l'IA
  -- Stats
  reviews_checked         INTEGER     DEFAULT 0,
  reviews_responded       INTEGER     DEFAULT 0,
  last_check_at           TIMESTAMPTZ,
  -- State
  status                  TEXT        DEFAULT 'pending_auth',  -- pending_auth | active | paused | cancelled
  auth_token              TEXT        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gmb_subscriptions_stripe_sub_idx
  ON public.gmb_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS gmb_subscriptions_auth_token_idx
  ON public.gmb_subscriptions(auth_token);

-- ─────────────────────────────────────────
-- 3. AUDIT IA PRÉSENCE EN LIGNE (49€ one-shot)
-- Rapport PDF automatique en 5 min
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_orders (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id     TEXT        UNIQUE,
  stripe_payment_intent TEXT,
  owner_email           TEXT        NOT NULL,
  owner_name            TEXT,
  business_name         TEXT        NOT NULL,
  business_address      TEXT,
  website_url           TEXT,
  phone                 TEXT,
  -- Résultats
  report_html           TEXT,       -- rapport HTML complet
  report_sent_at        TIMESTAMPTZ,
  gmb_rating            NUMERIC(2,1),
  gmb_reviews_count     INTEGER,
  website_score         INTEGER,    -- 0-100
  status                TEXT        DEFAULT 'pending',  -- pending | processing | done | error
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : toutes ces tables sont privées (accès service role uniquement)
ALTER TABLE public.chatbot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_orders          ENABLE ROW LEVEL SECURITY;
