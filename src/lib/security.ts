/* ══════════════════════════════════════════
   Security helpers — shared across API routes
   ══════════════════════════════════════════ */

import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison. Always runs through the full buffer length
 * so attacker can't infer the secret byte-by-byte from response latency.
 *
 * Returns false if either string is empty, too long (10KB cap), or differs in length.
 */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length > 10240 || b.length > 10240) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Fetch a URL while blocking SSRF via redirects.
 *
 * Problem : even if we validate the initial hostname, an attacker can put a
 * public URL that 302-redirects to http://169.254.169.254 (AWS metadata).
 * `redirect: "follow"` would blindly follow, exposing internal responses.
 *
 * Solution : set `redirect: "manual"`, inspect Location, re-check with
 * isPrivateOrUnsafeUrl(), and follow up to N hops.
 */
export async function safeFetch(
  initialUrl: string,
  init: RequestInit & { maxRedirects?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const { maxRedirects = 5, timeoutMs = 10000, ...rest } = init;

  if (isPrivateOrUnsafeUrl(initialUrl)) {
    throw new Error(`Blocked: target is private or unsafe (${initialUrl})`);
  }

  let currentUrl = initialUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(currentUrl, {
      ...rest,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Not a redirect → return as-is
    if (res.status < 300 || res.status >= 400) return res;

    const location = res.headers.get("location");
    if (!location) return res;

    // Resolve relative redirects against current URL
    const next = new URL(location, currentUrl).toString();
    if (isPrivateOrUnsafeUrl(next)) {
      throw new Error(`Blocked redirect to private/unsafe target: ${next}`);
    }
    currentUrl = next;
  }

  throw new Error(`Too many redirects (${maxRedirects}) from ${initialUrl}`);
}

/**
 * Escape a string for safe inclusion in Telegram messages with parse_mode="HTML".
 * Telegram HTML mode supports only: <b>, <i>, <u>, <s>, <a>, <code>, <pre>.
 * Everything else — including user-supplied content — MUST have &, <, > escaped.
 * https://core.telegram.org/bots/api#html-style
 */
export function escapeTelegram(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Basic HTML escape for attribute / text embedding.
 */
export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Check if a URL targets an internal / private network range.
 * Used to block SSRF on server-side fetch(userProvidedUrl).
 *
 * Blocks:
 * - localhost, 127/8, ::1
 * - RFC1918 private ranges (10/8, 172.16-31/12, 192.168/16)
 * - Link-local (169.254/16, fe80::/10) — blocks cloud metadata endpoints
 * - Carrier-grade NAT (100.64/10)
 * - Cloud metadata hostnames
 * - file://, data:, javascript:, ftp://
 */
export function isPrivateOrUnsafeUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true; // unparseable → treat as unsafe
  }

  // Only http(s) allowed
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;

  const host = url.hostname.toLowerCase();

  // Block common metadata hostnames
  if (
    host === "localhost" ||
    host === "metadata.google.internal" ||
    host === "metadata" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  // IPv6
  if (host.startsWith("[") && host.endsWith("]")) {
    const v6 = host.slice(1, -1);
    if (v6 === "::1" || v6 === "::" || v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd")) {
      return true;
    }
    return false;
  }

  // IPv4
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const o = m.slice(1).map(Number);
    if (o.some((n) => n < 0 || n > 255)) return true;
    const [a, b] = o;
    // 0.x, 10.x, 127.x
    if (a === 0 || a === 10 || a === 127) return true;
    // 169.254.x (link-local, includes AWS metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.x
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 (carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved
    if (a >= 224) return true;
    return false;
  }

  // Hostname must contain a dot (block bare "server" etc.)
  if (!host.includes(".")) return true;

  return false;
}

/* ══════════════════════════════════════════
   Rate limiter (in-memory, per IP + key)
   ══════════════════════════════════════════ */

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple sliding-window rate limit.
 * Returns { ok: false, retryAfter: seconds } when the limit is hit.
 *
 * Note : in-memory only — protects against a single misbehaving client
 * hitting one instance. Global protection would need Redis/Supabase.
 */
export function rateLimit(key: string, limit: number, windowSec: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true };
}

/**
 * Extract the client IP from a Next.js request, respecting proxy headers
 * only when they're expected (Render / Vercel forward x-forwarded-for).
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/* ══════════════════════════════════════════
   Cleanup old rate-limit buckets (prevents memory leak)
   ══════════════════════════════════════════ */

if (typeof globalThis.setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (now > v.resetAt + 60_000) buckets.delete(k);
    }
  }, 60_000).unref?.();
}
