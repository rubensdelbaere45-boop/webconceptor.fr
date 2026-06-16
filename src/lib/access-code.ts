/* ══════════════════════════════════════════
   Access Code — protection légale des maquettes prospects

   Chaque prospect a un code unique de 8 caractères (format XXXX-XXXX) sans
   les chiffres/lettres ambigus (0, O, 1, I, L). Le code est :
     - généré une seule fois à la première création de maquette
     - inclus dans tous les mails de prospection (sniper, migration, etc.)
     - requis pour accéder à /prospects/[slug]

   Avantages :
     - Bloque les constats d'huissier "page accessible publiquement"
     - Confirme que c'est BIEN le destinataire qui a ouvert (pas un bot)
     - Trace IP/UA/timestamp de chaque ouverture validée
   ══════════════════════════════════════════ */

import { createClient } from "@supabase/supabase-js";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // pas 0,1,I,L,O — 31 chars
const COOKIE_PREFIX = "klyora_access_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/**
 * Génère un code aléatoire 8 caractères, format XXXX-XXXX.
 * Espace de codes ≈ 31^8 = 850 milliards — pas de collision pratique.
 */
export function generateAccessCode(): string {
  let raw = "";
  for (let i = 0; i < 8; i++) {
    raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/**
 * Normalise un code saisi par l'utilisateur (uppercase, retire espaces/tirets,
 * remap les caractères ambigus saisis par erreur).
 */
export function normalizeAccessCode(input: string): string {
  let s = input.toUpperCase().replace(/[\s\-_]/g, "");
  // Remap erreurs courantes de saisie
  s = s.replace(/0/g, "O").replace(/O/g, "0"); // 0 ↔ O → vide
  s = s.replace(/[1IL]/g, ""); // 1, I, L impossibles dans notre alphabet
  // Retire vraiment 0 / O (ambigus, on les a interdits à la génération)
  s = s.replace(/[0O]/g, "");
  // Re-format XXXX-XXXX si 8 chars valides
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4)}`;
  return s;
}

/**
 * Récupère le code d'un prospect. Génère + persiste si absent.
 */
export async function getOrCreateAccessCode(prospectId: string): Promise<string | null> {
  const supabase = db();
  const { data, error } = await supabase
    .from("prospects")
    .select("access_code")
    .eq("id", prospectId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.access_code) return data.access_code;

  const code = generateAccessCode();
  const { error: upErr } = await supabase
    .from("prospects")
    .update({
      access_code: code,
      access_code_generated_at: new Date().toISOString(),
    })
    .eq("id", prospectId);
  return upErr ? null : code;
}

/**
 * Vérifie qu'un code soumis correspond au prospect et log la tentative.
 * Si OK : incrémente le compteur d'ouvertures.
 */
export async function verifyAccessCode(opts: {
  slug: string;
  codeTried: string;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}): Promise<{ ok: boolean; prospectId?: string; firstUnlock?: boolean }> {
  const supabase = db();
  const normalized = normalizeAccessCode(opts.codeTried);

  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, access_code, access_code_first_unlocked_at, access_code_unlock_count")
    .eq("slug", opts.slug)
    .maybeSingle();

  const success = !!prospect && !!prospect.access_code && prospect.access_code === normalized;

  // Log la tentative (succès ou échec) — utile pour détecter bots/huissiers
  if (prospect?.id) {
    supabase
      .from("prospect_access_attempts")
      .insert({
        prospect_id: prospect.id,
        slug: opts.slug,
        code_tried: opts.codeTried.slice(0, 32),
        success,
        ip: opts.ip || null,
        user_agent: (opts.userAgent || "").slice(0, 500),
        referer: (opts.referer || "").slice(0, 500),
      })
      .then(() => {});
  }

  if (!success) return { ok: false };

  const firstUnlock = !prospect.access_code_first_unlocked_at;
  await supabase
    .from("prospects")
    .update({
      access_code_unlock_count: (prospect.access_code_unlock_count || 0) + 1,
      ...(firstUnlock ? { access_code_first_unlocked_at: new Date().toISOString() } : {}),
    })
    .eq("id", prospect.id);

  return { ok: true, prospectId: prospect.id, firstUnlock };
}

/* ══════════════════════════════════════════
   Helpers cookie HTTP
   ══════════════════════════════════════════ */

export function accessCookieName(slug: string): string {
  return `${COOKIE_PREFIX}${slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 100)}`;
}

export function buildAccessCookie(slug: string, code: string): string {
  const name = accessCookieName(slug);
  return `${name}=${encodeURIComponent(code)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly; Secure`;
}

export function hasValidAccessCookie(req: { headers: { get(name: string): string | null } }, slug: string, expectedCode: string | null): boolean {
  if (!expectedCode) return false;
  const cookieHeader = req.headers.get("cookie") || "";
  const name = accessCookieName(slug);
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!m) return false;
  const val = decodeURIComponent(m[1]);
  return val === expectedCode;
}

/* ══════════════════════════════════════════
   Page de gate (HTML autosuffisant)
   ══════════════════════════════════════════ */

export function renderGatePage(opts: { slug: string; error?: boolean; prospectName?: string }): string {
  const errMsg = opts.error
    ? `<p class="err">Code incorrect. Vérifiez l'orthographe (8 caractères, format XXXX-XXXX) ou consultez votre email de contact.</p>`
    : "";
  const safeName = opts.prospectName ? `pour <strong>${opts.prospectName.replace(/[<>]/g, "")}</strong>` : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Accès maquette · Klyora Sites</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);color:#fff;padding:20px}
