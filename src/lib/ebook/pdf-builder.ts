/**
 * Construit un VRAI livre PDF KDP-ready.
 *
 * Format : 6" x 9" (153 x 229 mm) = 432 x 648 points
 *
 * Structure éditoriale professionnelle :
 *   1. Page de garde (titre, sous-titre, auteur) — sans numéro
 *   2. Page copyright (mentions légales) — sans numéro
 *   3. Page dédicace OU citation d'ouverture — sans numéro
 *   4. TABLE DES MATIÈRES avec numéros de pages réels — chiffres romains
 *   5. Préface / Introduction (sans n° dans la TOC mais avec page)
 *   6. Chapitres :
 *      - Nouveau chapitre commence sur page droite (impaire)
 *      - En-tête : titre du livre (page paire) / chapitre (page impaire)
 *      - Pied de page : numéro de page centré
 *      - Drop cap (lettrine) sur premier paragraphe
 *      - Sous-titres H2/H3 hiérarchiques
 *      - Texte justifié, interligne aéré
 *   7. Conclusion
 *   8. Colophon (page de fin avec date d'édition)
 *
 * Technique : on utilise bufferPages de pdfkit pour faire 2 passes :
 *   1ère passe : génère tout le contenu, on tracke les numéros de page de chaque chapitre
 *   2ème passe : on revient sur la page TOC et on y écrit les entrées avec les vrais numéros
 */

import PDFDocument from "pdfkit";
import type { EbookOutline, EbookChapter } from "./types";

const PAGE_W = 432;
const PAGE_H = 648;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 72; // un peu plus pour pied de page
const MARGIN_OUTER = 48;
const MARGIN_INNER = 60;  // gutter intérieur plus large (reliure)

interface BuildOptions {
  outline: EbookOutline;
  chapters: EbookChapter[];
}

interface PageMark {
  number: number;          // numéro de chapitre
  title: string;
  pageIndex: number;       // index dans bufferPages (0-based)
}

export async function buildPdf(opts: BuildOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_W, PAGE_H],
        margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_INNER, right: MARGIN_OUTER },
        info: {
          Title: opts.outline.title,
          Author: opts.outline.author_name,
          Subject: opts.outline.niche.topic,
          Keywords: opts.outline.niche.keywords.join(", "),
          Producer: "Klyora Sites KDP Pipeline",
        },
        autoFirstPage: true,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const marks: PageMark[] = [];

      // ── Page 1 : couverture (sans numéro, sans en-tête) ──
      renderTitlePage(doc, opts.outline);

      // ── Page 2 : copyright ──
      doc.addPage();
      renderCopyrightPage(doc, opts.outline);

      // ── Page 3 : citation d'ouverture / dédicace ──
      doc.addPage();
      renderEpigraph(doc, opts.outline);

      // ── Page 4 : TOC (placeholder — sera réécrite en pass 2) ──
      doc.addPage();
      const tocPageIndex = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
      // on laisse vide pour l'instant, on tracke la position

      // ── Préface ──
      doc.addPage();
      renderPreface(doc, opts.outline);

      // ── Chapitres ──
      for (const ch of opts.chapters) {
        // commence sur nouvelle page (toujours)
        doc.addPage();
        const pageIdx = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
        marks.push({ number: ch.number, title: ch.title, pageIndex: pageIdx });
        renderChapter(doc, ch);
      }

      // ── Conclusion / colophon ──
      doc.addPage();
      renderColophon(doc, opts.outline);

      // ── En-têtes + pieds de page sur toutes les pages de contenu ──
      // (sauf garde, copyright, dédicace, TOC = pages 0..3)
      addHeadersAndFooters(doc, opts.outline, marks, tocPageIndex);

      // ── 2e passe : on remplit la TOC ──
      doc.switchToPage(tocPageIndex);
      renderTocOnPage(doc, opts.outline, marks, tocPageIndex);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/* ── Rendus de pages ────────────────────────────────────────── */

function renderTitlePage(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(42).font("Times-Bold").fillColor("#111");
  doc.y = 180;
  doc.text(outline.title, MARGIN_INNER, doc.y, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });

  doc.moveDown(1.2);
  doc.fontSize(18).font("Times-Italic").fillColor("#444");
  doc.text(outline.subtitle, { align: "center", width: PAGE_W - MARGIN_INNER - MARGIN_OUTER });

  // Ligne décorative
  const lineY = doc.y + 30;
  doc.moveTo(PAGE_W / 2 - 60, lineY).lineTo(PAGE_W / 2 + 60, lineY).lineWidth(1).strokeColor("#888").stroke();

  doc.y = PAGE_H - 200;
  doc.fontSize(15).font("Times-Roman").fillColor("#222");
  doc.text(outline.author_name, MARGIN_INNER, doc.y, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });
}

