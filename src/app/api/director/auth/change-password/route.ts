/**
 * POST /api/director/auth/change-password
 * Body : { new_password }
 * → met à jour le mot de passe + is_first_login=false
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { new_password?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const pwd = body.new_password || "";
  if (pwd.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
  }
  if (pwd.length > 128) {
    return NextResponse.json({ error: "Mot de passe trop long" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Update password via Admin API
  const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { password: pwd });
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Marque is_first_login=false
  const { data: acc } = await supabase
    .from("director_accounts")
    .update({ is_first_login: false, temporary_password_used: true })
    .eq("auth_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (acc?.id) {
    await supabase.from("director_actions").insert({
      account_id: acc.id,
      action_type: "password_changed",
      tokens_delta: 0,
    });
  }

  return NextResponse.json({ success: true });
}
