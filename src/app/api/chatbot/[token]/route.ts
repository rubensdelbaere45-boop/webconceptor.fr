import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   POST /api/chatbot/[token]

   Endpoint IA du widget chatbot.
   Appelé depuis le widget JS client-side
   ou depuis la page standalone /chat/[token].

   Rate limit : 30 messages/heure par IP
   pour éviter les abus OpenRouter.
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Construit le system prompt à partir des infos du client
function buildSystemPrompt(bot: {
  business_name: string;
  business_type: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  hours?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  faqs?: Array<{ q: string; a: string }>;
  welcome_message?: string | null;
}): string {
  const lines: string[] = [
    `Tu es l'assistant IA de "${bot.business_name}", une entreprise de type ${bot.business_type} en France.`,
    `Tu réponds en français, de façon concise et professionnelle (2-4 phrases max par réponse).`,
    `Tu aides les clients : informations pratiques, prise de RDV, questions sur les services/prix.`,
    `Ne mens jamais. Si tu ne sais pas, dis-le clairement et propose de contacter directement l'entreprise.`,
    `Ne donne JAMAIS de conseils médicaux, juridiques ou financiers.`,
    ``,
    `=== INFORMATIONS SUR L'ENTREPRISE ===`,
    `Nom : ${bot.business_name}`,
  ];

  if (bot.city) lines.push(`Ville : ${bot.city}`);
  if (bot.address) lines.push(`Adresse : ${bot.address}`);
  if (bot.phone) lines.push(`Téléphone : ${bot.phone}`);
  if (bot.hours) lines.push(`Horaires : ${bot.hours}`);
  if (bot.website_url) lines.push(`Site web : ${bot.website_url}`);
  if (bot.booking_url) {
    lines.push(`Lien de réservation : ${bot.booking_url}`);
    lines.push(`Si quelqu'un veut prendre RDV, donne-lui ce lien.`);
  }

  if (bot.faqs && Array.isArray(bot.faqs) && bot.faqs.length > 0) {
    lines.push(``);
    lines.push(`=== FAQ (réponses prioritaires) ===`);
    for (const faq of bot.faqs.slice(0, 15)) {
      if (faq.q && faq.a) {
        lines.push(`Q: ${faq.q}`);
        lines.push(`R: ${faq.a}`);
      }
    }
  }

  lines.push(``);
  lines.push(`Si quelqu'un te contacte en dehors des horaires, dis-lui que l'entreprise est fermée et propose de rappeler pendant les heures d'ouverture ou de laisser un message.`);
  lines.push(`Termine toujours par une question ouverte ou une offre d'aide supplémentaire.`);

  return lines.join("\n");
}

// Rate limiter simple en mémoire (reset toutes les heures)
const rateLimits = new Map<string, { count: number; reset: number }>();
const MAX_MESSAGES_PER_HOUR = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.reset) {
    rateLimits.set(ip, { count: 1, reset: now + 3600_000 });
    return true;
  }
  if (entry.count >= MAX_MESSAGES_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de messages. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  // Valider le token
  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 400 });
  }

  let body: { message?: string; history?: Message[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const userMessage = String(body.message || "").slice(0, 1000).trim();
  if (!userMessage) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const history: Message[] = Array.isArray(body.history)
    ? body.history.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 500),
      }))
    : [];

  // Lookup chatbot config
  const supabase = getSupabase();
  const { data: bot, error } = await supabase
    .from("chatbot_subscriptions")
    .select("business_name, business_type, phone, address, city, hours, booking_url, website_url, faqs, welcome_message, status, messages_count")
    .eq("token", token)
    .single();

  if (error || !bot) {
    return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });
  }
  if (bot.status !== "active") {
    return NextResponse.json(
      { reply: "Ce chatbot est temporairement indisponible. Contactez-nous directement." },
      { status: 200 }
    );
  }

  // Appel IA (OpenRouter → Claude Haiku)
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const isOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
  const apiUrl = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  const systemPrompt = buildSystemPrompt(bot);

  const messages: Message[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  let reply = "";
  try {
    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isOpenRouter ? { "HTTP-Referer": "https://klyora.fr", "X-Title": "Klyora Sites Chatbot" } : {}),
      },
      body: JSON.stringify({
        model: isOpenRouter ? "anthropic/claude-haiku-4-5" : "claude-haiku-4-5",
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!aiRes.ok) {
      throw new Error(`AI API error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    reply = (
      aiData.choices?.[0]?.message?.content ||
      aiData.content?.[0]?.text ||
      ""
    ).trim();
  } catch (err) {
    console.error("[chatbot] AI error:", err);
    reply = `Je rencontre une difficulté technique. Appelez-nous directement${bot.phone ? ` au ${bot.phone}` : ""} ou réessayez dans quelques instants.`;
  }

  // Incrément compteur (fire & forget)
  supabase
    .from("chatbot_subscriptions")
    .update({ messages_count: (bot.messages_count || 0) + 1, updated_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {});

  return NextResponse.json({ reply }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
