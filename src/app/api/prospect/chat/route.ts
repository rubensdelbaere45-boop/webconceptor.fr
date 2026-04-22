import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/chat
   Chatbot IA (Claude Haiku) intégré aux maquettes prospect.
   Répond aux questions, rassure, pousse vers l'achat.
   Body : { prospect_slug, history: [{role, content}], message }
   Retourne : { reply, shouldEscalate } (escalate = demande modif complexe)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  // Rate limit : 30 messages/10min/IP (anti-abus)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`chat:${ip}`, 30, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de messages. Réessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const prospect_slug = String(body.prospect_slug || "").slice(0, 100).trim();
  const message = String(body.message || "").slice(0, 500).trim();
  // Historique limité à 6 derniers échanges pour garder le coût OpenRouter bas
  // (~0.1 centime par conversation avec Claude Haiku 4.5)
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  if (!prospect_slug || !message) {
    return NextResponse.json({ error: "Message manquant" }, { status: 400 });
  }

  // Load prospect to build the system prompt
  const supabase = getSupabaseAdmin();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("name, city, business_type, google_rating, google_reviews_count, site_quality")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (!prospect) {
    return NextResponse.json({ error: "Maquette introuvable" }, { status: 404 });
  }

  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!key) {
    return NextResponse.json({
      reply: "Désolé, je n'arrive pas à me connecter pour le moment. Vous pouvez écrire directement à Tom par email : contact@webconceptor.fr ou l'appeler au 06 35 59 24 71.",
      shouldEscalate: true,
    });
  }

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  const systemPrompt = `Tu es l'assistant IA de WebConceptor, intégré directement dans la maquette de site internet que nous avons préparée pour "${prospect.name}"${prospect.city ? ` à ${prospect.city}` : ""}.

CONTEXTE MAQUETTE :
- Établissement : ${prospect.name}
- Ville : ${prospect.city || "—"}
- Type : ${prospect.business_type || "commerce"}
- Note Google : ${prospect.google_rating ? `${prospect.google_rating}/5 (${prospect.google_reviews_count || 0} avis)` : "—"}
- Site actuel : ${prospect.site_quality === "none" ? "aucun — c'est une opportunité énorme" : prospect.site_quality === "poor" ? "ancien et non-optimisé" : prospect.site_quality === "average" ? "correct mais améliorable" : "moderne"}

TON RÔLE :
- Répondre aux questions sur la maquette et l'offre WebConceptor
- RASSURER le prospect et le pousser à cliquer sur "J'achète ce site" (bouton présent en bas de la maquette)
- Être chaleureux, professionnel, concis (3-5 phrases max par réponse)
- Parler en "vous", ton sobre et confiant
- JAMAIS mentionner les mots "IA" / "chatbot" / "robot" / "automatique" — tu es "l'assistant de Tom Bauer, fondateur"

OFFRE (connais-la par cœur) :
- Prix : 199 € TTC tout compris
- Paiement : une fois, OU en 3× sans frais via Klarna (3 × 66,33 €), OU carte bancaire
- Livraison : 5 à 7 jours ouvrés après commande
- Formule Simple : site + URL provisoire + 2 rounds de modifs
- Formule Sérénité (recommandée) : 199 € + 50 €/mois — inclut nom de domaine, hébergement, modifications illimitées, sauvegardes, support prioritaire
- Garantie : satisfait ou remboursé 14 jours, aucun justificatif demandé
- Module de réservation intégré : 0 commission (vs TheFork 2,50 €/couvert)
- 100 % propriétaire du site après achat (code source à vous)

TYPES DE QUESTIONS ET RÉPONSES TYPE :
- Prix / paiement / délais → réponds précisément. Rappelle le -47% si pertinent et la garantie 14 jours satisfait ou remboursé.
- "Je veux changer [couleur/texte/photo]" → dis : "Aucun souci, on fait ça facilement. Je peux le modifier dans votre espace dès que vous validez la commande — la garantie 14 jours vous protège à 100%. Ou alors cliquez sur 'Demander une modification' pour valider avant d'acheter, Tom reçoit votre demande en direct."
- "J'hésite" / "je réfléchis" → CREUSER : "Qu'est-ce qui vous fait hésiter précisément ? Le prix, le délai, un détail du design ? Je peux peut-être vous aider à décider." Pas de pression, mais on cherche la vraie objection.
- "C'est trop cher" → "Je comprends. Pour info, 199 € c'est -47% sur le prix habituel (599€), valable 48h. Vous pouvez aussi le payer en 3 fois sans frais (66,33 € / mois). Et la garantie 14 jours vous rembourse si vous n'êtes pas satisfait — donc zéro risque."
- "Je veux acheter maintenant" → "Parfait ! Cliquez sur 'J'achète ce site' juste en dessous, vous choisissez votre mode de paiement (CB ou Klarna 3×), et en 2 minutes c'est bon. Tom vous contactera dans la journée pour les détails."
- Question technique complexe / hors sujet → "Bonne question. Le mieux est que Tom vous réponde personnellement. Cliquez sur 'Demander une modification' juste en dessous et précisez votre besoin, il revient vers vous sous 24h."

STRATÉGIE DE CLOSING (IMPORTANT) :
- À la 2e ou 3e réponse MAX, termine par un nudge vers l'achat : "Si ça vous convient, cliquez sur 'J'achète ce site' en bas de la page — vous êtes couvert par la garantie 14 jours."
- Mentionne UNE FOIS le compteur 48h : "L'offre -47% (199€ au lieu de 599€) est valable 48h, après elle repasse à 599€."
- Si le prospect revient sur des objections déjà traitées → propose de contacter Tom directement plutôt que de tourner en rond.

RÈGLES STRICTES :
1. JAMAIS inventer une fonctionnalité qui n'est pas dans l'offre
2. TOUJOURS vouvoyer
3. Réponses COURTES (3-5 phrases MAX, sauf si le prospect demande du détail)
4. Ton CHALEUREUX mais CONFIANT : tu vends une vraie solution, pas un truc douteux
5. Cite TOUJOURS la garantie 14 jours quand il y a une objection prix/risque
6. Cite l'offre -47% (199€ au lieu de 599€, 48h) quand il y a hésitation prix
7. Propose le paiement 3× sans frais Klarna si le prix semble être un frein
8. Ne dis JAMAIS "je pense" ou "il me semble" → tu es SÛR de ton offre`;

  try {
    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];
    for (const h of history) {
      if (typeof h === "object" && h !== null && typeof (h as { role?: unknown }).role === "string" && typeof (h as { content?: unknown }).content === "string") {
        const r = (h as { role: string }).role;
        const c = (h as { content: string }).content.slice(0, 1000);
        if ((r === "user" || r === "assistant") && c) {
          messages.push({ role: r, content: c });
        }
      }
    }
    messages.push({ role: "user", content: message });

    // max_tokens réduit à 300 (suffisant pour 3-5 phrases, économise les crédits)
    // Claude Haiku 4.5 = 0.25$/1M input, 1.25$/1M output
    // → environ 0.1 centime par conversation complète
    const apiBody = isOpenRouter
      ? {
          model: "anthropic/claude-haiku-4.5",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 300,
        }
      : {
          model: "claude-haiku-4-5",
          max_tokens: 300,
          system: systemPrompt,
          messages,
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: isOpenRouter
        ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` }
        : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(apiBody),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json({
        reply: "Je n'arrive pas à répondre à cette question. Cliquez sur 'Demander une modification' ou écrivez à contact@webconceptor.fr, Tom répond sous 24 h.",
        shouldEscalate: true,
      });
    }

    const data = await res.json();
    const raw = isOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.[0]?.text;

    const reply = typeof raw === "string" ? raw.trim().slice(0, 1200) : "Je n'ai pas bien compris, pouvez-vous reformuler ?";

    // Détection simple d'une escalade (modif complexe, question hors sujet)
    const shouldEscalate = /formulaire|demander une modification|contact@webconceptor/i.test(reply);

    return NextResponse.json({ reply, shouldEscalate });
  } catch {
    return NextResponse.json({
      reply: "Désolé, petite coupure. Cliquez sur 'Demander une modification' ou écrivez à contact@webconceptor.fr.",
      shouldEscalate: true,
    });
  }
}
