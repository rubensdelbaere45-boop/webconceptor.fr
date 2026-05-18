"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  token: string;
  businessName: string;
  welcomeMessage: string;
  accentColor: string;
  phone?: string | null;
  hours?: string | null;
  bookingUrl?: string | null;
}

export default function ChatWindow({
  token, businessName, welcomeMessage, accentColor, phone, hours, bookingUrl,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newHistory: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/chatbot/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: newHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Désolé, une erreur est survenue." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Problème de connexion. Veuillez réessayer." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ "--accent": accentColor } as React.CSSProperties}
      className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: accentColor }}
        className="px-5 py-4 text-white flex items-center gap-3 shadow-md">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-content text-xl font-bold">
          🤖
        </div>
        <div>
          <h1 className="font-semibold text-base leading-tight">{businessName}</h1>
          <p className="text-xs text-white/80">Assistant IA · Répond instantanément</p>
        </div>
      </div>

      {/* Info bar */}
      {(phone || hours || bookingUrl) && (
        <div className="flex gap-3 px-4 py-2 bg-white border-b border-gray-100 text-xs text-gray-500 flex-wrap">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-blue-600">
              📞 {phone}
            </a>
          )}
          {hours && <span>🕐 {hours}</span>}
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: accentColor }}
              className="font-medium hover:underline">
              📅 Prendre RDV →
            </a>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
              }`}
              style={m.role === "user" ? { background: accentColor } : {}}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send}
        className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 safe-area-bottom">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message..."
          maxLength={500}
          disabled={loading}
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 font-inherit"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{ background: accentColor }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          aria-label="Envoyer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      <p className="text-center text-[10px] text-gray-300 py-1.5">
        Propulsé par{" "}
        <a href="https://webconceptor.fr" target="_blank" rel="noopener noreferrer"
          className="hover:underline">WebConceptor</a>
      </p>
    </div>
  );
}
