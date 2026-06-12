"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /auth/callback — Point d'atterrissage commun après Google OAuth (Klyora Sites).
 * Supabase y pose le hash #access_token=... et la page attend que la session soit prête
 * avant de rediriger vers le dashboard (ou vers le code en attente).
 */
export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Connexion en cours…");

  useEffect(() => {
    const handle = async () => {
      // Supabase gère automatiquement le fragment OAuth dans l'URL
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setStatus("Erreur de connexion. Redirection…");
        setTimeout(() => router.replace("/auth/login"), 2000);
        return;
      }

      // Récupère l'éventuel code maquette stocké avant la connexion
      const pendingCode =
        typeof window !== "undefined"
          ? sessionStorage.getItem("pendingCode")
          : null;

      if (pendingCode) {
        sessionStorage.removeItem("pendingCode");
        router.replace(`/code?c=${pendingCode}`);
      } else {
        router.replace("/dashboard");
      }
    };

    handle();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", background: "#f8fafc",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ width: 8, height: 8, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
          Web<span style={{ color: "#2563eb" }}>Conceptor</span>
        </span>
      </div>
      <div style={{ fontSize: 15, color: "#475569", fontWeight: 500, marginBottom: 20 }}>{status}</div>
      <div style={{ width: 28, height: 28, border: "3px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
