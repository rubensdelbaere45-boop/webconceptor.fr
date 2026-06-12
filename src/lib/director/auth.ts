/**
 * Helpers d'authentification Klyora Director.
 * On stocke un cookie httpOnly avec le JWT Supabase Auth pour les pages /director.
 */

import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const DIRECTOR_COOKIE = "wd_token";
const DIRECTOR_COOKIE_MAXAGE = 60 * 60 * 24 * 7; // 7 jours

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function setSessionCookie(accessToken: string) {
  const jar = await cookies();
  jar.set(DIRECTOR_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",     // cookie valide sur /director ET /api/director
    maxAge: DIRECTOR_COOKIE_MAXAGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(DIRECTOR_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(DIRECTOR_COOKIE)?.value;
  if (!token) return null;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function getDirectorAccount(userId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("director_accounts")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data;
}
