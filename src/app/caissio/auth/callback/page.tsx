"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loginWithGoogle, registerWithGoogle } from "@/lib/caissio-store";

export default function CaissioAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Connexion en cours…");

  useEffect(() => {
    const handle = async () => {
      // Supabase gère automatiquement le code OAuth dans l'URL
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setStatus("Erreur de connexion. Redirection…");
        setTimeout(() => router.replace("/caissio/login"), 2000);
        return;
      }

      const { user } = data.session;
      const email = user.email || "";
      const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
      // Utilise l'ID Supabase comme identifiant stable (unique par utilisateur)
      const googleSub = user.id;

      try {
        // Connexion si compte existant, sinon création
        const caissioUser =
          loginWithGoogle(googleSub, email) ??
          registerWithGoogle({ name, email, google_sub: googleSub });

        if (!caissioUser.onboarding_done) {
          router.replace("/caissio/onboarding");
        } else {
          router.replace("/caissio/app/pos");
        }
      } catch {
        setStatus("Erreur lors de la création du compte.");
        setTimeout(() => router.replace("/caissio/login"), 2000);
      }
    };

    handle();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Sans', sans-serif", background: "#f8fafc",
    }}>
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 20 }}>
        <rect x="2" y="2" width="44" height="44" rx="11" fill="#4F46E5" />
        <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
        <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white" />
        <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981" />
      </svg>
      <div style={{ fontSize: 16, color: "#475569", fontWeight: 500 }}>{status}</div>
      <div style={{ marginTop: 12, width: 32, height: 32, border: "3px solid #4F46E5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
