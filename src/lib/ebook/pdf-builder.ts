/**
 * Construit un PDF Amazon KDP-ready depuis l'outline + chapitres.
 *
 * Format : 6" x 9" (153 x 229 mm) = 432 x 648 points pdfkit
 * Marges : intérieure 0.75", extérieure 0.5", haut/bas 0.75"
 *
 * Le PDF inclut :
 *   - Page de garde (titre, sous-titre, auteur)
 *   - Page copyright minimaliste
 *   - Table des matières
 *   - Chapitres avec H1/H2 stylisés + paragraphes justifiés
 *   - Pas d'images dans le corps (KDP imprime en N&B, on évite les surprises)
 */

import PDFDocument from "pdfkit";
import type { EbookOutline, EbookChapter } from "./types";

// Format 6"x9" en points (1 inch = 72 pts)
const PAGE_WIDTH = 432;
const PAGE_HEIGHT = 648;
const MARGIN = 54; // 0.75"

interface BuildOptions {
  outline: EbookOutline;
  chapters: EbookChapter[];
}

export function buildPdf(opts: BuildOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        info: {
          Title: opts.outline.title,
          Author: opts.outline.author_name,
          Subject: opts.outline.niche.topic,
          Keywords: opts.outline.niche.keywords.join(", "),
        },
        autoFirstPage: true,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ─── Page de garde ────────────────────────────────
      renderCoverPage(doc, opts.outline);

      // ─── Page copyright ───────────────────────────────
      doc.addPage();
      renderCopyrightPage(doc, opts.outline);

      // ─── Table des matières ───────────────────────────
      doc.addPage();
      renderToc(doc, opts.outline);

      // ─── Chapitres ────────────────────────────────────
      for (const ch of opts.chapters) {
        doc.addPage();
        renderChapter(doc, ch);
      }

      // ─── Page de fin ──────────────────────────────────
      doc.addPage();
      renderEndPage(doc, opts.outline);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderCoverPage(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(36).font("Times-Bold");
  doc.moveDown(4);
  doc.text(outline.title, { align: "center" });

  doc.moveDown(1);
  doc.fontSize(18).font("Times-Italic");
  doc.text(outline.subtitle, { align: "center" });

  doc.moveDown(10);
  doc.fontSize(14).font("Times-Roman");
  doc.text(outline.author_name, { align: "center" });
}

function renderCopyrightPage(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(10).font("Times-Roman");
  doc.moveDown(20);
  doc.text(`© ${new Date().getFullYear()} ${outline.author_name}`, { align: "center" });
  doc.moveDown(1);
  doc.text("Tous droits réservés.", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(8);
  doc.text(
    "Aucune partie de cet ouvrage ne peut être reproduite, transmise ou distribuée sous quelque forme que ce soit sans l'autorisation écrite préalable de l'auteur.",
    { align: "center", width: PAGE_WIDTH - 2 * MARGIN }
  );
  doc.moveDown(2);
  doc.text("Les informations contenues dans ce livre sont fournies à titre informatif uniquement et ne constituent pas un conseil professionnel.", {
    align: "center",
    width: PAGE_WIDTH - 2 * MARGIN,
  });
}

function renderToc(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(22).font("Times-Bold").text("Table des matières", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(11).font("Times-Roman");
  for (const ch of outline.chapters) {
    doc.text(`${ch.number}. ${ch.title}`, { align: "left" });
    doc.moveDown(0.5);
  }
}

function renderChapter(doc: PDFKit.PDFDocument, ch: EbookChapter) {
  // Parse markdown très basique : ##  → H2, **gras**, listes -
  const lines = ch.content_md.split("\n");
  let inFirstHeading = true;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("# ")) {
      // Titre chapitre (H1)
      if (!inFirstHeading) doc.addPage();
      doc.fontSize(24).font("Times-Bold");
      doc.text(line.slice(2), { align: "left" });
      doc.moveDown(1);
      inFirstHeading = false;
    } else if (line.startsWith("## ")) {
      doc.moveDown(0.5);
      doc.fontSize(16).font("Times-Bold");
      doc.text(line.slice(3), { align: "left" });
      doc.moveDown(0.5);
    } else if (line.startsWith("### ")) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Times-Bold");
      doc.text(line.slice(4), { align: "left" });
      doc.moveDown(0.3);
    } else if (/^\s*[-*]\s+/.test(line)) {
      doc.fontSize(11).font("Times-Roman");
      doc.text(`• ${line.replace(/^\s*[-*]\s+/, "")}`, {
        indent: 12,
        align: "left",
        lineGap: 2,
      });
    } else if (line === "") {
      doc.moveDown(0.5);
    } else {
      doc.fontSize(11).font("Times-Roman");
      const cleaned = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
      doc.text(cleaned, {
        align: "justify",
        lineGap: 2,
      });
    }
  }
}

function renderEndPage(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(14).font("Times-Italic");
  doc.moveDown(15);
  doc.text("Merci de votre lecture.", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(11).font("Times-Roman");
  doc.text(`Si cet ouvrage vous a été utile, un avis Amazon nous aiderait beaucoup.`, { align: "center" });
  doc.moveDown(4);
  doc.fontSize(10);
  doc.text(`— ${outline.author_name}`, { align: "center" });
}

/** Estime le nombre de pages depuis le total de mots (KDP 6x9 ~ 250 mots/page) */
export function estimatePages(totalWords: number): number {
  return Math.ceil(totalWords / 250) + 4; // +4 pour garde, copyright, TOC, fin
}
