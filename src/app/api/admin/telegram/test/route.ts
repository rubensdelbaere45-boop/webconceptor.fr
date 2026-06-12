// POST /api/admin/telegram/test — message test sur Telegram
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ error: "Telegram non configuré" }, { status: 503 });

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "✅ Test Klyora Sites Admin — Connexion OK",
      parse_mode: "HTML",
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return NextResponse.json({ error: `Telegram HTTP ${res.status}: ${t.slice(0, 100)}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
