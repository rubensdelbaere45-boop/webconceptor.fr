/* ══════════════════════════════════════════
   Vercel API — création projet + upload site statique + ajout domaine

   Doc: https://vercel.com/docs/rest-api

   Variables d'env attendues :
     - VERCEL_API_TOKEN   (token créé sur vercel.com/account/tokens)
     - VERCEL_TEAM_ID     (optionnel — si le compte est dans une équipe)
   ══════════════════════════════════════════ */

const VERCEL_API = "https://api.vercel.com";

function getAuth(): { token: string; teamId?: string } | null {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  const teamId = process.env.VERCEL_TEAM_ID;
  return { token, teamId };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamParam(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

export interface VercelDeployFile {
  file: string;       // chemin relatif, ex: "index.html"
  data: string;       // contenu (UTF-8)
}

export interface VercelDeployResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  deploymentId?: string;
  deploymentUrl?: string;       // ex: https://abc.vercel.app
  customDomain?: string;        // ex: maboutique.fr
  error?: string;
  httpStatus?: number;
}

/**
 * Crée un projet Vercel statique avec un nom donné.
 * Si le nom existe déjà → retourne le projet existant.
 */
async function createOrGetProject(name: string): Promise<{ id: string; name: string } | null> {
  const auth = getAuth();
  if (!auth) return null;

  // Tente la création
  const res = await fetch(`${VERCEL_API}/v10/projects${teamParam(auth.teamId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: JSON.stringify({
      name,
      framework: null,
      publicSource: true,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return { id: data.id, name: data.name };
  }

  // Conflit 409 = existe déjà → fetch
  if (res.status === 409) {
    const r = await fetch(`${VERCEL_API}/v9/projects/${encodeURIComponent(name)}${teamParam(auth.teamId)}`, {
      headers: authHeaders(auth.token),
    });
    if (r.ok) {
      const d = await r.json();
      return { id: d.id, name: d.name };
    }
  }

  return null;
}

/**
 * Sanitize un slug prospect en nom de projet Vercel valide :
 *   - lowercase, lettres/chiffres/tirets uniquement
 *   - max 100 chars
 *   - préfixe "klyora-" pour grouper dans le dashboard
 */
export function vercelProjectName(slug: string): string {
  const clean = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `klyora-${clean}`;
}

/**
 * Déploie un site statique (index.html + assets) sur Vercel.
 * - Crée le projet s'il n'existe pas
 * - Upload les fichiers en base64 inline (API v13/deployments)
 * - Optionnellement ajoute un domaine custom
 */
export async function deployStaticSite(
  projectSlug: string,
  files: VercelDeployFile[],
  customDomain?: string
): Promise<VercelDeployResult> {
  const auth = getAuth();
  if (!auth) {
    return { success: false, error: "VERCEL_API_TOKEN absent" };
  }

  const projectName = vercelProjectName(projectSlug);
  const project = await createOrGetProject(projectName);
  if (!project) {
    return { success: false, error: "Création projet Vercel échouée" };
  }

  // Encode les fichiers en payload deployment v13
  const filesPayload = files.map((f) => ({
    file: f.file,
    data: Buffer.from(f.data, "utf-8").toString("base64"),
    encoding: "base64",
  }));

  // Crée le déploiement en production
  const depRes = await fetch(`${VERCEL_API}/v13/deployments${teamParam(auth.teamId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: JSON.stringify({
      name: projectName,
      project: project.id,
      target: "production",
      files: filesPayload,
      projectSettings: {
        framework: null,
      },
    }),
  });

  const depBody = await depRes.json().catch(() => ({}));

  if (!depRes.ok) {
    return {
      success: false,
      projectId: project.id,
      projectName,
      httpStatus: depRes.status,
      error: depBody?.error?.message || `HTTP ${depRes.status}`,
    };
  }

  const deploymentUrl = depBody?.url ? `https://${depBody.url}` : undefined;
  const deploymentId = depBody?.id;

  // Si demande de domaine custom : on l'attache au projet
  let attachedDomain: string | undefined;
  if (customDomain) {
    const ok = await attachDomainToProject(project.id, customDomain);
    if (ok) attachedDomain = customDomain;
  }

  return {
    success: true,
    projectId: project.id,
    projectName,
    deploymentId,
    deploymentUrl,
    customDomain: attachedDomain,
  };
}

/**
 * Attache un domaine custom à un projet Vercel.
 * Vercel répondra avec les DNS à configurer chez le registrar.
 */
export async function attachDomainToProject(projectIdOrName: string, domain: string): Promise<boolean> {
  const auth = getAuth();
  if (!auth) return false;

  const res = await fetch(`${VERCEL_API}/v10/projects/${encodeURIComponent(projectIdOrName)}/domains${teamParam(auth.teamId)}`, {
    method: "POST",
    headers: authHeaders(auth.token),
    body: JSON.stringify({ name: domain }),
  });

  // 200/201 = ajouté, 409 = déjà attaché (acceptable)
  return res.ok || res.status === 409;
}

/**
 * Récupère le statut d'un domaine (vérifie SSL + DNS) sur un projet.
 * Utile pour le polling "site bientôt en ligne" → "site en ligne".
 */
export async function getDomainStatus(projectIdOrName: string, domain: string): Promise<{
  verified: boolean;
  misconfigured: boolean;
  details?: unknown;
}> {
  const auth = getAuth();
  if (!auth) return { verified: false, misconfigured: true };

  const res = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}${teamParam(auth.teamId)}`,
    { headers: authHeaders(auth.token) }
  );

  if (!res.ok) return { verified: false, misconfigured: true };
  const data = await res.json();
  return {
    verified: !!data.verified,
    misconfigured: !!data.verification && Array.isArray(data.verification) && data.verification.length > 0,
    details: data,
  };
}
