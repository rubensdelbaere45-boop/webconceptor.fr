/* ══════════════════════════════════════════
   Vérification MX DNS d'un email
   → s'assure que le domaine de l'email accepte bien des mails (record MX).
   Réduit drastiquement le hard bounce rate (8,6% actuellement).

   Utilise Cloudflare DNS-over-HTTPS (gratuit, rapide, pas de clé).
   Cache local de 1h pour éviter de re-query les mêmes domaines.
   ══════════════════════════════════════════ */

const mxCache = new Map<string, { ok: boolean; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1h

/**
 * Vérifie qu'un email a un domaine avec un record MX valide.
 * Retourne true si OK, false si invalide / domaine sans MX.
 * En cas d'erreur réseau → retourne TRUE (doute bénéficie à l'email).
 */
export async function checkEmailMx(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop()?.toLowerCase().trim();
  if (!domain || !domain.includes(".")) return false;

  // Whitelist des domaines ultra-connus (gmail, outlook, etc.) → skip check
  const TRUSTED = new Set([
    "gmail.com", "googlemail.com",
    "outlook.com", "outlook.fr", "hotmail.com", "hotmail.fr", "live.com", "live.fr", "msn.com",
    "yahoo.com", "yahoo.fr",
    "orange.fr", "wanadoo.fr", "free.fr", "laposte.net", "sfr.fr",
    "icloud.com", "me.com", "mac.com",
    "proton.me", "protonmail.com",
  ]);
  if (TRUSTED.has(domain)) return true;

  // Cache local (1h)
  const cached = mxCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: { "Accept": "application/dns-json" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) {
      // Erreur réseau → on assume OK (ne bloque pas un email potentiellement valide)
      mxCache.set(domain, { ok: true, expiresAt: Date.now() + CACHE_TTL });
      return true;
    }
    const data = await res.json();
    // Status 3 = NXDOMAIN (domaine n'existe pas)
    if (data.Status === 3) {
      mxCache.set(domain, { ok: false, expiresAt: Date.now() + CACHE_TTL });
      return false;
    }
    const hasMx = Array.isArray(data.Answer) && data.Answer.length > 0;
    mxCache.set(domain, { ok: hasMx, expiresAt: Date.now() + CACHE_TTL });
    return hasMx;
  } catch {
    // Timeout / erreur → assume OK (ne bloque pas)
    return true;
  }
}
