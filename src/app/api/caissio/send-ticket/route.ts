import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════════════════════════════
   POST /api/caissio/send-ticket
   Envoie un ticket de caisse par email via Brevo.
   ══════════════════════════════════════════════════════════════════ */

interface TicketItem { name: string; qty: number; price: number }

interface TicketBody {
  toEmail:       string;
  storeName:     string;
  storeAddress?: string;
  siret?:        string;
  ticketNum:     string;
  items:         TicketItem[];
  subtotal:      number;
  discount:      number;
  total:         number;
  payMode:       string;
  cashGiven?:    number;
  change?:       number;
  customerName?: string;
}

const PAY_LABEL: Record<string, string> = {
  cash: "Espèces", card: "Carte bancaire", account: "Sur compte", mixed: "Mixte",
};

function fmt(n: number) { return n.toFixed(2) + " €"; }

export async function POST(req: NextRequest) {
  const body = await req.json() as TicketBody;
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey)        return NextResponse.json({ error: "Email non configuré" }, { status: 503 });
  if (!body.toEmail)  return NextResponse.json({ error: "Email manquant" },     { status: 400 });

  const itemsHtml = body.items.map((i) => `
    <tr>
      <td style="padding:7px 0;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">
        ${i.name}${i.qty > 1 ? ` <span style="color:#94a3b8">×${i.qty}</span>` : ""}
      </td>
      <td style="padding:7px 0;font-size:13px;font-weight:700;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9">
        ${fmt(i.price * i.qty)}
      </td>
    </tr>`).join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#0f172a;padding:28px 24px;text-align:center">
    <div style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">🧾 Ticket de caisse</div>
    <div style="color:#fff;font-size:22px;font-weight:800">${body.storeName}</div>
    ${body.storeAddress ? `<div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px">${body.storeAddress}</div>` : ""}
    ${body.siret ? `<div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:2px">SIRET : ${body.siret}</div>` : ""}
  </div>

  <!-- Body -->
  <div style="padding:24px">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span style="font-size:12px;color:#6b7280">Ticket n°</span>
      <span style="font-size:12px;font-weight:700;color:#0f172a;font-family:monospace">#${body.ticketNum}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <span style="font-size:12px;color:#6b7280">Date</span>
      <span style="font-size:12px;font-weight:600;color:#374151">${new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</span>
    </div>

    ${body.customerName ? `<div style="background:#eff6ff;border-radius:8px;padding:8px 12px;margin-bottom:16px;font-size:12px;color:#1e40af">👤 Client : <strong>${body.customerName}</strong></div>` : ""}

    <!-- Articles -->
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:6px 0;font-size:11px;font-weight:700;color:#94a3b8;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Article</th>
          <th style="padding:6px 0;font-size:11px;font-weight:700;color:#94a3b8;text-align:right;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <!-- Totaux -->
    <div style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;color:#6b7280">Sous-total</span>
        <span style="font-size:13px;color:#374151;font-weight:600">${fmt(body.subtotal)}</span>
      </div>
      ${body.discount > 0 ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;color:#059669">Remise</span>
        <span style="font-size:13px;color:#059669;font-weight:700">-${fmt(body.discount)}</span>
      </div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #0f172a;margin-top:6px">
        <span style="font-size:16px;font-weight:800;color:#0f172a">TOTAL</span>
        <span style="font-size:22px;font-weight:900;color:#4f46e5">${fmt(body.total)}</span>
      </div>
    </div>

    <!-- Règlement -->
    <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;margin-top:12px">
      <div style="font-size:12px;color:#6b7280">Règlement : <strong style="color:#0f172a">${PAY_LABEL[body.payMode] || body.payMode}</strong></div>
      ${body.cashGiven ? `<div style="font-size:12px;color:#6b7280;margin-top:4px">Remis : <strong>${fmt(body.cashGiven)}</strong></div>` : ""}
      ${body.change && body.change > 0 ? `<div style="font-size:12px;color:#059669;font-weight:700;margin-top:4px">Rendu : ${fmt(body.change)}</div>` : ""}
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8">
    Merci de votre visite 🙏 · Propulsé par <strong style="color:#4f46e5">Caissio</strong>
  </div>
</div>
</body>
</html>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender:     { name: body.storeName, email: "contact@webconceptor.fr" },
        to:         [{ email: body.toEmail }],
        subject:    `🧾 Votre ticket — ${body.storeName}`,
        htmlContent: html,
      }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[caissio/send-ticket]", e);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}
