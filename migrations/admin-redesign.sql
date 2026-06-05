-- ============================================================
-- WebConceptor Admin Redesign — Migration SQL
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Compléter la table prospects (les colonnes manquent peut-être)
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rating       numeric(3,1);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS mockup_type  text DEFAULT 'template'; -- 'stitch' | 'template'
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS mockup_url   text;
-- phone, sent_at, opened_at, status existent déjà

-- 2. Table orders (commandes payées)
CREATE TABLE IF NOT EXISTS orders (
  id            text PRIMARY KEY,
  prospect_id   uuid REFERENCES prospects(id) ON DELETE SET NULL,
  client        text NOT NULL,
  email         text NOT NULL,
  phone         text,
  type          text,
  city          text,
  plan          text NOT NULL,        -- 'simple' | 'serenite' | 'luxury'
  domaine       text,
  paid          boolean DEFAULT false,
  paid_at       timestamptz,
  stripe_id     text UNIQUE,
  mockup_type   text DEFAULT 'stitch',
  mockup_url    text,
  site_url      text,
  deployed      boolean DEFAULT false,
  deployed_at   timestamptz,
  generated_at  timestamptz,
  delivery_email_sent_at timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- 3. Table settings (config admin)
CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('batch_size', '130'),
  ('telegram_chat_id', ''),
  ('telegram_bot_token', '')
ON CONFLICT (key) DO NOTHING;

-- 4. Table deploy_logs
CREATE TABLE IF NOT EXISTS deploy_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   text REFERENCES orders(id) ON DELETE CASCADE,
  timestamp  timestamptz DEFAULT now(),
  level      text DEFAULT 'info',     -- 'info' | 'ok' | 'warn' | 'err'
  message    text NOT NULL
);

-- 5. Table system_logs
CREATE TABLE IF NOT EXISTS system_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp  timestamptz DEFAULT now(),
  level      text DEFAULT 'info',     -- 'ok' | 'info' | 'warn' | 'err'
  service    text,                    -- 'brevo' | 'scrapling' | 'stitch' | 'n8n' | 'sms'
  message    text NOT NULL
);

-- 6. RLS — service_role uniquement
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deploy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 7. Index utiles
CREATE INDEX IF NOT EXISTS idx_prospects_status_v2 ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_type      ON prospects(business_type);
CREATE INDEX IF NOT EXISTS idx_prospects_updated   ON prospects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_paid         ON orders(paid, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_prospect     ON orders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_deploy_logs_order   ON deploy_logs(order_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_time    ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level   ON system_logs(level, timestamp DESC);
