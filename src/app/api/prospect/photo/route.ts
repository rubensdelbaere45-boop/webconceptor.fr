import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════
   GET /api/prospect/photo?ref=places/XXX/photos/YYY
   Proxie une photo Google Places sans exposer la clé API.
   Cache 24h côté CDN.
   Si Google échoue → redirect vers une image Unsplash cohérente,
   pour que le navigateur ait TOUJOURS quelque chose à afficher.
   ══════════════════════════════════════════ */

// Images Unsplash fallback (restaurant / food / ambiance) — testées stables
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80&auto=format&fit=crop",
];

// Hash simple pour choisir un fallback déterministe par ref
function pickFallback(ref: string): string {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = (h * 31 + ref.charCodeAt(i)) & 0x7fffffff;
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
}

function redirectToFallback(ref: string) {
  // 302 redirect — le navigateur suit, charge l'image Unsplash, plus jamais de broken image
  return NextResponse.redirect(pickFallback(ref), {
    status: 302,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");

  // Validate format : doit commencer par "places/" et contenir "/photos/"
  // Empêche d'utiliser ce proxy pour appeler d'autres endpoints Google
  if (!ref || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref) || ref.length > 200) {
    return new NextResponse("Invalid reference", { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!googleKey) {
    return redirectToFallback(ref);
  }

  try {
    const url = `https://places.googleapis.com/v1/${ref}/media?key=${googleKey}&maxWidthPx=1200`;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    // Si Google refuse / ne trouve pas → fallback Unsplash au lieu d'une erreur
    if (!res.ok) {
      return redirectToFallback(ref);
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return redirectToFallback(ref);
    }
    // Cap à 5 MB
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return redirectToFallback(ref);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return redirectToFallback(ref);
  }
}
