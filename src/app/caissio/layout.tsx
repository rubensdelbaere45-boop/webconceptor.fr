import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Caissio — Logiciel de caisse",
    template: "%s | Caissio",
  },
  description:
    "Logiciel de caisse moderne pour commerçants. Données locales, hors-ligne, installation en 1 clic.",
  manifest: "/caissio-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Caissio",
    startupImage: "/caissio-icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function CaissioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* PWA meta — safari/iOS */}
      <link rel="apple-touch-icon" href="/caissio-icon.svg" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Caissio" />
      <meta name="theme-color" content="#4f46e5" />

      {/* Register service worker */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/caissio-sw.js', { scope: '/caissio/' })
      .catch(function(e){ console.warn('[Caissio SW]', e); });
  });
}
`,
        }}
      />
      {children}
    </>
  );
}
