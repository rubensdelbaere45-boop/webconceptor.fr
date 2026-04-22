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

-- Only service role (used by our API) can manage projects.
-- Anon/authed users have NO direct access — all reads go through our
-- /api/projects?code=XXX endpoint which uses the service role key.
-- This prevents the anon key from exposing client_email, contract_text,
-- stripe_payment_link, buyer_info if it ever leaks.
DROP POLICY IF EXISTS "Anyone can read projects by code" ON public.projects;
DROP POLICY IF EXISTS "Service role can manage projects" ON public.projects;
CREATE POLICY "Service role only"
  ON public.projects FOR ALL
  TO service_role
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

-- Only service role (our API) can read/write demandes. The public form
-- posts to /api/demandes which uses the service role key — no direct DB
-- access from the browser. This protects PII (email, telephone, details).
DROP POLICY IF EXISTS "Anyone can insert demandes" ON public.demandes;
DROP POLICY IF EXISTS "Service role can manage demandes" ON public.demandes;
CREATE POLICY "Service role only demandes"
  ON public.demandes FOR ALL
  TO service_role
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

-- Only service role (our API) can manage prospects.
-- Mockups at /prospects/[slug] are served via our API using service role key,
-- so direct DB SELECT is not needed. Keeping this locked protects prospect
-- emails + phone numbers (PII) from leaking if anon key is exposed.
DROP POLICY IF EXISTS "Service role can manage prospects" ON public.prospects;
DROP POLICY IF EXISTS "Anyone can read prospects by slug" ON public.prospects;
CREATE POLICY "Service role only prospects"
  ON public.prospects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_slug ON public.prospects(slug);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON public.prospects(email);

-- Migration: add business_type + menu_items + project_code columns
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'epicerie';
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS menu_items JSONB;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS project_code VARCHAR(6);
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS sms_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS reviews JSONB;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS about_scraped TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS website_photos TEXT[];
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS site_quality TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS site_audit_score INTEGER;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS site_audit_issues TEXT[];
-- Compteur de SMS démo déjà envoyés pour ce prospect (cap à 3 pour protéger le budget Brevo)
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS demo_sms_count INTEGER NOT NULL DEFAULT 0;
-- Emails additionnels trouvés sur le site (mail perso patron, nominatif pro, etc.)
-- On envoie un mail à TOUS ces emails en parallèle pour maximiser les chances
-- que le vrai décideur lise le pitch.
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS additional_emails TEXT[];
-- Horodatage de la relance email (J+2 après ouverture maquette)
-- Idempotence : 1 seule relance par prospect.
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_prospects_email_reminder ON public.prospects(email_reminder_sent_at);

-- Compteur d'ouvertures de maquette par un humain.
-- Permet de détecter les ULTRA HOT LEADS (vue 2+ fois sans achat = très intéressé).
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_prospects_view_count ON public.prospects(view_count);

-- Horodatage du SMS ultra-hot lead (1 seul par prospect, éviter le spam).
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS hot_sms_sent_at TIMESTAMPTZ;

-- Horodatage de l'ouverture du modal d'achat (cart abandon tracking).
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS cart_opened_at TIMESTAMPTZ;

-- Horodatage de l'email de relance panier abandonné (idempotent).
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS cart_relance_sent_at TIMESTAMPTZ;
-- ADN visuel du site actuel (couleurs dominantes, polices, mots-clés ambiance)
-- → permet à Claude de générer une maquette qui MATCHE l'univers du prospect
-- au lieu de proposer un style opposé qui le fait fuir.
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS site_style_dna JSONB;
CREATE INDEX IF NOT EXISTS idx_prospects_site_quality ON public.prospects(site_quality);
CREATE INDEX IF NOT EXISTS idx_prospects_business_type ON public.prospects(business_type);
CREATE INDEX IF NOT EXISTS idx_prospects_project_code ON public.prospects(project_code);
CREATE INDEX IF NOT EXISTS idx_prospects_sms_reminder ON public.prospects(sms_reminder_sent_at);

-- ============================================
-- Table bookings (réservations via maquettes restaurant)
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_slug TEXT,
  prospect_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2 CHECK (guests > 0 AND guests <= 20),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_bookings_prospect ON public.bookings(prospect_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);
