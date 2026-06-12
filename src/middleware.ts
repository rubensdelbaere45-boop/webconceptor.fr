import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ══════════════════════════════════════════
   Security headers — defense in depth
   Applied to all routes (pages + API) via middleware.
   ══════════════════════════════════════════ */

// Build CSP once (avoid rebuilding per request)
// unsafe-inline/eval required by Next.js dev + some Stripe/fonts.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Scripts : self + Stripe + Google Fonts. `unsafe-inline` needed by Next 16 runtime.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
  // Styles : self + inline (Tailwind/Framer) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images : self, data URIs, Unsplash, Google Places proxy (served from self)
  "img-src 'self' data: blob: https://images.unsplash.com https://*.googleapis.com https://*.gstatic.com https://*.supabase.co",
  // Frames : Stripe Checkout + ability to embed prospect preview in our own iframe
  "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.stripe.com",
  // Connect (XHR/fetch) : self + Supabase + Stripe + Brevo + Telegram
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://api.brevo.com https://api.telegram.org https://places.googleapis.com https://www.googleapis.com https://cloudflare-dns.com",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Global security headers
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");

  // HSTS : only on prod (klyora.fr)
  const host = req.headers.get("host") || "";
  if (host.endsWith("klyora.fr")) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // Prospect mockups need to render in the /code checkout iframe (same origin = fine).
  // Other pages must never be framed (clickjacking).
  if (pathname.startsWith("/prospects/")) {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    res.headers.set("X-Frame-Options", "DENY");
  }

  // CSP : apply to pages only, not API routes (API returns JSON/HTML mockup)
  // Mockup HTML at /prospects/[slug] has its own content — skip CSP to let it render freely.
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/prospects/")) {
    res.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  }

  return res;
}

export const config = {
  // Run on everything except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos|fonts).*)"],
};
