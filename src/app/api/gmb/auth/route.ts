import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   GET /api/gmb/auth?token=AUTH_TOKEN

   Redirige le client vers la page Google OAuth.
   Le token dans l'URL est l'auth_token unique
   créé lors du paiement Stripe (dans Supabase).

   Scope requis :
   https://www.googleapis.com/auth/business.manage
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  const authToken = req.nextUrl.searchParams.get("token") || "";

  if (!authToken || authToken.length < 20) {
    return new NextResponse("Lien invalide.", { status: 400 });
  }

  // Vérifier que le token existe en base
  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from("gmb_subscriptions")
    .select("id, status, owner_email, business_name")
    .eq("auth_token", authToken)
    .single();

  if (!sub) {
    return new NextResponse("Lien expiré ou invalide. Contactez contact@klyora.fr", { status: 404 });
  }

  if (sub.status === "active") {
    // Déjà connecté — rediriger vers un message de confirmation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";
    return NextResponse.redirect(`${baseUrl}/services/avis-google/deja-connecte`);
  }

  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  const redirectUri  = `${process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr"}/api/gmb/callback`;
  const scope        = "https://www.googleapis.com/auth/business.manage";

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id",     clientId);
  googleAuthUrl.searchParams.set("redirect_uri",  redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope",         scope);
  googleAuthUrl.searchParams.set("access_type",   "offline");
  googleAuthUrl.searchParams.set("prompt",        "consent");  // Force refresh_token
  googleAuthUrl.searchParams.set("state",         authToken);  // On passe l'auth_token dans state

  return NextResponse.redirect(googleAuthUrl.toString());
}
