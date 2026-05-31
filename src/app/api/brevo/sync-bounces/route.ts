import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function fetchEmails(url: string, headers: Record<string, string>): Promise<{ emails: string[]; error?: string }> {
  const emails: string[] = [];
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const txt = await res.text().catch(() => "?");
      return { emails, error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
    }
    const data = await res.json().catch(() => null);
    const list: unknown[] = Array.isArray(data) ? data
      : Array.isArray(data?.contacts) ? data.contacts
      : Array.isArray(data?.events) ? data.events
      : [];
    for (const item of list) {
      if (typeof item === "object" && item !== null) {
        const row = item as Record<string, unknown>;
        const email = row.email ?? row.emailAddress ?? row.mail;
        if (typeof email === "string" && email.includes("@")) {
          emails.push(email.toLowerCase().trim());
        }
      }
    }
  } catch (e) {
    return { emails, error: String(e) };
  }
  return { emails };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });

  const supabase = getSupabaseAdmin();
  const bouncedEmails = new Set<string>();
  const debug: Record<string, unknown> = {};
  const today = new Date().toISOString().split("T")[0];
  const h = { "api-key": brevoKey, "Accept": "application/json" };

  // Source 1 — smtp/blockedContacts (endpoint dédié hard bounces Brevo)
  for (let offset = 0; ; offset += 500) {
    const { emails, error } = await fetchEmails(
      `https://api.brevo.com/v3/smtp/blockedContacts?startDate=2020-01-01&endDate=${today}&limit=500&offset=${offset}`,
      h
    );
    if (error) { debug["blockedContacts"] = error; break; }
    emails.forEach(e => bouncedEmails.add(e));
    if (emails.length < 500) { debug["blockedContacts"] = (Number(debug["blockedContacts"] ?? 0)) + emails.length; break; }
    debug["blockedContacts"] = (Number(debug["blockedContacts"] ?? 0)) + emails.length;
  }

  // Source 2 — contacts/blacklisted (suppression list globale)
  for (let offset = 0; ; offset += 500) {
    const { emails, error } = await fetchEmails(
      `https://api.brevo.com/v3/contacts/blacklisted?startDate=2020-01-01&endDate=${today}&limit=500&offset=${offset}`,
      h
    );
    if (error) { debug["blacklisted"] = error; break; }
    emails.forEach(e => bouncedEmails.add(e));
    if (emails.length < 500) { debug["blacklisted"] = (Number(debug["blacklisted"] ?? 0)) + emails.length; break; }
    debug["blacklisted"] = (Number(debug["blacklisted"] ?? 0)) + emails.length;
  }

  // Source 3 — smtp/statistics/events avec days=90 (pas startDate)
  for (const event of ["hardBounces", "invalid", "blocked"]) {
    for (let offset = 0; ; offset += 500) {
      const { emails, error } = await fetchEmails(
        `https://api.brevo.com/v3/smtp/statistics/events?event=${event}&days=90&limit=500&offset=${offset}`,
        h
      );
      if (error) { debug[event] = error; break; }
      emails.forEach(e => bouncedEmails.add(e));
      if (emails.length < 500) { debug[event] = (Number(debug[event] ?? 0)) + emails.length; break; }
      debug[event] = (Number(debug[event] ?? 0)) + emails.length;
    }
  }

  if (bouncedEmails.size === 0) {
    return NextResponse.json({ ok: true, bounced_found: 0, updated: 0, debug });
  }

  const emailList = Array.from(bouncedEmails);
  const { error, data: updated } = await supabase
    .from("prospects")
    .update({ email_bounced: true })
    .in("email", emailList)
    .select("id");

  return NextResponse.json({
    ok: true,
    bounced_found: emailList.length,
    updated: updated?.length ?? 0,
    supabase_error: error?.message,
    debug,
  });
}
