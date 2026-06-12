/**
 * GET /api/admin/brevo-trademark-proof
 *
 * Génère à la volée un PDF de "Preuve d'usage du nom commercial Klyora Sites"
 * pour upload dans le formulaire Brevo Sender ID.
 *
 * Le PDF contient :
 *   1. En-tête Klyora Sites
 *   2. Déclaration d'usage du nom commercial
 *   3. Capture du site (URL + screenshot référencé)
 *   4. Mentions légales (URL)
 *   5. Date + signature électronique
 *
 * Accepté par Brevo comme justificatif de propriété de marque.
 */

import { NextRequest } from "next/server";
import { safeCompare } from "@/lib/security";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth simple via query string OU header (pour téléchargement direct depuis navigateur)
  const queryKey = req.nextUrl.searchParams.get("key") || "";
  const headerKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(queryKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(headerKey, process.env.ADMIN_SECRET_KEY)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pdfBuffer = await buildTrademarkPdf();
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="webconceptor-trademark-proof.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

function buildTrademarkPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        info: {
          Title: "Preuve d'usage du nom commercial Klyora Sites",
          Author: "Klyora Sites",
          Subject: "Justificatif pour enregistrement Sender ID SMS chez Brevo",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── En-tête ──
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#0a0a0a");
      doc.text("Klyora Sites", { align: "left" });
      doc.fontSize(11).font("Helvetica").fillColor("#666");
      doc.text("https://klyora.fr", { align: "left" });
      doc.text("contact@klyora.fr · 06 35 59 24 71", { align: "left" });
      doc.moveDown(2);

      // ── Titre ──
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#0a0a0a");
      doc.text("Preuve d'usage du nom commercial", { align: "center" });
      doc.fontSize(13).font("Helvetica");
      doc.text("Justificatif pour enregistrement Sender ID SMS", { align: "center" });
      doc.moveDown(3);

      // ── Déclaration ──
      doc.fontSize(11).font("Helvetica").fillColor("#0a0a0a");
      const declaration = `Je soussigné, gérant de Klyora Sites, déclare sur l'honneur :

1. Exploiter activement le nom commercial "Klyora Sites" pour mon activité de création de sites web professionnels destinés aux artisans, commerces de proximité et indépendants en France.

2. Être propriétaire du nom de domaine klyora.fr (enregistrement actif vérifiable via WHOIS public).

3. Utiliser ce nom commercial publiquement sur :
   - Le site web https://klyora.fr (accessible publiquement)
   - Les emails transactionnels envoyés à mes prospects et clients
   - Les communications téléphoniques (numéro : 06 35 59 24 71)
   - Les supports marketing en ligne

4. Avoir besoin de l'identifiant alphanumérique "WebConcept" (10 caractères, version compactée de "Klyora Sites" pour respecter la limite Brevo de 11 caractères) pour identifier mes envois SMS transactionnels auprès de mes prospects et clients.

5. M'engager à respecter strictement :
   - Les obligations légales françaises (RGPD, ARCEP, code des postes)
   - La fourniture systématique d'une mention "STOP" pour désabonnement
   - L'absence d'envoi de SMS marketing de masse non sollicités
   - Le respect des horaires d'envoi autorisés (couvre-feu 8h-19h)

6. Tous mes envois SMS sont strictement TRANSACTIONNELS et font suite à un point de contact préalable avec le destinataire (envoi d'une maquette personnalisée de son site web).`;

      doc.text(declaration, { align: "justify", lineGap: 3, paragraphGap: 6 });
      doc.moveDown(2);

      // ── Références ──
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Références publiques vérifiables :", { align: "left" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
      doc.text("• Site web actif : https://klyora.fr");
      doc.text("• Mentions légales : https://klyora.fr/mentions-legales");
      doc.text("• Politique de confidentialité : https://klyora.fr/confidentialite");
      doc.text("• Téléphone de contact : 06 35 59 24 71");
      doc.text("• Email de contact : contact@klyora.fr");
      doc.moveDown(2);

      // ── Date + signature ──
      doc.fontSize(11).font("Helvetica");
      const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`Fait le ${today}, à des fins exclusives d'enregistrement Sender ID auprès de Brevo (Sendinblue SAS).`, { align: "left" });
      doc.moveDown(2);
      doc.fontSize(13).font("Helvetica-BoldOblique");
      doc.text("Tom — Klyora Sites", { align: "right" });
      doc.fontSize(9).font("Helvetica").fillColor("#888");
      doc.text("Document généré électroniquement", { align: "right" });

      // ── Pied de page ──
      doc.fontSize(8).font("Helvetica").fillColor("#999");
      const footer = "Ce document est un justificatif de propriété d'usage du nom commercial Klyora Sites destiné à l'enregistrement de l'identifiant SMS \"WebConcept\" auprès de Brevo, dans le cadre de la procédure ARCEP pour les expéditeurs alphanumériques en France.";
      doc.text(footer, 60, 760, { width: 475, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
