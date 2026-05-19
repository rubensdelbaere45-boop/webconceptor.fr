import type { Metadata } from "next";
import AgentStore from "./AgentStore";

export const metadata: Metadata = {
  title: "AGENTConceptor — Agents IA autonomes pour votre entreprise",
  description:
    "Des agents IA qui gèrent votre entreprise à votre place : chatbot 24h/24, avis Google automatiques, devis en 2 minutes, posts réseaux sociaux, fidélisation clients. Livraison immédiate après paiement.",
  openGraph: {
    title: "AGENTConceptor — Agents IA autonomes",
    description: "Chatbot, Réputation, Devis, Contenu, Fidélisation — tout automatique.",
    url: "https://webconceptor.fr/agentconceptor",
  },
};

export default function AgentConceptorPage() {
  return <AgentStore />;
}
