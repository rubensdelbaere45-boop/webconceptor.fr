/**
 * POST /api/admin/generate-tiktok-video
 *
 * Pipeline complète :
 *   1. Génère une entreprise FICTIVE (fake-business.ts)
 *   2. Construit un script vidéo de 60 sec (video-script.ts)
 *   3. POST → short-video-maker (Railway) → renvoie videoId
 *   4. Polling 5min max sur GET /api/short-video/{id}/status
 *   5. Stocke result en table `mockup_videos`
 *   6. Notif Telegram avec URL de download
 *
 * Body optionnel :
 *   {
 *     niche?: "creation" | "transformation"  // type de scénario
 *     businessType?: "plombier" | "boulangerie" | ...
 *     seed?: string                          // idempotence (pour cron N8N)
 *   }
 *
 * ⚠️ Entreprise TOUJOURS fictive — jamais de vrai nom (risque plainte).
 * ⚠️ Narration EN (limitation Kokoro). Voir doc pour passer en FR.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard, safeFetch } from "@/lib/security";
import { generateFakeBusiness } from "@/lib/fake-business";
import { buildVideoScript } from "@/lib/video-script";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5min Vercel max

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

const SVM_BASE = process.env.SHORT_VIDEO_MAKER_URL || ""; // ex: https://svm.railway.app
const SVM_SECRET = process.env.SHORT_VIDEO_MAKER_SECRET || "";

interface SvmCreateResponse { videoId?: string; error?: string }
interface SvmStatusResponse { status?: "pending" | "processing" | "ready" | "failed"; progress?: number; error?: string }

export async function POST(req: NextRequest) {
  // Auth + rate-limit (1 vidéo / 2min — coûteux GPU)
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 120, routeKey: "tiktok-video" });
  if (guard) return guard;

  if (!SVM_BASE) {
    return NextResponse.json({
      error: "SHORT_VIDEO_MAKER_URL non configurée — déployer short-video-maker sur Railway d'abord",
    }, { status: 503 });
  }

  let body: { niche?: string; businessType?: string; seed?: string } = {};
  try { body = await req.json(); } catch { /* body optionnel */ }

  const niche = (body.niche === "transformation" ? "transformation" : "creation") as "creation" | "transformation";
  const biz = generateFakeBusiness(body.seed);
  const script = buildVideoScript(biz, niche);

  // 1) Créer la vidéo côté SVM
  let createRes: Response;
  try {
    createRes = await safeFetch(`${SVM_BASE}/api/short-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SVM_SECRET ? { Authorization: `Bearer ${SVM_SECRET}` } : {}),
      },
      body: JSON.stringify(script),
      timeoutMs: 15_000,
      maxRedirects: 2,
    });
  } catch (err) {
    return NextResponse.json({
      error: "Échec contact short-video-maker",
      detail: err instanceof Error ? err.message : "network",
    }, { status: 502 });
  }

  if (!createRes.ok) {
    return NextResponse.json({
      error: `short-video-maker a refusé : HTTP ${createRes.status}`,
    }, { status: 502 });
  }

  const created: SvmCreateResponse = await createRes.json().catch(() => ({}));
  const videoId = created.videoId;
  if (!videoId) {
    return NextResponse.json({ error: "short-video-maker n'a pas renvoyé de videoId" }, { status: 502 });
  }

  // 2) Persiste dès maintenant — on retourne au caller, le polling peut continuer
  const supabase = db();
  await supabase.from("mockup_videos").insert({
    video_id: videoId,
    business_name: biz.name,
    business_type: biz.type,
    city: biz.city,
    niche,
    status: "processing",
    download_url: null,
    posted_to_tiktok: false,
  }).select().single();

  // 3) Polling court (≤ 4 min) — si pas prêt, on rend la main et un autre cron viendra finir
  const DEADLINE = Date.now() + 240_000;
  let finalStatus: SvmStatusResponse["status"] = "processing";

  while (Date.now() < DEADLINE) {
    await new Promise((r) => setTimeout(r, 8000));
    try {
      const stRes = await safeFetch(`${SVM_BASE}/api/short-video/${videoId}/status`, {
        timeoutMs: 8000,
        headers: SVM_SECRET ? { Authorization: `Bearer ${SVM_SECRET}` } : {},
      });
      if (!stRes.ok) continue;
      const st: SvmStatusResponse = await stRes.json().catch(() => ({}));
      if (st.status === "ready" || st.status === "failed") {
        finalStatus = st.status;
        break;
      }
    } catch { /* retry au prochain tour */ }
  }

  const downloadUrl = finalStatus === "ready" ? `${SVM_BASE}/api/short-video/${videoId}` : null;

  await supabase.from("mockup_videos")
    .update({ status: finalStatus, download_url: downloadUrl })
    .eq("video_id", videoId);

  // 4) Telegram notif avec lien direct (Tom le télécharge sur iPhone → upload TikTok manuel = pas de ban)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const msg = finalStatus === "ready"
      ? `🎬 <b>Vidéo TikTok prête</b>\n\n<b>${biz.name}</b> (${biz.typeFr}, ${biz.city})\n<b>Niche :</b> ${niche}\n\n<a href="${downloadUrl}">⬇️ Télécharger MP4</a>\n\nUpload TikTok depuis iPhone aux heures d'affluence (12h, 19h, 21h Paris).`
      : `⚠️ <b>Vidéo TikTok échouée</b>\n\nID : ${videoId}\nStatut : ${finalStatus}\nVérifier les logs short-video-maker Railway.`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML", disable_web_page_preview: false }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    ok: true,
    videoId,
    business: biz,
    status: finalStatus,
    download_url: downloadUrl,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
