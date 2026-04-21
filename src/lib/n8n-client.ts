/* ══════════════════════════════════════════
   Client pour l'API n8n cloud
   Utilisé pour monitorer les workflows et tenter des réparations auto.
   Doc : https://docs.n8n.io/api/
   ══════════════════════════════════════════ */

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  triggerCount?: number;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status?: "success" | "error" | "running" | "waiting" | "canceled" | "crashed";
  data?: unknown;
}

function getConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = (process.env.N8N_BASE_URL || "https://otinglem.app.n8n.cloud").replace(/\/$/, "");
  if (!apiKey) return null;
  return { baseUrl, apiKey };
}

async function n8nRequest<T = unknown>(
  method: "GET" | "POST" | "DELETE" | "PATCH",
  path: string,
  body?: unknown
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: "N8N_API_KEY manquante" };

  try {
    const res = await fetch(`${cfg.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "X-N8N-API-KEY": cfg.apiKey,
        "Accept": "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} : ${txt.slice(0, 200)}`, status: res.status };
    }

    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: true, data, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/** Liste tous les workflows (actifs et inactifs) */
export async function listWorkflows(): Promise<N8nWorkflow[]> {
  const res = await n8nRequest<{ data: N8nWorkflow[] }>("GET", "/workflows");
  if (!res.ok || !res.data?.data) return [];
  return res.data.data;
}

/** Récupère les N dernières exécutions d'un workflow (plus récentes d'abord) */
export async function listExecutions(workflowId: string, limit = 10): Promise<N8nExecution[]> {
  const res = await n8nRequest<{ data: N8nExecution[] }>(
    "GET",
    `/executions?workflowId=${encodeURIComponent(workflowId)}&limit=${limit}`
  );
  if (!res.ok || !res.data?.data) return [];
  return res.data.data;
}

/** Active un workflow (si il a été désactivé par erreur) */
export async function activateWorkflow(workflowId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await n8nRequest("POST", `/workflows/${encodeURIComponent(workflowId)}/activate`);
  return { ok: res.ok, error: res.error };
}

/** Désactive un workflow */
export async function deactivateWorkflow(workflowId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await n8nRequest("POST", `/workflows/${encodeURIComponent(workflowId)}/deactivate`);
  return { ok: res.ok, error: res.error };
}

/** Stoppe une exécution stuck */
export async function stopExecution(executionId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await n8nRequest("POST", `/executions/${encodeURIComponent(executionId)}/stop`);
  return { ok: res.ok, error: res.error };
}

/** Cycle désactiver → réactiver un workflow (force un "reset" pour débloquer) */
export async function cycleWorkflow(workflowId: string): Promise<{ ok: boolean; error?: string }> {
  const deact = await deactivateWorkflow(workflowId);
  if (!deact.ok) return { ok: false, error: `deactivate failed: ${deact.error}` };
  // Petit délai pour que n8n enregistre bien
  await new Promise((r) => setTimeout(r, 2000));
  const act = await activateWorkflow(workflowId);
  return { ok: act.ok, error: act.error };
}
