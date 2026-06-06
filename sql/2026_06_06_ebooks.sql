-- Migration : table ebooks pour le pipeline KDP
-- À exécuter dans Supabase SQL editor.

create table if not exists ebooks (
  id                       uuid primary key default gen_random_uuid(),
  title                    text not null,
  subtitle                 text,
  author_pseudo            text,
  niche_topic              text,
  niche_angle              text,     -- "histoire" | "actualite"
  niche_audience           text,
  niche_keywords           text[],
  description              text,     -- description longue interne (PDF)
  kdp_description          text,     -- description Amazon (≤ 4000 chars)
  kdp_categories           text[],   -- 3 chaînes hiérarchiques
  kdp_keywords             text[],   -- 7 mots-clés
  kdp_price_eur            numeric(5,2),
  kdp_royalty_percent      integer,
  chapter_count            integer,
  total_words              integer,
  estimated_pages          integer,
  status                   text not null default 'writing', -- writing | ready | email_failed | failed
  pdf_url                  text,
  cover_url                text,
  cover_source             text,     -- pollinations | dall-e | fallback-svg
  sent_to_email            text,
  sent_at                  timestamptz,
  published_on_kdp         boolean not null default false,
  published_at             timestamptz,
  amazon_asin              text,     -- rempli manuellement après publication
  total_sales              integer not null default 0,  -- enrichi manuellement
  total_revenue_eur        numeric(8,2) not null default 0,
  generation_ms            integer,
  created_at               timestamptz not null default now()
);

create index if not exists ebooks_status_idx on ebooks(status);
create index if not exists ebooks_published_idx on ebooks(published_on_kdp);
create index if not exists ebooks_created_idx on ebooks(created_at desc);

-- RLS service_role only
alter table ebooks enable row level security;

-- Storage bucket "ebooks" (à créer manuellement aussi dans Supabase > Storage)
-- Tom : Va dans Supabase > Storage > New bucket > nom "ebooks" > public read
