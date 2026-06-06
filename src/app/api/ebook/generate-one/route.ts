/**
 * POST /api/ebook/generate-one
 *
 * Pipeline complet 1 e-book (≤ 5 min Vercel) :
 *   1. Découvre 6 niches (histoire/actualité) via LLM cascade gratuite
 *   2. Pick la meilleure (low competition + jamais utilisée)
 *   3. Outline + tous les champs KDP (titre, sous-titre, description 4000c,
 *      3 catégories, 7 mots-clés, prix recommandé)
 *   4. Écrit 10-12 chapitres en parallèle (concurrence 3)
 *   5. Génère cover via Pollinations.ai (gratuit) ou DALL-E ou SVG fallback
 *   6. Build PDF 6"x9" KDP-ready
 *   7. Upload Supabase storage bucket "ebooks"
 *   8. Email Tom avec PDF + cover + tous les champs KDP prêts à coller
 *
 * Auth : x-admin-key OU x-cron-secret
 * Body : { preferred_angle?: "histoire" | "actualite", niche_override?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, rateLimit, getClientIp } from "@/lib/security";
import { discoverNiches, pickBestNiche } from "@/lib/ebook/niche-discovery";
import { buildOutline, writeAllChapters } from "@/lib/ebook/content-generator";
import { generateCover } from "@/lib/ebook/cover-generator";
import { buildPdf, estimatePages } from "@/lib/ebook/pdf-builder";
import { sendEbookEmail } from "@/lib/ebook/email-sender";
import type { NicheCandidate } from "@/lib/ebook/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rl = rateLimit(`ebook-gen:${ip}`, 4, 3600);
  if (!rl.ok) return NextResponse.json({ error: "Trop de requêtes", retry_after: rl.retryAfter }, { status: 429 });

  let body: { preferred_angle?: "histoire" | "actualite"; niche_override?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const emailTo = process.env.EBOOK_EMAIL_TO || "ru.delbaere@gmail.com";
  const hasLlm = !!(process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.MISTRAL_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!hasLlm) {
    return NextResponse.json({
      error: "Aucune clé LLM configurée",
      hint: "Crée une clé GEMINI gratuite sur https://aistudio.google.com/app/apikey (30s) et set GEMINI_API_KEY sur Vercel.",
    }, { status: 503 });
  }

  const t0 = Date.now();
  const supabase = db();

  // 1) Niche
  let niche: NicheCandidate;
  if (body.niche_override) {
    niche = {
      topic: body.niche_override,
      angle: "histoire",
      rationale: "Forcé par l'admin",
      target_audience: "Auto-déterminé",
      keywords: [body.niche_override],
      estimated_competition: "low",
    };
  } else {
    const candidates = await discoverNiches(6);
    if (candidates.length === 0) return NextResponse.json({ error: "Aucune niche découverte" }, { status: 500 });
    niche = pickBestNiche(candidates, body.preferred_angle);
  }

  // 2) Outline + KDP fields
  const outline = await buildOutline(niche);

  // Insert row "processing"
  const { data: row } = await supabase
    .from("ebooks")
    .insert({
      title: outline.title,
      subtitle: outline.subtitle,
      author_pseudo: outline.author_name,
      niche_topic: niche.topic,
      niche_angle: niche.angle,
      niche_audience: niche.target_audience,
      niche_keywords: niche.keywords,
      description: outline.description,
      kdp_description: outline.kdp.description_amazon,
      kdp_categories: outline.kdp.categories.map((c) => c.path),
      kdp_keywords: outline.kdp.keywords,
      kdp_price_eur: outline.kdp.recommended_price_eur,
      kdp_royalty_percent: outline.kdp.royalty_percent,
      chapter_count: outline.chapters.length,
      status: "writing",
    })
    .select()
    .single();
  const ebookId = row?.id;

  // 3) Chapitres
  const chapters = await writeAllChapters(outline);
  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);
  const estimatedPages = estimatePages(totalWords);

  // 4) Cover
  const cover = await generateCover(outline.cover_prompt, outline.title, outline.subtitle, outline.author_name);

  // 5) PDF
  const pdfBuffer = await buildPdf({ outline, chapters });

  // 6) Upload Supabase storage
  let pdfUrl: string | null = null;
  let coverUrl: string | null = null;
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const safe = outline.title.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().slice(0, 50);
    const pdfPath = `${stamp}/${safe}-${ebookId?.slice(0, 8) || "x"}.pdf`;
    const coverPath = `${stamp}/${safe}-${ebookId?.slice(0, 8) || "x"}-cover.${cover.ext}`;

    const pdfUp = await supabase.storage.from("ebooks").upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (!pdfUp.error) pdfUrl = supabase.storage.from("ebooks").getPublicUrl(pdfPath).data.publicUrl;

    const cvUp = await supabase.storage.from("ebooks").upload(coverPath, cover.buffer, { contentType: cover.mimeType, upsert: true });
    if (!cvUp.error) coverUrl = supabase.storage.from("ebooks").getPublicUrl(coverPath).data.publicUrl;
  } catch { /* l'email aura les buffers en attachment */ }

  // 7) Email
  const emailResult = await sendEbookEmail({
    to: emailTo,
    outline,
    pdfBuffer,
    coverBuffer: cover.buffer,
    coverExt: cover.ext,
    coverMime: cover.mimeType,
    pdfUrl,
    coverUrl,
    totalWords,
    estimatedPages,
  });

  // 8) Update DB
  if (ebookId) {
    await supabase.from("ebooks").update({
      status: emailResult.ok ? "ready" : "email_failed",
      pdf_url: pdfUrl,
      cover_url: coverUrl,
      total_words: totalWords,
      estimated_pages: estimatedPages,
      cover_source: cover.source,
      sent_to_email: emailResult.ok ? emailTo : null,
      sent_at: emailResult.ok ? new Date().toISOString() : null,
      generation_ms: Date.now() - t0,
    }).eq("id", ebookId);
  }

  return NextResponse.json({
    ok: true,
    ebook_id: ebookId,
    title: outline.title,
    subtitle: outline.subtitle,
    author: outline.author_name,
    niche: niche.topic,
    angle: niche.angle,
    pages: estimatedPages,
    words: totalWords,
    price_eur: outline.kdp.recommended_price_eur,
    royalty_per_sale_eur: outline.kdp.estimated_royalty_per_sale_eur,
    email_sent: emailResult.ok,
    email_error: emailResult.error,
    cover_source: cover.source,
    pdf_url: pdfUrl,
    cover_url: coverUrl,
    generation_ms: Date.now() - t0,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
