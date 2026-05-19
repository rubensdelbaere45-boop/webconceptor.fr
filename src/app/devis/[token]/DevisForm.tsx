"use client";

import { useState, FormEvent } from "react";

interface Props {
  token: string;
  businessName: string;
  businessType: string;
  city?: string | null;
  phone?: string | null;
}

const PROJECT_TYPES: Record<string, string[]> = {
  artisan:  ["Rénovation intérieure", "Peinture", "Plomberie", "Électricité", "Menuiserie", "Carrelage", "Isolation", "Autre travaux"],
  garage:   ["Révision / entretien", "Réparation", "Contrôle technique", "Pneus", "Climatisation", "Autre"],
  sante:    ["Consultation", "Bilan", "Suivi", "Soins", "Autre"],
  coiffeur: ["Coupe", "Coloration", "Permanente", "Traitement", "Mariage", "Autre"],
  beaute:   ["Soin visage", "Épilation", "Massage", "Manucure", "Autre"],
  general:  ["Demande de devis", "Prestation de service", "Fourniture de produits", "Autre"],
};

const BUDGET_RANGES = [
  "Moins de 500€",
  "500€ – 1 500€",
  "1 500€ – 5 000€",
  "5 000€ – 15 000€",
  "Plus de 15 000€",
  "À définir",
];

export default function DevisForm({ token, businessName, businessType, city, phone }: Props) {
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_email: "", client_phone: "",
    project_type: "", project_description: "", project_address: "",
    budget_range: "", desired_date: "",
  });

  const projectTypes = PROJECT_TYPES[businessType] ?? PROJECT_TYPES.general;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.client_name || !form.client_email || !form.project_description) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/agentconceptor/devis/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
      } else {
        setStep("error");
      }
    } catch {
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-3">Votre demande a bien été envoyée !</h2>
        <p className="text-gray-500 mb-2">
          Votre devis est en cours de génération par notre IA.
          <br />Vous le recevrez par email dans <strong>moins de 2 minutes</strong>.
        </p>
        <p className="text-gray-400 text-sm">
          {phone && <>Vous pouvez aussi nous appeler directement : <strong>{phone}</strong></>}
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold mb-3">Erreur technique</h2>
        <p className="text-gray-500 mb-4">Impossible de traiter votre demande. Veuillez réessayer ou nous contacter directement.</p>
        <button onClick={() => setStep("form")} className="text-blue-600 hover:underline">← Réessayer</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Votre nom complet *</label>
          <input
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            placeholder="Jean Martin"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
          <input
            value={form.client_phone}
            onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
            placeholder="06 12 34 56 78"
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Votre email *</label>
        <input
          value={form.client_email}
          onChange={(e) => setForm({ ...form, client_email: e.target.value })}
          placeholder="jean@exemple.fr"
          type="email"
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de projet</label>
        <select
          value={form.project_type}
          onChange={(e) => setForm({ ...form, project_type: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
        >
          <option value="">Sélectionnez un type</option>
          {projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Description de votre projet *
          <span className="font-normal text-gray-400 ml-1">(le plus de détails possible)</span>
        </label>
        <textarea
          value={form.project_description}
          onChange={(e) => setForm({ ...form, project_description: e.target.value })}
          placeholder="Décrivez votre projet en détail : superficie, matériaux souhaités, contraintes particulières, délais..."
          required
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget estimé</label>
          <select
            value={form.budget_range}
            onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">Non défini</option>
            {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date souhaitée</label>
          <input
            value={form.desired_date}
            onChange={(e) => setForm({ ...form, desired_date: e.target.value })}
            placeholder="Dès que possible / Juin 2026"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse du chantier / lieu</label>
        <input
          value={form.project_address}
          onChange={(e) => setForm({ ...form, project_address: e.target.value })}
          placeholder={`${city ? city + ", " : ""}France`}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !form.client_name || !form.client_email || !form.project_description}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? "Génération de votre devis..." : "Recevoir mon devis gratuit →"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Devis généré par IA · Envoyé par email en moins de 2 minutes · 100% gratuit et sans engagement
      </p>
    </form>
  );
}
