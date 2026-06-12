/**
 * POST /api/admin/director-create-test
 * Body: { email, password, business_name?, city?, is_first_login? }
 * → Crée immédiatement un compte Klyora Director avec mot de passe connu
 *   pour test rapide (Tom).
 *
 * Auth: x-admin-key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 5, windowSec: 60, routeKey: "director-test" });
  if (guard) return guard;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let body: { email?: string; password?: string; business_name?: string; city?: string; is_first_login?: boolean } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "Demo2026!";
  const businessName = body.business_name || "Plomberie Martin";
  const city = body.city || "Lyon";
  const isFirstLogin = body.is_first_login !== false;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email valide requis" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password min 8 chars" }, { status: 400 });
  }

  // 1) Cherche si compte Auth existe
  const { data: existingList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = existingList?.users.find((u) => u.email?.toLowerCase() === email);
  let authUserId: string;

  if (existing) {
    // Reset password
    await supabase.auth.admin.updateUserById(existing.id, { password });
    authUserId = existing.id;
  } else {
    const { data: createRes, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "director_test", business_name: businessName },
    });
    if (createErr || !createRes?.user) {
      return NextResponse.json({ error: createErr?.message || "Création échouée" }, { status: 500 });
    }
    authUserId = createRes.user.id;
  }

  // 2) Upsert director_accounts
  const { error: accErr } = await supabase.from("director_accounts").upsert({
    auth_user_id: authUserId,
    email,
    business_name: businessName,
    city,
    is_first_login: isFirstLogin,
    tokens_balance: 100,
  }, { onConflict: "auth_user_id" });

  if (accErr) {
    return NextResponse.json({ error: accErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email,
    password,
    business_name: businessName,
    is_first_login: isFirstLogin,
    login_url: `${req.nextUrl.origin}/director/login`,
    notice: "Compte créé/réinitialisé. Tu peux te connecter immédiatement.",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
