import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ChatWindow from "./ChatWindow";

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
    .from("chatbot_subscriptions")
    .select("business_name")
    .eq("token", token)
    .single();

  return {
    title: data ? `Chatbot — ${data.business_name}` : "Chatbot IA",
    description: "Assistant IA disponible 24h/24",
    robots: { index: false },
  };
}

export default async function ChatPage({ params }: Props) {
  const { token } = await params;

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) notFound();

  const supabase = getSupabase();
  const { data: bot } = await supabase
    .from("chatbot_subscriptions")
    .select("business_name, business_type, welcome_message, accent_color, phone, hours, booking_url, status")
    .eq("token", token)
    .single();

  if (!bot || bot.status !== "active") notFound();

  return (
    <ChatWindow
      token={token}
      businessName={bot.business_name}
      welcomeMessage={bot.welcome_message || "Bonjour ! Comment puis-je vous aider ?"}
      accentColor={bot.accent_color || "#0066ff"}
      phone={bot.phone}
      hours={bot.hours}
      bookingUrl={bot.booking_url}
    />
  );
}
