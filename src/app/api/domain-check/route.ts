import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════
   TLD base prices (EUR TTC, from IONOS tariffs)
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

const MARGIN_MULTIPLIER = 1.15;

/* ══════════════════════════════════════════
   DNS-over-HTTPS check (Cloudflare) — most reliable
   ══════════════════════════════════════════ */

interface DohResponse {
  Status: number;
  Answer?: Array<{ data: string }>;
  Authority?: Array<{ data: string }>;
}

async function dnsCheck(domain: string): Promise<"registered" | "available" | "unknown"> {
  try {
    // Try NS records first (registered domains almost always have NS)
    const nsRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`,
      { headers: { "Accept": "application/dns-json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!nsRes.ok) return "unknown";
    const nsData: DohResponse = await nsRes.json();

    // Status 3 = NXDOMAIN = domain doesn't exist at DNS root
    if (nsData.Status === 3) return "available";

    // If we have NS answers, domain is registered
    if (nsData.Answer && nsData.Answer.length > 0) return "registered";

    // Check SOA as fallback
    const soaRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=SOA`,
      { headers: { "Accept": "application/dns-json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!soaRes.ok) return "unknown";
    const soaData: DohResponse = await soaRes.json();

    if (soaData.Status === 3) return "available";
    if (soaData.Answer && soaData.Answer.length > 0) return "registered";
    if (soaData.Authority && soaData.Authority.length > 0) return "registered";

    return "unknown";
  } catch {
    return "unknown";
  }
}

/* ══════════════════════════════════════════
   RDAP fallback (more precise for edge cases)
   ══════════════════════════════════════════ */

const RDAP_ENDPOINTS: Record<string, string> = {
  "fr": "https://rdap.nic.fr/domain/",
  "com": "https://rdap.verisign.com/com/v1/domain/",
  "net": "https://rdap.verisign.com/net/v1/domain/",
  "org": "https://rdap.publicinterestregistry.org/rdap/domain/",
  "eu": "https://rdap.eu.org/domain/",
  "info": "https://rdap.afilias.net/rdap/info/domain/",
};

async function rdapCheck(domain: string, tld: string): Promise<"registered" | "available" | "unknown"> {
  const endpoint = RDAP_ENDPOINTS[tld];
  if (!endpoint) return "unknown";
  try {
    const res = await fetch(`${endpoint}${domain}`, {
      headers: { "Accept": "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return "available";
    if (res.status === 200) {
      // Parse response to be sure it's not a "reserved" or proxy domain
      try {
        const data = await res.json();
        if (data && (data.ldhName || data.handle || data.events)) return "registered";
      } catch { /* ignore */ }
      return "registered";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/* ══════════════════════════════════════════
   Combined check: DNS first, RDAP confirmation
   ══════════════════════════════════════════ */

async function checkAvailability(name: string, tld: string): Promise<boolean> {
  const fullDomain = `${name}.${tld}`;

  // Primary : DNS
  const dns = await dnsCheck(fullDomain);
  if (dns === "registered") return false;
  if (dns === "available") {
    // Double-check via RDAP if possible (domains can be registered without NS)
    const rdap = await rdapCheck(name, tld);
    if (rdap === "registered") return false;
    return true;
  }

  // DNS unknown : try RDAP
  const rdap = await rdapCheck(name, tld);
  if (rdap === "registered") return false;
  if (rdap === "available") return true;

  // Both unknown : default to "registered" to avoid false "available"
  // (admin will verify manually before buying)
  return false;
}

/* ══════════════════════════════════════════
   POST handler
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const { fullDomain } = await req.json();

  if (!fullDomain || typeof fullDomain !== "string") {
    return NextResponse.json({ error: "Domaine manquant" }, { status: 400 });
  }

  const cleaned = fullDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
  const parts = cleaned.split(".");

  if (parts.length < 2) {
    return NextResponse.json({ error: "Format invalide. Exemple : monsite.fr" }, { status: 400 });
  }

  const tld = parts[parts.length - 1];
  const name = parts.slice(0, -1).join(".");

  if (!/^[a-z0-9](-?[a-z0-9])+$/i.test(name) || name.length < 2 || name.length > 63) {
    return NextResponse.json({
      error: "Nom de domaine invalide. Lettres/chiffres uniquement, 2 a 63 caracteres.",
    }, { status: 400 });
  }

  const basePrice = TLD_BASE_PRICES[tld];
  if (!basePrice) {
    return NextResponse.json({
      error: `Extension .${tld} non supportee. Disponibles : ${Object.keys(TLD_BASE_PRICES).map(t => "." + t).join(", ")}`,
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
