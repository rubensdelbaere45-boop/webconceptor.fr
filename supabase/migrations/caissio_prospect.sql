-- ══════════════════════════════════════════════════════════════════
-- Caissio — tracking campagne prospection
-- Ajoute une colonne pour traquer si un prospect a reçu un email Caissio
-- ▶ Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS caissio_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour accélérer la sélection (WHERE caissio_sent_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_prospects_caissio_sent_at
  ON prospects (caissio_sent_at)
  WHERE caissio_sent_at IS NULL;

-- Commentaire
COMMENT ON COLUMN prospects.caissio_sent_at IS
  'Date du dernier email Caissio envoyé à ce prospect. NULL = pas encore contacté.';
