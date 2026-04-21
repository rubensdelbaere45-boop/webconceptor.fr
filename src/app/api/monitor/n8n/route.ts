import { NextRequest, NextResponse } from "next/server";
import { safeCompare, escapeTelegram } from "@/lib/security";
import {
  listWorkflows,
  listExecutions,
  activateWorkflow,
  cycleWorkflow,
  stopExecution,
  type N8nExecution,
} from "@/lib/n8n-client";

/* ══════════════════════════════════════════
   GET|POST /api/monitor/n8n
   Monitoring + auto-healing des workflows n8n.

   Appelé toutes les 15 min par un cron Render.
   Pour chaque workflow actif, vérifie :
   - Est-il bien actif ?                → sinon re-active
   - Dernière exécution en erreur ?     → cycle (deactivate/reactivate) + notif
   - Exécution stuck depuis >2h ?       → stop forcé + cycle + notif
   - Pas d'exécution depuis 25h (pour workflows quotidiens) ? → cycle + notif

   Notifie Telegram UNIQUEMENT si une action a été prise (pas de spam).
   ══════════════════════════════════════════ */

interface MonitorReport {
  workflowId: string;
  name: string;
  active: boolean;
  lastExecutionAt: string | null;
  lastExecutionStatus: string | null;
  issueDetected: string | null;
  actionTaken: string | null;
  actionResult: "success" | "failed" | null;
}

function parseStartedAt(startedAt: string): number {
  const t = new Date(startedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

async function notifyTelegram(text: string, sound = false): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: !sound,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* silent */ }
}

async function handler(req: NextRequest) {
  // Auth : accepte admin-key OU cron-secret
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (!process.env.N8N_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "N8N_API_KEY manquante dans l'environnement",
    }, { status: 200 });
  }

  const workflows = await listWorkflows();
  if (workflows.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Impossible de lister les workflows n8n (clé API invalide ou URL incorrecte ?)",
    }, { status: 200 });
  }

  const reports: MonitorReport[] = [];
  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const TWENTY_FIVE_HOURS_MS = 25 * 60 * 60 * 1000;

  // On ne surveille que les workflows qui contiennent "WebConceptor" (nos 3 workflows)
  const ourWorkflows = workflows.filter((w) => /webconceptor/i.test(w.name));

  for (const wf of ourWorkflows) {
    const report: MonitorReport = {
      workflowId: wf.id,
      name: wf.name,
      active: wf.active,
      lastExecutionAt: null,
      lastExecutionStatus: null,
      issueDetected: null,
      actionTaken: null,
      actionResult: null,
    };

    // ─── Check 1 : workflow actif ? ───
    if (!wf.active) {
      report.issueDetected = "workflow désactivé";
      const activateRes = await activateWorkflow(wf.id);
      report.actionTaken = "activateWorkflow";
      report.actionResult = activateRes.ok ? "success" : "failed";
      reports.push(report);
      continue;
    }

    // ─── Check 2 : dernière exécution en erreur / stuck ? ───
    const executions = await listExecutions(wf.id, 5);
    if (executions.length === 0) {
      report.issueDetected = "aucune exécution trouvée";
      reports.push(report);
      continue;
    }

    const latest = executions[0];
    report.lastExecutionAt = latest.startedAt;
    report.lastExecutionStatus = latest.status || (latest.finished ? "success" : "running");

    const latestStartedMs = parseStartedAt(latest.startedAt);
    const ageMs = now - latestStartedMs;

    // ─── Dernière exécution en ERREUR ───
    if (latest.status === "error" || latest.status === "crashed") {
      report.issueDetected = `dernière exécution en ${latest.status}`;
      const cycle = await cycleWorkflow(wf.id);
      report.actionTaken = "cycleWorkflow (deactivate + reactivate)";
      report.actionResult = cycle.ok ? "success" : "failed";
      reports.push(report);
      continue;
    }

    // ─── Exécution STUCK (running depuis >2h) ───
    if ((latest.status === "running" || !latest.finished) && ageMs > TWO_HOURS_MS) {
      report.issueDetected = `exécution stuck depuis ${Math.round(ageMs / (60 * 60 * 1000))} h`;
      await stopExecution(latest.id);
      const cycle = await cycleWorkflow(wf.id);
      report.actionTaken = "stopExecution + cycleWorkflow";
      report.actionResult = cycle.ok ? "success" : "failed";
      reports.push(report);
      continue;
    }

    // ─── Pas d'exécution depuis 25h (workflow quotidien silencieux) ───
    if (ageMs > TWENTY_FIVE_HOURS_MS) {
      report.issueDetected = `aucune exécution depuis ${Math.round(ageMs / (60 * 60 * 1000))} h`;
      const cycle = await cycleWorkflow(wf.id);
      report.actionTaken = "cycleWorkflow (réveil)";
      report.actionResult = cycle.ok ? "success" : "failed";
      reports.push(report);
      continue;
    }

    // Rien à signaler
    reports.push(report);
  }

  // ─── Notifie Telegram si au moins 1 action a été prise ───
  const actionsTaken = reports.filter((r) => r.actionTaken);
  if (actionsTaken.length > 0) {
    const sound = actionsTaken.some((r) => r.actionResult === "failed");

    const lines = actionsTaken.map((r) => {
      const icon = r.actionResult === "success" ? "✅" : "❌";
      return `${icon} <b>${escapeTelegram(r.name)}</b>\n   Problème : ${escapeTelegram(r.issueDetected || "?")}\n   Action : ${escapeTelegram(r.actionTaken || "?")}\n   Résultat : ${escapeTelegram(r.actionResult || "?")}`;
    });

    const msg =
      `${sound ? "🚨" : "🔧"} <b>Auto-healing n8n</b>\n\n` +
      lines.join("\n\n") +
      `\n\n<i>Monitoring automatique — ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</i>`;

    await notifyTelegram(msg, sound);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    workflowsChecked: reports.length,
    actionsTaken: actionsTaken.length,
    reports,
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
