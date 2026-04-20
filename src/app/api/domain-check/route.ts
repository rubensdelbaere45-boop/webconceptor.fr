import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════
   TLD base prices (EUR TTC, from IONOS tariffs)
   These are what IONOS charges us. We apply 15% margin on top.
   ══════════════════════════════════════════ */

const TLD_BASE_PRICES: Record<string, number> = {
  "fr": 9.0,
  "com": 13.0,
  "eu": 10.0,
  "net": 16.0,
  "org": 14.0,
  "info": 20.0,
  "shop": 35.0,
  "store": 60.0,
  "bio": 45.0,
};

const MARGIN_MULTIPLIER = 1.15; // +15% margin

/* ══════════════════════════════════════════
   RDAP availability check (free, no auth)
   ══════════════════════════════════════════ */

const RDAP_ENDPOINTS: Record<string, string> = {
  "fr": "https://rdap.nic.fr/domain/",
  "com": "https://rdap.verisign.com/com/v1/domain/",
  "net": "https://rdap.verisign.com/net/v1/domain/",
  "org": "https://rdap.publicinterestregistry.org/rdap/domain/",
  "eu": "https://rdap.eu.org/domain/",
  "info": "https://rdap.afilias.net/rdap/info/domain/",
  "shop": "https://rdap.nic.shop/domain/",
  "store": "https://rdap.centralnic.com/store/domain/",
  "bio": "https://rdap.nic.bio/domain/",
};

async function checkAvailability(domain: string, tld: string): Promise<boolean> {
  const endpoint = RDAP_ENDPOINTS[tld];
  if (!endpoint) return true; // Unknown TLD → assume available (let admin verify later)

  try {
    const res = await fetch(`${endpoint}${domain}.${tld}`, {
      headers: { "Accept": "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });

    // 404 = not registered = available
    // 200 = registered = not available
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    // Other statuses: fall back to unknown (assume available, admin will verify)
    return true;
  } catch {
    // Timeout or network error → assume available
    return true;
  }
}

/* ══════════════════════════════════════════
   POST handler
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const { fullDomain } = await req.json();

  if (!fullDomain || typeof fullDomain !== "string") {
    return NextResponse.json({ error: "Domaine manquant" }, { status: 400 });
  }

  // Parse "monsite.fr" into name + tld
  const cleaned = fullDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
  const parts = cleaned.split(".");

  if (parts.length < 2) {
    return NextResponse.json({ error: "Format invalide. Exemple : monsite.fr" }, { status: 400 });
  }

  const tld = parts[parts.length - 1];
  const name = parts.slice(0, -1).join(".");

  // Validate name format (letters, digits, hyphens, 2-63 chars, no leading/trailing hyphen)
  if (!/^[a-z0-9](-?[a-z0-9])+$/i.test(name) || name.length < 2 || name.length > 63) {
    return NextResponse.json({
      error: "Nom de domaine invalide. Lettres/chiffres uniquement, 2 a 63 caracteres.",
    }, { status: 400 });
  }

  const basePrice = TLD_BASE_PRICES[tld];
  if (!basePrice) {
    return NextResponse.json({
      error: `Extension .${tld} non supportee. Extensions disponibles : ${Object.keys(TLD_BASE_PRICES).map(t => "." + t).join(", ")}`,
    }, { status: 400 });
  }

  const available = await checkAvailability(name, tld);

  const finalPrice = Math.round(basePrice * MARGIN_MULTIPLIER * 100) / 100;
  const finalPriceCents = Math.round(finalPrice * 100);

  return NextResponse.json({
    domain: `${name}.${tld}`,
    tld,
    available,
    price: finalPrice,
    priceCents: finalPriceCents,
    currency: "EUR",
    duration: "1 an",
  });
}