.card{background:#fff;color:#0a0a0a;border-radius:16px;padding:36px 32px;max-width:440px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.4)}
.logo{display:flex;align-items:center;gap:8px;margin-bottom:24px}
.logo-mark{width:28px;height:28px;background:#0066ff;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px}
.logo-text{font-weight:700;font-size:16px}
.logo-text span{color:#0066ff}
h1{font-size:22px;margin:0 0 6px;letter-spacing:-0.01em}
.sub{color:#6b6b6b;font-size:14px;margin:0 0 24px;line-height:1.55}
.field{margin-bottom:14px}
label{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;display:block}
input{width:100%;padding:14px 16px;border:1.5px solid #e5e5e5;border-radius:10px;font-size:18px;letter-spacing:0.3em;text-align:center;font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-weight:700;color:#0a0a0a;background:#fafafa;outline:none;transition:border-color 0.15s;text-transform:uppercase}
input:focus{border-color:#0066ff;background:#fff}
button{width:100%;padding:14px;background:#0a0a0a;color:#FFD700;font-size:14px;font-weight:800;border:none;border-radius:10px;cursor:pointer;letter-spacing:0.08em;text-transform:uppercase;transition:background 0.2s;margin-top:6px}
button:hover{background:#0066ff}
.err{color:#c62828;font-size:13px;margin:12px 0 0;padding:10px 14px;background:#ffebee;border-radius:8px;line-height:1.45}
.help{font-size:12px;color:#6b6b6b;margin-top:18px;line-height:1.6;text-align:center}
.help a{color:#0066ff;text-decoration:none}
</style>
</head>
<body>
  <main class="card">
    <div class="logo">
      <div class="logo-mark">K</div>
      <div class="logo-text">Klyora<span> Sites</span></div>
    </div>
    <h1>Accès à votre maquette ${safeName}</h1>
    <p class="sub">Cette maquette est privée. Pour la consulter, saisissez le code d'accès à 8 caractères qui vous a été envoyé par email.</p>
    <form method="POST" action="/prospects/${encodeURIComponent(opts.slug)}/unlock">
      <div class="field">
        <label for="code">Code d'accès</label>
        <input type="text" name="code" id="code" maxlength="16" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX" required>
      </div>
      <button type="submit">Accéder à ma maquette</button>
      ${errMsg}
    </form>
    <p class="help">Vous n'avez pas reçu votre code ?<br><a href="mailto:contact@klyora.fr?subject=Code%20d'acc%C3%A8s%20maquette&body=Bonjour,%0A%0AJe%20n'ai%20pas%20re%C3%A7u%20mon%20code%20d'acc%C3%A8s%20%C3%A0%20la%20maquette%20${encodeURIComponent(opts.slug)}.%20Pouvez-vous%20me%20le%20renvoyer%20?%0A%0AMerci.">Demander un renvoi à contact@klyora.fr</a></p>
  </main>
</body>
</html>`;
}
