import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   GET /api/chatbot/widget?token=XXX

   Sert le widget JS dynamique.
   Récupère les couleurs/config du client
   et génère le script à la volée.

   Usage : <script src="https://klyora.fr/api/chatbot/widget?token=XXX"></script>
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function escapeJs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, "\\n");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return new NextResponse("// Token invalide", {
      status: 400,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const supabase = getSupabase();
  const { data: bot } = await supabase
    .from("chatbot_subscriptions")
    .select("business_name, welcome_message, accent_color, status")
    .eq("token", token)
    .single();

  if (!bot || bot.status !== "active") {
    return new NextResponse("// Chatbot inactif", {
      status: 200,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";
  const color = bot.accent_color || "#0066ff";
  const businessName = escapeJs(bot.business_name || "Assistant");
  const welcome = escapeJs(bot.welcome_message || "Bonjour ! Comment puis-je vous aider ?");

  const js = `
(function() {
  'use strict';
  if (window.__wcbot_loaded) return;
  window.__wcbot_loaded = true;

  var TOKEN = '${token}';
  var API_URL = '${baseUrl}/api/chatbot/' + TOKEN;
  var COLOR = '${color}';
  var BIZ_NAME = '${businessName}';
  var WELCOME = '${welcome}';
  var history = [];
  var isOpen = false;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#wcbot-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:' + COLOR + ';border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:99998;display:flex;align-items:center;justify-content:center;transition:transform .2s}',
    '#wcbot-btn:hover{transform:scale(1.08)}',
    '#wcbot-btn svg{width:28px;height:28px;fill:#fff}',
    '#wcbot-box{position:fixed;bottom:96px;right:24px;width:340px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#wcbot-box.open{display:flex}',
    '#wcbot-header{background:' + COLOR + ';padding:16px 20px;color:#fff;display:flex;align-items:center;gap:12px}',
    '#wcbot-header .avatar{width:36px;height:36px;background:rgba(255,255,255,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px}',
    '#wcbot-header .info h3{margin:0;font-size:15px;font-weight:600}',
    '#wcbot-header .info p{margin:0;font-size:12px;opacity:.85}',
    '#wcbot-close{margin-left:auto;background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;padding:4px}',
    '#wcbot-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
    '.wcbot-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-break:break-word}',
    '.wcbot-msg.bot{background:#f3f4f6;color:#111;align-self:flex-start;border-bottom-left-radius:4px}',
    '.wcbot-msg.user{background:' + COLOR + ';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '.wcbot-typing{display:flex;gap:4px;padding:10px 14px;background:#f3f4f6;border-radius:12px;border-bottom-left-radius:4px;align-self:flex-start}',
    '.wcbot-typing span{width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:wcbot-bounce .9s infinite}',
    '.wcbot-typing span:nth-child(2){animation-delay:.15s}',
    '.wcbot-typing span:nth-child(3){animation-delay:.3s}',
    '@keyframes wcbot-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
    '#wcbot-form{padding:12px 16px;border-top:1px solid #f3f4f6;display:flex;gap:8px}',
    '#wcbot-input{flex:1;border:1px solid #e5e7eb;border-radius:100px;padding:10px 16px;font-size:14px;outline:none;font-family:inherit}',
    '#wcbot-input:focus{border-color:' + COLOR + ';box-shadow:0 0 0 3px ' + COLOR + '22}',
    '#wcbot-send{background:' + COLOR + ';border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#wcbot-send svg{width:18px;height:18px;fill:#fff}',
    '#wcbot-branding{text-align:center;padding:6px;font-size:10px;color:#d1d5db}',
    '#wcbot-branding a{color:#d1d5db;text-decoration:none}',
    '@media(max-width:400px){#wcbot-box{width:calc(100vw - 32px);right:16px;bottom:88px}}',
  ].join('');
  document.head.appendChild(style);

  // Build HTML
  var btn = document.createElement('button');
  btn.id = 'wcbot-btn';
  btn.setAttribute('aria-label', 'Chat avec ' + BIZ_NAME);
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  var box = document.createElement('div');
  box.id = 'wcbot-box';
  box.innerHTML = [
    '<div id="wcbot-header">',
    '  <div class="avatar">🤖</div>',
    '  <div class="info"><h3>' + BIZ_NAME + '</h3><p>Assistant IA · Répond instantanément</p></div>',
    '  <button id="wcbot-close" aria-label="Fermer">✕</button>',
    '</div>',
    '<div id="wcbot-messages"></div>',
    '<form id="wcbot-form">',
    '  <input id="wcbot-input" type="text" placeholder="Votre message..." autocomplete="off" maxlength="500">',
    '  <button id="wcbot-send" type="submit" aria-label="Envoyer">',
    '    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    '  </button>',
    '</form>',
    '<div id="wcbot-branding">Propulsé par <a href="https://klyora.fr" target="_blank" rel="noopener">Klyora Sites</a></div>',
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(box);

  var msgs = document.getElementById('wcbot-messages');
  var input = document.getElementById('wcbot-input');

  function addMsg(text, role) {
    var div = document.createElement('div');
    div.className = 'wcbot-msg ' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'wcbot-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;

    var typing = showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(-6) }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      typing.remove();
      var reply = d.reply || 'Désolé, une erreur est survenue. Veuillez réessayer.';
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
      input.disabled = false;
      input.focus();
    })
    .catch(function() {
      typing.remove();
      addMsg('Problème de connexion. Veuillez réessayer.', 'bot');
      input.disabled = false;
    });
  }

  // Welcome message
  addMsg(WELCOME, 'bot');
  history.push({ role: 'assistant', content: WELCOME });

  // Events
  btn.addEventListener('click', function() {
    isOpen = !isOpen;
    box.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#fff"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#fff"/></svg>';
    if (isOpen) setTimeout(function() { input.focus(); }, 100);
  });

  document.getElementById('wcbot-close').addEventListener('click', function() {
    isOpen = false;
    box.classList.remove('open');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#fff"/></svg>';
  });

  document.getElementById('wcbot-form').addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Auto-open after 5s (optional, can be disabled)
  // setTimeout(function() { if (!isOpen) btn.click(); }, 5000);
})();
`.trim();

  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
