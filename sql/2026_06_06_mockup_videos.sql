-- Migration : table de stockage des vidéos TikTok générées
-- À exécuter dans Supabase SQL editor.

create table if not exists mockup_videos (
  id              uuid primary key default gen_random_uuid(),
  video_id        text not null unique,           -- id renvoyé par short-video-maker
  business_name   text not null,                  -- entreprise FICTIVE inventée
  business_type   text,                           -- "plombier" | "boulangerie" | ...
  city            text,
  niche           text,                           -- "creation" | "transformation"
  status          text not null default 'processing', -- processing | ready | failed
  download_url    text,                           -- URL MP4 sur le service SVM
  posted_to_tiktok boolean not null default false,
  posted_at       timestamptz,
  views           integer,                        -- à enrichir manuellement / via N8N
  created_at      timestamptz not null default now()
);

create index if not exists mockup_videos_status_idx on mockup_videos(status);
create index if not exists mockup_videos_posted_idx on mockup_videos(posted_to_tiktok);
create index if not exists mockup_videos_created_idx on mockup_videos(created_at desc);

-- RLS : seulement service_role peut lire/écrire (pas exposé au public)
alter table mockup_videos enable row level security;
