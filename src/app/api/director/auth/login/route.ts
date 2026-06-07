/**
 * POST /api/director/auth/login
 * Body : { email, password }
 * → set cookie session si OK + signale must_change_password si is_first_login
 */

import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getServiceClient, setSessionCookie } from "@/lib/director/auth";
import { rateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`director-login:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de tentatives, patientez 1 min" }, { status: 429 });
  }

  let body: { email?: string; password?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const anon = getAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  await setSessionCookie(data.session.access_token);

  // Récupère état must_change_password
  const service = getServiceClient();
  const { data: acc } = await service
    .from("director_accounts")
    .select("is_first_login, last_login_at, id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  // Met à jour last_login_at
  if (acc?.id) {
    await service.from("director_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", acc.id);
    await service.from("director_actions").insert({
      account_id: acc.id,
      action_type: "login",
      tokens_delta: 0,
      details: { ip },
    });
  }

  return NextResponse.json({
    success: true,
    must_change_password: !!acc?.is_first_login,
    user: { email: data.user.email, id: data.user.id },
  });
}
