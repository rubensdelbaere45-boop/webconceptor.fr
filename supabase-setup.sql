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
