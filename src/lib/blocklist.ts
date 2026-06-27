/**
 * Helpers pour la blocklist domaines.
 *
 * - normalizeDomain : aligne la normalisation côté JS sur celle du SQL
 *   (function normalize_domain dans migrations/blocked-domains.sql).
 * - isDomainBlocked : check rapide via index PK.
 * - addToBlocklist  : upsert idempotent.
 *
 * Le trigger Postgres `prevent_blocked_domain_insert` reste l'autorité
 * finale : ces helpers évitent juste un round-trip + une exception SQL
 * dans les chemins chauds.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/:[0-9]+$/, "");
  return d || null;
}

export async function isDomainBlocked(
  supabase: SupabaseClient,
  domain: string | null | undefined
): Promise<boolean> {
  const d = normalizeDomain(domain);
  if (!d) return false;
  const { data } = await supabase
    .from("blocked_domains")
    .select("domain")
    .eq("domain", d)
    .maybeSingle();
  return !!data;
}

export async function addToBlocklist(
  supabase: SupabaseClient,
  opts: {
    domain: string;
    reason?: "opt_out_email" | "legal_request" | "manual";
    contactEmail?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }
): Promise<{ ok: boolean; domain: string | null; error?: string }> {
  const d = normalizeDomain(opts.domain);
  if (!d) return { ok: false, domain: null, error: "domain_invalid" };
  const { error } = await supabase
    .from("blocked_domains")
    .upsert({
      domain: d,
      reason: opts.reason || "manual",
      contact_email: opts.contactEmail || null,
      ip: opts.ip || null,
      user_agent: opts.userAgent ? opts.userAgent.slice(0, 500) : null,
    }, { onConflict: "domain" });
  if (error) return { ok: false, domain: d, error: error.message };
  return { ok: true, domain: d };
}
