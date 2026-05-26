import { NextRequest, NextResponse } from "next/server";

/* ── QR Code — redirige vers l'image générée par qrserver.com ────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const size = searchParams.get("size") || "400x400";

  if (!slug) {
    return NextResponse.json({ error: "slug manquant" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
  const menuUrl = `${baseUrl}/restaurant/${slug}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(menuUrl)}&margin=10&qzone=1&color=1a1310`;

  /* Proxy l'image PNG pour éviter les requêtes CORS côté client */
  const res = await fetch(qrUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur génération QR" }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qrcode-tableflow-${slug}.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
