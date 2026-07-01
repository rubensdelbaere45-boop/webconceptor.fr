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

// Constant-time string compare (edge-safe, no node:crypto)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// /admin (dashboard) + /api/admin : Basic auth (mot de passe = ADMIN_SECRET_KEY)
// ou header x-admin-key. Le navigateur rejoue le Basic sur les fetch same-origin,
// donc le dashboard continue d'appeler ses APIs sans modification.
function isAdminAuthorized(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY || "";
  if (!adminKey) return false;
  const xKey = req.headers.get("x-admin-key") || "";
  if (xKey && timingSafeEqual(xKey, adminKey)) return true;
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (timingSafeEqual(pass, adminKey)) return true;
    } catch { /* base64 invalide */ }
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdminAuthorized(req)) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Non autorisé" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return new NextResponse("Authentification requise", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Klyora Admin"' },
      });
    }
  }

  const res = NextResponse.next();

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
