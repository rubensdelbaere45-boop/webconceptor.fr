import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche le clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Empêche le sniffing MIME
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Contrôle le referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive les DNS prefetch intempestifs
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS (uniquement activé en production — Vercel l'ajoute aussi)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Permissions policy : désactive ce qui n'est pas nécessaire
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // CSP : stricte pour Caissio (ajuster selon besoins futurs)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Fonts & styles Google
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Images : unsplash CDN + self
      "img-src 'self' data: https://images.unsplash.com",
      // Scripts : self + inline (requis pour Next.js)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Connect : self + Stripe
      "connect-src 'self' https://api.stripe.com",
      // Frames Stripe (checkout)
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Workers pour le service worker
      "worker-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "**.gstatic.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        // Applique les headers à toutes les routes Caissio
        source: "/caissio/:path*",
        headers: securityHeaders,
      },
      {
        // Headers spécifiques pour le service worker (cache control)
        source: "/caissio-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/caissio/" },
        ],
      },
    ];
  },
};

export default nextConfig;
