import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPrivateOrUnsafeUrl, safeCompare, safeFetch } from "@/lib/security";

/* ══════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════ */

// Aubenton coordinates (02500)
const AUBENTON_LAT = 49.836;
const AUBENTON_LNG = 4.205;
const EXCLUSION_RADIUS_KM = 350; // 4h drive

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════ */

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ══════════════════════════════════════════
   GOOGLE PLACES — search + details
   ══════════════════════════════════════════ */

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: Array<{ name: string }>;
  addressComponents?: Array<{ longText?: string; types?: string[] }>;
}

async function searchProxiStores(query: string, apiKey: string): Promise<GooglePlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.location",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.regularOpeningHours",
        "places.photos",
        "places.addressComponents",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "fr",
      regionCode: "fr",
      pageSize: 20,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Places error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.places || [];
}

function extractCityFromComponents(components?: Array<{ longText?: string; types?: string[] }>): { city: string; postalCode: string } {
  let city = "";
  let postalCode = "";
  for (const c of components || []) {
    if (c.types?.includes("locality")) city = c.longText || "";
    else if (c.types?.includes("postal_code")) postalCode = c.longText || "";
  }
  return { city, postalCode };
}

/* ══════════════════════════════════════════
   EMAIL SCRAPING — find contact emails on a website
   ══════════════════════════════════════════ */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BAD_DOMAINS = /(wix|wixstatic|sentry|example|test|placeholder|noreply|no-reply|unsubscribe|spam)/i;

async function fetchUrl(url: string, timeout = 8000): Promise<string | null> {
  try {
    // safeFetch rejects redirects that point at internal/private addresses.
    const res = await safeFetch(url, {
      timeoutMs: timeout,
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WebConceptorBot/1.0)" },
    });
    if (!res.ok) return null;
    // Cap response size to avoid a malicious site OOMing the server (10 MB max)
    const text = await res.text();
    return text.slice(0, 10 * 1024 * 1024);
  } catch {
    return null;
  }
}

async function findEmailOnWebsite(website: string): Promise<string | null> {
  try {
    // SSRF : even though URLs come from Google Places, a compromised/malicious
    // place could point websiteUri to an internal metadata endpoint.
    if (isPrivateOrUnsafeUrl(website)) return null;

    const base = new URL(website);
    const paths = ["", "/contact", "/contact-us", "/contactez-nous", "/nous-contacter", "/mentions-legales", "/legal"];

    for (const path of paths) {
      const url = base.origin + path;
      // Re-check each URL (origin could have changed) — belt and suspenders.
      if (isPrivateOrUnsafeUrl(url)) continue;
      const html = await fetchUrl(url);
      if (!html) continue;

      // Check mailto first (most reliable)
      const mailtoMatch = html.match(/mailto:([^"'\s?]+)/i);
      if (mailtoMatch && !BAD_DOMAINS.test(mailtoMatch[1])) {
        return mailtoMatch[1].toLowerCase().trim();
      }

      // Then regex for plain text
      const emails = html.match(EMAIL_REGEX) || [];
      for (const email of emails) {
        const e = email.toLowerCase();
        if (BAD_DOMAINS.test(e)) continue;
        // Prefer emails matching the domain
        if (e.endsWith("@" + base.hostname.replace(/^www\./, ""))) return e;
      }
      // Fallback: first non-bad email
      for (const email of emails) {
        const e = email.toLowerCase();
        if (!BAD_DOMAINS.test(e)) return e;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   POST — find + enrich + save
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!googleKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY manquante" }, { status: 500 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const query = typeof rawBody.query === "string" && rawBody.query.trim()
    ? rawBody.query.trim().slice(0, 200)
    : "Proxi épicerie France";

  let stats = { found: 0, inserted: 0, skippedNearby: 0, skippedDuplicate: 0, withEmail: 0 };

  try {
    const places = await searchProxiStores(query, googleKey);
    stats.found = places.length;

    const supabase = getSupabaseAdmin();

    for (const place of places) {
      if (!place.location || !place.displayName?.text) continue;

      // Filter: exclude if too close to Aubenton
      const dKm = distanceKm(AUBENTON_LAT, AUBENTON_LNG, place.location.latitude, place.location.longitude);
      if (dKm < EXCLUSION_RADIUS_KM) {
        stats.skippedNearby++;
        continue;
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from("prospects")
        .select("id")
        .eq("google_place_id", place.id)
        .maybeSingle();

      if (existing) {
        stats.skippedDuplicate++;
        continue;
      }

      const { city, postalCode } = extractCityFromComponents(place.addressComponents);
      const slug = slugify(`${place.displayName.text}-${city || "france"}-${place.id.slice(0, 8)}`);

      // Try scraping email from website (non-blocking)
      let email: string | null = null;
      if (place.websiteUri) {
        email = await findEmailOnWebsite(place.websiteUri);
        if (email) stats.withEmail++;
      }

      // Store Google photo references only (NO API key in DB) — served via /api/prospect/photo proxy
      const photos = (place.photos || [])
        .slice(0, 4)
        .map(p => p.name)
        .filter((n): n is string => typeof n === "string" && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(n));

      await supabase.from("prospects").insert({
        slug,
        google_place_id: place.id,
        name: place.displayName.text,
        address: place.formattedAddress || place.shortFormattedAddress || "",
        city,
        postal_code: postalCode,
        lat: place.location.latitude,
        lng: place.location.longitude,
        distance_km: dKm,
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
        website: place.websiteUri || "",
        email: email || null,
        google_rating: place.rating || null,
        google_reviews_count: place.userRatingCount || null,
        photos: photos.length ? photos : null,
        hours: place.regularOpeningHours?.weekdayDescriptions?.join(" | ") || "",
        status: email ? "found" : "no_email",
      });

      stats.inserted++;
    }

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: msg, stats }, { status: 500 });
  }
}
