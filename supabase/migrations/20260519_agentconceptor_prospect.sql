-- ══════════════════════════════════════════
-- AGENTConceptor — colonne de tracking prospect
-- ══════════════════════════════════════════

-- Ajoute une colonne pour traquer si le prospect a reçu un email AGENTConceptor
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS agentconceptor_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour accélérer la requête de sélection (WHERE agentconceptor_sent_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_prospects_agentconceptor_sent_at
  ON prospects (agentconceptor_sent_at)
  WHERE agentconceptor_sent_at IS NULL;
