import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/save-edit
   Sauvegarde une modification live faite par le prospect via le chat IA.

   Body : { slug, selector, newText }
   - slug       : identifiant de la maquette
   - selector   : cible CSS ("hero-h1", "hero-sub", "about-p", "phone", etc.)
   - newText    : nouveau contenu texte

   Applique le patch directement dans mockup_html en DB.
   Rate-limit : 20 modifs / 10min / IP.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Correspondance selector → regex de remplacement dans le HTML stocké
// On utilise des patterns précis pour ne remplacer que le bon élément.
const PATCH_RULES: Record<string, { pattern: RegExp; replacement: (v: string) => string }> = {
  "hero-h1": {
    pattern: /(<h1[^>]*>)([^<]{0,300})(<\/h1>)/,
    replacement: (v) => `$1${v}$3`,
  },
  "hero-sub": {
    pattern: /(<p class="hero-desc"[^>]*>)([^<]{0,500})(<\/p>)/,
    replacement: (v) => `$1${v}$3`,
  },
  "about-p": {
    // Premier <p> dans .about-text
    pattern: /(<div class="about-text"[\s\S]{0,400}?<p[^>]*>)([^<]{0,800})(<\/p>)/,
    replacement: (v) => `$1${v}$3`,
  },
  "phone": {
    pattern: /(<a href="tel:[^"]*">)([^<]{3,50})(<\/a>)/g,
    replacement: (v) => `$1${v}$3`,
  },
  "strip-text": {
    // Texte du bandeau haut (topStrip)
    pattern: /(<div class="top-strip"[^>]*>)([^<]{3,100})(<\/div>)/,
    replacement: (v) => `$1${v}$3`,
  },
  "cta-verb": {
    // Texte du bouton CTA principal (balise <a>)
    pattern: /(<a class="btn-primary[^"]*"[^>]*>)([^<]{3,60})(<\/a>)/,
    replacement: (v) => `$1${v}$3`,
  },
  "nav-cta": {
    // Bouton nav (ex: "Réserver une table") — remplace TOUT le bouton par un lien tel:
    // Le numéro est injecté via le champ phone du prospect dans applyPatch
    pattern: /<button class="nav-cta"[^>]*>[^<]{3,60}<\/button>/,
    replacement: (v) => `<a href="#contact" class="nav-cta">${v}</a>`,
  },
  "hero-btn": {
    // Bouton hero qui appelle bkOpen() — remplace par lien tel: ou contact
    pattern: /(<button class="btn-primary"[^>]*onclick="bkOpen\(\)"[^>]*>)([^<]{3,80})(<\/button>)/,
    replacement: (v) => `<a href="#contact" class="btn-primary">${v} →</a>`,
  },
  "menu-coupes": {
    // Renomme spécifiquement la section "Coupes spéciales" (non adapté à certains glaciers)
    pattern: /(<div class="menu-section-title">)(Coupes spéciales)(<\/div>)/,
    replacement: (v) => `$1${v}$3`,
  },
};

function applyPatch(html: string, selector: string, newText: string): string {
  const rule = PATCH_RULES[selector];
  if (!rule) return html; // selector non reconnu → on ne touche rien

  // Sanitiser : texte brut uniquement, pas de balises
  const safe = newText.replace(/<[^>]*>/g, "").slice(0, 600).trim();
  if (!safe) return html;

  return html.replace(rule.pattern, rule.replacement(safe));
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`save-edit:${ip}`, 20, 600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de modifications. Réessayez dans quelques minutes." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const slug     = String(body.slug     || "").slice(0, 100).trim();
  const selector = String(body.selector || "").slice(0, 50).trim();
  const newText  = String(body.newText  || "").slice(0, 600).trim();

  if (!slug || !selector || !newText) {
    return NextResponse.json({ error: "slug, selector et newText requis" }, { status: 400 });
  }
  if (!PATCH_RULES[selector]) {
    return NextResponse.json({ error: "Modification non supportée" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("id, mockup_html, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !prospect?.mockup_html) {
    return NextResponse.json({ error: "Maquette introuvable" }, { status: 404 });
  }

  const updatedHtml = applyPatch(prospect.mockup_html, selector, newText);

  if (updatedHtml === prospect.mockup_html) {
    // Le pattern n'a rien matché (peut arriver sur les rich_audit qui ont un HTML différent)
    return NextResponse.json({ success: true, patched: false, message: "Élément non trouvé dans ce template" });
  }

  await supabase
    .from("prospects")
    .update({
      mockup_html: updatedHtml,
      notes: `[EDIT ${new Date().toISOString().slice(0,16)}] ${selector} → "${newText.slice(0,50)}"`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect.id);

  return NextResponse.json({ success: true, patched: true });
}
