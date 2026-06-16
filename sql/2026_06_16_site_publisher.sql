-- ════════════════════════════════════════════════════════════════════
-- Site Publisher : colonnes de traçage du pipeline publication auto
-- ════════════════════════════════════════════════════════════════════
-- Chaque étape (achat domaine IONOS, deploy Vercel, pointage DNS, SSL)
-- est tracée pour pouvoir reprendre un déploiement bloqué + diagnostiquer
-- les échecs depuis l'admin.
-- ════════════════════════════════════════════════════════════════════

alter table prospects
  add column if not exists publish_domain                text,
  add column if not exists publish_buy_at                timestamptz,
  add column if not exists publish_buy_ok                boolean,
  add column if not exists publish_vercel_project_id     text,
  add column if not exists publish_vercel_url            text,
  add column if not exists publish_deploy_at             timestamptz,
  add column if not exists publish_deploy_ok             boolean,
  add column if not exists publish_dns_at                timestamptz,
  add column if not exists publish_dns_ok                boolean,
  add column if not exists publish_url                   text,
  add column if not exists publish_pending               boolean default false,
  add column if not exists publish_live_at               timestamptz;

create index if not exists prospects_publish_pending_idx
  on prospects(publish_pending)
  where publish_pending = true;
