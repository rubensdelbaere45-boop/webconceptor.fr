-- ════════════════════════════════════════════════════════════════════
-- IONOS Auto-Unsubscribe : ajout colonne unsubscribe_reason
-- ════════════════════════════════════════════════════════════════════
-- Permet de tracer POURQUOI un prospect a été désabonné :
--   'auto_reply: stop'         → email réponse contenant "STOP"
--   'auto_reply: pas intéressé'
--   'manual: oneclick'         → désabonnement manuel via lien
--   'admin: spam'              → désabonnement par Tom
-- ════════════════════════════════════════════════════════════════════

alter table prospects add column if not exists unsubscribe_reason text;
create index if not exists prospects_unsubscribe_reason_idx on prospects(unsubscribe_reason) where unsubscribe_reason is not null;
