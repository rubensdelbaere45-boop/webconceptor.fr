-- ============================================================
-- Blocklist domaines — protection RGPD / opt-out / mises en demeure
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Table blocked_domains
CREATE TABLE IF NOT EXISTS blocked_domains (
  domain         text PRIMARY KEY,           -- domaine normalisé (sans www, sans https://, lowercase)
  blocked_at     timestamptz NOT NULL DEFAULT now(),
  reason         text,                       -- "opt_out_email" | "legal_request" | "manual"
  contact_email  text,                       -- email du gérant qui a demandé la suppression
  ip             text,                       -- IP de la demande (audit)
  user_agent     text                        -- UA de la demande (audit)
);

CREATE INDEX IF NOT EXISTS idx_blocked_domains_email ON blocked_domains(contact_email);
CREATE INDEX IF NOT EXISTS idx_blocked_domains_at    ON blocked_domains(blocked_at DESC);

-- 2. Helper function — normalise un domaine (strip protocol, www, trailing slash)
CREATE OR REPLACE FUNCTION normalize_domain(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  d text;
BEGIN
  IF input IS NULL OR length(trim(input)) = 0 THEN RETURN NULL; END IF;
  d := lower(trim(input));
  d := regexp_replace(d, '^https?://', '');
  d := regexp_replace(d, '^www\.', '');
  d := regexp_replace(d, '/.*$', '');
  d := regexp_replace(d, ':[0-9]+$', '');
  RETURN d;
END;
$$;

-- 3. Trigger — bloque tout INSERT prospect dont le website matche un domaine blacklisté.
--    Defense-in-depth : même si un endpoint oublie de check, la DB refuse.
CREATE OR REPLACE FUNCTION prevent_blocked_domain_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  d text;
BEGIN
  d := normalize_domain(NEW.website);
  IF d IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM blocked_domains WHERE domain = d) THEN
    RAISE EXCEPTION 'Domain % is blocklisted (opt-out requested)', d
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_blocked_domain ON prospects;
CREATE TRIGGER trg_prevent_blocked_domain
  BEFORE INSERT OR UPDATE OF website ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION prevent_blocked_domain_insert();

-- 4. Vue d'audit — pour suivi rapide
CREATE OR REPLACE VIEW v_blocked_domains_recent AS
SELECT domain, blocked_at, reason, contact_email
FROM blocked_domains
ORDER BY blocked_at DESC
LIMIT 100;
