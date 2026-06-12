-- ════════════════════════════════════════════════════════════════════
-- Migration : pivot marque WebConceptor → Klyora
-- ════════════════════════════════════════════════════════════════════
-- Ajoute la colonne migration_notified_at pour tracer les prospects
-- qui ont reçu le mail "votre maquette change d'adresse" envoyé par
-- /api/admin/notify-domain-migration.
-- ════════════════════════════════════════════════════════════════════

alter table prospects
  add column if not exists migration_notified_at timestamptz;

create index if not exists prospects_migration_notified_at_idx
  on prospects(migration_notified_at)
  where migration_notified_at is not null;
