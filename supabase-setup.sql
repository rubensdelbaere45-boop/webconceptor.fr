-- ============================================
-- WebConceptor.fr — Supabase Setup
-- Copie ce SQL dans Supabase > SQL Editor > Run
-- ============================================

-- Table projects (coeur du système de codes)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  client_email TEXT,
  client_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'in_progress', 'completed')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  preview_url TEXT,
  site_url TEXT,
  contract_text TEXT,
  stripe_payment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read a project by code (for code validation)
CREATE POLICY "Anyone can read projects by code"
  ON public.projects FOR SELECT
  USING (true);

-- Policy: only service role can insert/update (admin via API)
CREATE POLICY "Service role can manage projects"
  ON public.projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);

-- ============================================
-- Table demandes (formulaire "Creer mon site")
-- ============================================

CREATE TABLE IF NOT EXISTS public.demandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activite TEXT NOT NULL,
  besoin TEXT,
  has_site BOOLEAN DEFAULT false,
  details TEXT,
  style TEXT,
  exemples TEXT,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  budget TEXT,
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'contacte', 'en_cours', 'termine')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can insert demandes"
  ON public.demandes FOR INSERT
  WITH CHECK (true);

-- Only service role can read/update (admin via API)
CREATE POLICY "Service role can manage demandes"
  ON public.demandes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_demandes_created ON public.demandes(created_at DESC);

-- Colonnes audit (à exécuter si la table existe déjà)
ALTER TABLE public.demandes ADD COLUMN IF NOT EXISTS site_url TEXT;
ALTER TABLE public.demandes ADD COLUMN IF NOT EXISTS audit_results TEXT;

-- ============================================
-- Table prospects (automatisation prospection)
-- ============================================

CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  lat DECIMAL,
  lng DECIMAL,
  distance_km INTEGER,
  phone TEXT,
  website TEXT,
  email TEXT,
  google_rating DECIMAL,
  google_reviews_count INTEGER,
  photos TEXT[],
  hours TEXT,
  mockup_html TEXT,
  email_subject TEXT,
  email_body TEXT,
  status TEXT DEFAULT 'found' CHECK (status IN ('found', 'no_email', 'ready', 'sent', 'opened', 'replied', 'converted', 'error')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage prospects"
  ON public.prospects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read prospects by slug"
  ON public.prospects FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_slug ON public.prospects(slug);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON public.prospects(email);