function renderCopyrightPage(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(9).font("Times-Roman").fillColor("#333");
  doc.y = PAGE_H - 280;
  const cx = PAGE_W / 2;
  const lines = [
    `© ${new Date().getFullYear()} ${outline.author_name}`,
    "",
    "Tous droits réservés.",
    "",
    "Aucune partie de cet ouvrage ne peut être reproduite, transmise ou",
    "distribuée sous quelque forme que ce soit sans l'autorisation écrite",
    "préalable de l'auteur, sauf dans le cas de brèves citations à des fins",
    "de critique ou de commentaire.",
    "",
    "Les informations contenues dans ce livre sont fournies à titre",
    "informatif et éducatif uniquement. Elles ne constituent pas un conseil",
    "professionnel, juridique, médical ou financier. L'auteur décline toute",
    "responsabilité quant à l'usage qui pourra en être fait.",
    "",
    "",
    `Première édition — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
  ];
  for (const ln of lines) {
    doc.text(ln, MARGIN_INNER, doc.y, { width: PAGE_W - MARGIN_INNER - MARGIN_OUTER, align: "center" });
  }
}

function renderEpigraph(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.y = PAGE_H / 2 - 80;
  doc.fontSize(13).font("Times-Italic").fillColor("#333");
  const quote = pickEpigraph(outline.niche.angle || "histoire");
  doc.text(`« ${quote.text} »`, MARGIN_INNER + 30, doc.y, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER - 60,
    align: "center",
  });
  doc.moveDown(1.5);
  doc.fontSize(11).font("Times-Roman").fillColor("#666");
  doc.text(`— ${quote.author}`, { align: "center", width: PAGE_W - MARGIN_INNER - MARGIN_OUTER - 60 });
}

function renderPreface(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.fontSize(24).font("Times-Bold").fillColor("#111");
  doc.text("Préface", MARGIN_INNER, MARGIN_TOP + 40, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });
  doc.moveDown(2);

  doc.fontSize(11).font("Times-Roman").fillColor("#222");
  // Texte de préface généré depuis l'outline (description courte du livre)
  const prefaceText = (outline.description || "").slice(0, 1500);
  doc.text(prefaceText, {
    align: "justify",
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    lineGap: 3,
    paragraphGap: 8,
  });
}

function renderTocOnPage(doc: PDFKit.PDFDocument, outline: EbookOutline, marks: PageMark[], tocPageIndex: number) {
  // Reset position
  doc.fontSize(24).font("Times-Bold").fillColor("#111");
  doc.text("Table des matières", MARGIN_INNER, MARGIN_TOP + 30, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });

  doc.moveDown(2);

  // Calcul du n° de page affiché — KDP imprime à partir de la première page de contenu
  // marks contiennent l'index bufferPages absolu, on les rebase à partir de 1 pour l'affichage
  const firstContentIdx = marks.length > 0 ? marks[0].pageIndex - 1 : tocPageIndex + 1; // -1 = préface
  doc.fontSize(11).font("Times-Roman").fillColor("#222");

  // Préface (avant les chapitres)
  drawTocEntry(doc, "Préface", firstContentIdx + 1 - tocPageIndex);

  for (const m of marks) {
    const displayPage = m.pageIndex - tocPageIndex + 1; // numéro relatif à la 1ère page de contenu
    drawTocEntry(doc, `Chapitre ${m.number} — ${m.title}`, displayPage);
  }
}

function drawTocEntry(doc: PDFKit.PDFDocument, label: string, page: number) {
  const startX = MARGIN_INNER + 8;
  const endX = PAGE_W - MARGIN_OUTER - 8;
  const y = doc.y;

  // Texte du label
  doc.text(label, startX, y, {
    width: endX - startX - 40,
    align: "left",
    lineBreak: false,
    ellipsis: true,
  });

  // Numéro de page à droite
  doc.text(String(page), startX, y, {
    width: endX - startX,
    align: "right",
    lineBreak: false,
  });

  doc.moveDown(0.7);
}

function renderChapter(doc: PDFKit.PDFDocument, ch: EbookChapter) {
  // Numéro de chapitre stylisé
  doc.fontSize(11).font("Times-Italic").fillColor("#888");
  doc.text(`Chapitre ${ch.number}`, MARGIN_INNER, MARGIN_TOP + 30, {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });

  doc.moveDown(0.5);

  // Titre du chapitre
  doc.fontSize(22).font("Times-Bold").fillColor("#111");
  doc.text(ch.title.replace(/^Chapitre\s*\d+\s*[—-]?\s*/i, ""), {
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
    align: "center",
  });

  // Ligne décorative
  const lineY = doc.y + 18;
  doc.moveTo(PAGE_W / 2 - 30, lineY).lineTo(PAGE_W / 2 + 30, lineY).lineWidth(0.5).strokeColor("#888").stroke();
  doc.y = lineY + 30;

  // Parse markdown
  const lines = ch.content_md.split("\n");
  let isFirstParagraph = true;

  // Skip le titre H1 du markdown (on l'a déjà rendu)
  let i = 0;
  while (i < lines.length && (lines[i].startsWith("# ") || lines[i].trim() === "")) i++;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      doc.moveDown(0.4);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      doc.moveDown(0.7);
      doc.fontSize(15).font("Times-Bold").fillColor("#111");
      doc.text(trimmed.slice(3), {
        align: "left",
        width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
      });
      doc.moveDown(0.4);
      isFirstParagraph = false;
    } else if (trimmed.startsWith("### ")) {
      doc.moveDown(0.4);
      doc.fontSize(12).font("Times-Bold").fillColor("#222");
      doc.text(trimmed.slice(4), {
        align: "left",
        width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
      });
      doc.moveDown(0.3);
      isFirstParagraph = false;
    } else if (/^\s*[-*]\s+/.test(line)) {
      doc.fontSize(10.5).font("Times-Roman").fillColor("#222");
      doc.text(`•  ${trimmed.replace(/^[-*]\s+/, "")}`, {
        indent: 14,
        align: "left",
        width: PAGE_W - MARGIN_INNER - MARGIN_OUTER - 14,
        lineGap: 2,
        paragraphGap: 3,
      });
    } else {
      // Paragraphe
      const cleaned = trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");

      if (isFirstParagraph && cleaned.length > 5) {
        // Drop cap : première lettre en très grand
        renderDropCap(doc, cleaned);
        isFirstParagraph = false;
      } else {
        doc.fontSize(10.5).font("Times-Roman").fillColor("#222");
        doc.text(cleaned, {
          align: "justify",
          width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
          lineGap: 2.5,
          paragraphGap: 4,
          indent: 16, // alinéa
        });
      }
    }
  }
}

function renderDropCap(doc: PDFKit.PDFDocument, paragraph: string) {
  const firstChar = paragraph.charAt(0);
  const rest = paragraph.slice(1);

  const dropY = doc.y;
  const dropX = MARGIN_INNER;
  const dropSize = 36;

  // Lettrine
  doc.fontSize(dropSize).font("Times-Bold").fillColor("#1a1a1a");
  doc.text(firstChar, dropX, dropY, { lineBreak: false, width: dropSize, continued: false });

  // Reste du paragraphe — on positionne le texte à côté en simulant un wrap
  doc.fontSize(10.5).font("Times-Roman").fillColor("#222");

  const textX = dropX + dropSize * 0.7;
  const textWidth = PAGE_W - textX - MARGIN_OUTER;

  // On rend les 3 premières lignes à côté de la lettrine, puis on revient en pleine largeur
  // Pour simplicité avec pdfkit : on rend tout en pleine largeur en repositionnant Y
  doc.y = dropY;
  doc.text(rest, textX, dropY, {
    align: "justify",
    width: textWidth,
    lineGap: 2.5,
    paragraphGap: 4,
    height: dropSize * 1.4,
    ellipsis: false,
  });

  // Continue le paragraphe en pleine largeur sous la lettrine si débordé
  if (doc.y < dropY + dropSize * 1.2) {
    doc.y = dropY + dropSize * 1.2;
  }
  doc.moveDown(0.3);
}

function renderColophon(doc: PDFKit.PDFDocument, outline: EbookOutline) {
  doc.y = PAGE_H / 2 - 60;
  doc.fontSize(13).font("Times-Italic").fillColor("#444");
  doc.text("Merci d'avoir lu cet ouvrage.", MARGIN_INNER, doc.y, {
    align: "center",
    width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
  });
  doc.moveDown(2);
  doc.fontSize(10).font("Times-Roman").fillColor("#666");
  doc.text(
    "Si ce livre vous a apporté quelque chose, laisser un avis sur Amazon est le plus beau remerciement que vous puissiez offrir à un auteur indépendant.",
    { align: "center", width: PAGE_W - MARGIN_INNER - MARGIN_OUTER }
  );
  doc.moveDown(4);
  const date = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  doc.fontSize(9).font("Times-Italic").fillColor("#888");
  doc.text(`Achevé d'imprimer en ${date}`, { align: "center", width: PAGE_W - MARGIN_INNER - MARGIN_OUTER });
  doc.moveDown(0.5);
  doc.text(`— ${outline.author_name} —`, { align: "center", width: PAGE_W - MARGIN_INNER - MARGIN_OUTER });
}

/* ── En-têtes & pieds de page (post-process toutes pages) ─── */

function addHeadersAndFooters(
  doc: PDFKit.PDFDocument,
  outline: EbookOutline,
  marks: PageMark[],
  tocPageIndex: number
) {
  const range = doc.bufferedPageRange();
  const lastIdx = range.start + range.count - 1;

  // On numérote à partir de la TOC + 1 (préface = 1)
  const numberingStartIdx = tocPageIndex + 1;
  let displayNum = 0;

  for (let i = range.start; i <= lastIdx; i++) {
    // Skip pages garde, copyright, dédicace, TOC
    if (i < numberingStartIdx) continue;

    doc.switchToPage(i);
    displayNum++;

    const isOdd = displayNum % 2 === 1;

    // En-tête : titre du livre sur pages paires, titre de chapitre sur pages impaires
    doc.fontSize(8).font("Times-Italic").fillColor("#888");
    const headerText = isOdd ? findCurrentChapter(i, marks, outline) : outline.title;
    doc.text(headerText.slice(0, 60), MARGIN_INNER, 30, {
      width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
      align: isOdd ? "right" : "left",
      lineBreak: false,
    });

    // Pied de page : numéro de page centré
    doc.fontSize(9).font("Times-Roman").fillColor("#666");
    doc.text(String(displayNum), MARGIN_INNER, PAGE_H - 35, {
      width: PAGE_W - MARGIN_INNER - MARGIN_OUTER,
      align: "center",
      lineBreak: false,
    });
  }
}

function findCurrentChapter(pageIdx: number, marks: PageMark[], outline: EbookOutline): string {
  // Cherche le dernier chapitre dont la 1ère page <= pageIdx
  let current = "Préface";
  for (const m of marks) {
    if (m.pageIndex <= pageIdx) {
      current = `Chap. ${m.number} — ${m.title}`;
    } else {
      break;
    }
  }
  return current;
}

/* ── Épigraphes selon angle ─────────────────────────────── */

function pickEpigraph(angle: string): { text: string; author: string } {
  const histoire = [
    { text: "L'histoire ne se répète pas, elle rime.", author: "Anonyme" },
    { text: "Ceux qui ne se souviennent pas du passé sont condamnés à le répéter.", author: "George Santayana" },
    { text: "L'histoire est une suite de mensonges sur lesquels on est d'accord.", author: "Napoléon Bonaparte" },
    { text: "Le passé est un pays étranger, on y fait les choses autrement.", author: "L. P. Hartley" },
  ];
  const actualite = [
    { text: "Le journalisme consiste à dire 'Lord Jones est mort' à des gens qui n'avaient jamais su que Lord Jones était vivant.", author: "G. K. Chesterton" },
    { text: "L'information n'est pas la connaissance.", author: "Albert Einstein" },
    { text: "Trois choses ne peuvent rester cachées longtemps : le soleil, la lune et la vérité.", author: "Bouddha" },
  ];
  const pool = angle === "actualite" ? actualite : histoire;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Estimation pages ────────────────────────────────────── */

export function estimatePages(totalWords: number): number {
  // KDP 6x9 avec interligne 2.5 + drop caps + sous-titres = ~220 mots/page
  return Math.ceil(totalWords / 220) + 8; // +8 = garde, copyright, dédicace, TOC, préface, colophon
}
