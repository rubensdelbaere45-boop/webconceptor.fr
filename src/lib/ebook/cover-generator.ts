/**
 * Génère la couverture e-book.
 *
 * Cascade GRATUITE → premium :
 *   1. Pollinations.ai (FLUX hébergé, 100% gratuit, sans clé)
 *      → https://image.pollinations.ai/prompt/...
 *   2. OpenAI DALL-E 3 (si OPENAI_API_KEY)
 *   3. Fallback : SVG vectoriel avec dégradé + titre
 *
 * Format Amazon KDP : portrait 2:3 (idéal 1024x1536 ou 1024x1792)
 */

export interface CoverResult {
  buffer: Buffer;
  source: "pollinations" | "dall-e" | "fallback-svg";
  mimeType: string;
  ext: "png" | "jpg" | "svg";
}

export async function generateCover(
  coverPrompt: string,
  title: string,
  subtitle: string,
  author: string,
): Promise<CoverResult> {
  // 1) Pollinations — gratuit, sans clé
  try {
    const buf = await generatePollinationsCover(coverPrompt);
    if (buf && buf.length > 5000) return { buffer: buf, source: "pollinations", mimeType: "image/jpeg", ext: "jpg" };
  } catch { /* fall through */ }

  // 2) DALL-E si clé dispo
  if (process.env.OPENAI_API_KEY) {
    try {
      const buf = await generateDalleCover(coverPrompt);
      if (buf) return { buffer: buf, source: "dall-e", mimeType: "image/png", ext: "png" };
    } catch { /* fall through */ }
  }

  // 3) Fallback SVG
  return {
    buffer: generateFallbackCover(title, subtitle, author),
    source: "fallback-svg",
    mimeType: "image/svg+xml",
    ext: "svg",
  };
}

/* ── Pollinations.ai (gratuit, sans clé) ────────────── */

async function generatePollinationsCover(prompt: string): Promise<Buffer | null> {
  // Force "no text" + ratio 2:3 portrait
  const fullPrompt = `${prompt}, no text, no letters, no words, vertical portrait 2:3 ratio, high quality book cover`;
  const enc = encodeURIComponent(fullPrompt.slice(0, 800));
  // width/height 1024x1536 = ratio 2:3 idéal KDP
  // model=flux par défaut, nologo=true pour pas de watermark
  const url = `https://image.pollinations.ai/prompt/${enc}?width=1024&height=1536&model=flux&nologo=true&enhance=true`;

  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) return null;
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

/* ── DALL-E 3 (optionnel, payant) ───────────────────── */

async function generateDalleCover(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const fullPrompt = `${prompt}. No text, no letters, no words. Vertical portrait orientation.`;
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt.slice(0, 4000),
      n: 1,
      size: "1024x1792",
      quality: "standard",
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  return b64 ? Buffer.from(b64, "base64") : null;
}

/* ── Fallback SVG ───────────────────────────────────── */

function generateFallbackCover(title: string, subtitle: string, author: string): Buffer {
  const safe = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const colors = pickColorScheme(title);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" width="1024" height="1536">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="100%" stop-color="${colors[1]}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1536" fill="url(#g)"/>
  <rect x="60" y="60" width="904" height="1416" fill="none" stroke="#ffffff44" stroke-width="2"/>
  <text x="512" y="540" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="68" font-weight="bold">${safe(title.slice(0, 30))}</text>
  <text x="512" y="780" text-anchor="middle" fill="#ffffffcc" font-family="Georgia, serif" font-size="32" font-style="italic">${safe(subtitle.slice(0, 40))}</text>
  <text x="512" y="1420" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="28">${safe(author)}</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

function pickColorScheme(seed: string): [string, string] {
  const schemes: Array<[string, string]> = [
    ["#1e3a8a", "#7c3aed"], ["#0f766e", "#10b981"], ["#b91c1c", "#ea580c"],
    ["#581c87", "#db2777"], ["#1e293b", "#475569"], ["#7c2d12", "#a16207"],
  ];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return schemes[Math.abs(h) % schemes.length];
}
