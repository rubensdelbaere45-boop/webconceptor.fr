import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════
   GET /api/prospect/photo?ref=places/XXX/photos/YYY
   Proxie une photo Google Places sans exposer la cle API.
   Cache 24h cote CDN.
   ══════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");

  // Validate format : doit commencer par "places/" et contenir "/photos/"
  // Empeche d'utiliser ce proxy pour appeler d'autres endpoints Google
  if (!ref || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref) || ref.length > 200) {
    return new NextResponse("Invalid reference", { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!googleKey) {
    return new NextResponse("Photo service unavailable", { status: 503 });
  }

  try {
    const url = `https://places.googleapis.com/v1/${ref}/media?key=${googleKey}&maxWidthPx=1200`;
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new NextResponse("Photo not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Photo error", { status: 502 });
  }
}
