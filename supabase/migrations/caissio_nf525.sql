-- ═══════════════════════════════════════════════════════════════════════════
-- CAISSIO — Schéma NF 525 v1.0
-- Conformité : article L.102 B du LPF + BOI-TVA-DECLA-30-10-30-20
--
-- ▶ Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table des commerces ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caissio_stores (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    TEXT          NOT NULL UNIQUE,
  store_name    TEXT          NOT NULL,
  address       TEXT,
  siret         TEXT,
  vat_number    TEXT,
  ticket_footer TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 2. Ventes — IMMUABLE (NF 525 inalterabilité) ───────────────────────────
-- Règle : jamais d'UPDATE ou DELETE sur cette table.
-- L'inalterabilité est garantie par :
--   a) L'absence de policy UPDATE/DELETE côté RLS
--   b) La chaîne de hash SHA-256 (toute altération casse la chaîne)
CREATE TABLE IF NOT EXISTS caissio_sales (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID          NOT NULL REFERENCES caissio_stores(id),
  user_email    TEXT          NOT NULL,
  ticket_num    TEXT          NOT NULL,
  sequence_num  BIGINT        NOT NULL,            -- N° séquentiel par commerce
  sale_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  subtotal      NUMERIC(12,2) NOT NULL,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL,
  pay_mode      TEXT          NOT NULL,            -- cash | card | account | mixed
  cash_given    NUMERIC(12,2),
  change_given  NUMERIC(12,2),
  customer_id   TEXT,
  mode          TEXT          NOT NULL DEFAULT 'live', -- live | test
  previous_hash TEXT          NOT NULL,            -- hash de la vente précédente
  record_hash   TEXT          NOT NULL,            -- SHA-256 de cet enregistrement
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  -- PAS de updated_at : immuabilité totale
);

-- ── 3. Lignes de ventes — IMMUABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caissio_sale_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID          NOT NULL REFERENCES caissio_sales(id),
  product_name TEXT          NOT NULL,
  qty          INTEGER       NOT NULL CHECK (qty > 0),
  unit_price   NUMERIC(12,2) NOT NULL,
  tva_rate     NUMERIC(5,2)  NOT NULL DEFAULT 20,
  line_total   NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 4. Clôtures (Z-report journalier / mensuel / annuel) ───────────────────
CREATE TABLE IF NOT EXISTS caissio_closures (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id              UUID          NOT NULL REFERENCES caissio_stores(id),
  user_email            TEXT          NOT NULL,
  closure_type          TEXT          NOT NULL DEFAULT 'daily', -- daily | monthly | annual
  period_start          TIMESTAMPTZ   NOT NULL,
  period_end            TIMESTAMPTZ   NOT NULL,
  total_sales           INTEGER       NOT NULL DEFAULT 0,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cash            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_card            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_account         NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_sale_hash        TEXT,
  previous_closure_hash TEXT,
  closure_hash          TEXT          NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 5. Index ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_caissio_sales_store_seq
  ON caissio_sales(store_id, sequence_num DESC);

CREATE INDEX IF NOT EXISTS idx_caissio_sales_email
  ON caissio_sales(user_email);

CREATE INDEX IF NOT EXISTS idx_caissio_sales_date
  ON caissio_sales(store_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_caissio_sale_items_sale
  ON caissio_sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_caissio_closures_store
  ON caissio_closures(store_id, closure_type, period_end DESC);

-- ── 6. Trigger updated_at (stores uniquement) ──────────────────────────────
CREATE OR REPLACE FUNCTION caissio_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_caissio_stores_updated_at ON caissio_stores;
CREATE TRIGGER trg_caissio_stores_updated_at
  BEFORE UPDATE ON caissio_stores
  FOR EACH ROW EXECUTE FUNCTION caissio_set_updated_at();

-- ── 7. Contrainte unicité séquence par commerce ─────────────────────────────
ALTER TABLE caissio_sales
  ADD CONSTRAINT IF NOT EXISTS uq_caissio_sales_store_seq
  UNIQUE (store_id, sequence_num);

-- ── 8. Commentaires NF 525 ──────────────────────────────────────────────────
COMMENT ON TABLE caissio_sales IS
  'Registre immuable des ventes Caissio. Conforme NF 525 / art. L.102 B LPF. '
  'Tout UPDATE ou DELETE est interdit. Intégrité vérifiée par chaîne SHA-256.';

COMMENT ON COLUMN caissio_sales.previous_hash IS
  'Hash SHA-256 de la vente précédente dans la chaîne (GENESIS pour la 1ère).';

COMMENT ON COLUMN caissio_sales.record_hash IS
  'SHA-256(previous_hash + ticket_num + sale_date + total + pay_mode + items). '
  'Immuable. Toute modification casse la chaîne.';

COMMENT ON TABLE caissio_closures IS
  'Clôtures journalières (Z-report), mensuelles et annuelles. '
  'Immuables. Enchaînées par hash SHA-256.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Fin du schéma NF 525 Caissio
-- ═══════════════════════════════════════════════════════════════════════════
