import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DevisForm from "./DevisForm";

interface Props {
  params: Promise<{ token: string }>;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("agentconceptor_subscriptions")
    .select("business_name")
    .eq("devis_token", token)
    .single();

  return {
    title: data ? `Demande de devis — ${data.business_name}` : "Demande de devis",
    description: "Recevez votre devis professionnel en moins de 2 minutes, généré par IA.",
    robots: { index: false },
  };
}

export default async function DevisPage({ params }: Props) {
  const { token } = await params;

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) notFound();

  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from("agentconceptor_subscriptions")
    .select("business_name, business_type, city, phone, has_devis, status")
    .eq("devis_token", token)
    .single();

  if (!sub || !sub.has_devis || sub.status !== "active") notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
            AC
          </div>
          <div>
            <p className="font-bold text-gray-900">{sub.business_name}</p>
            <p className="text-xs text-gray-400">Devis professionnel · Gratuit</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            ⚡ Devis généré par IA en moins de 2 minutes
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Demandez votre devis gratuit
          </h1>
          <p className="text-gray-500">
            Remplissez le formulaire ci-dessous et recevez un devis professionnel
            directement dans votre boîte email.
          </p>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "⚡", label: "< 2 minutes" },
            { icon: "📧", label: "Par email" },
            { icon: "🔒", label: "Sans engagement" },
          ].map((g) => (
            <div key={g.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{g.icon}</div>
              <div className="text-xs font-semibold text-gray-600">{g.label}</div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
          <DevisForm
            token={token}
            businessName={sub.business_name}
            businessType={sub.business_type || "general"}
            city={sub.city}
            phone={sub.phone}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Propulsé par{" "}
          <a href="https://klyora.fr/agentconceptor" target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:underline">AGENTConceptor</a>
          {" "}· Agent Devis IA
        </p>
      </div>
    </div>
  );
}
