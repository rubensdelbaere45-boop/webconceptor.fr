/**
 * Helpers partagés par toutes les libs mockup-stitch-{metier}-pixel.ts.
 * Ces fonctions remplacent les sections fictives (horaires/avis) des
 * templates Stitch par les vraies données du prospect.
 */

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * Parse "lundi: 08:30 – 12:00, 13:30 – 18:00 | mardi: …" → bloc HTML
 * grille `<p>Jour</p> <p>Heures</p>` (compatible templates Stitch).
 */
export function renderStitchHoursGrid(hoursStr: string | null | undefined): string {
  if (!hoursStr) {
    return `<p>Mar - Sam</p> <p class="font-bold">09:00 — 19:00</p>
<p>Lundi & Dim.</p> <p>Fermé</p>`;
  }
  const lines = hoursStr.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) {
    return `<p>Mar - Sam</p> <p class="font-bold">09:00 — 19:00</p>
<p>Lundi & Dim.</p> <p>Fermé</p>`;
  }
  return lines.map(line => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return `<p>${esc(line)}</p> <p></p>`;
    const day = esc(m[1].trim());
    const hrs = esc(m[2].trim());
    const closed = /ferm[ée]/i.test(hrs);
    return `<p class="capitalize">${day}</p> <p class="${closed ? "" : "font-bold"}">${hrs}</p>`;
  }).join("\n");
}

/**
 * Parse "lundi: 08:30 - 18:00 | …" → liste inline compacte (fallback
 * pour templates qui utilisent `<br/>` au lieu d'une grille).
 */
export function renderStitchHoursInline(hoursStr: string | null | undefined, fallback: string): string {
  if (!hoursStr) return fallback;
  const lines = hoursStr.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return fallback;
  return lines.map(line => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return esc(line);
    return `${esc(m[1].trim())} : ${esc(m[2].trim())}`;
  }).join("<br/>");
}

type Review = { author?: string; rating?: number; text?: string; timeAgo?: string };

/**
 * Génère N témoignages au format compatible templates Stitch boulangerie/cafe :
 * `<div class="bg-white p-10 rounded-2xl shadow-sm italic ...">"texte"<p>— Auteur</p></div>`
 */
export function renderStitchTestimonialsBoulangerieStyle(
  reviews: Review[] | null | undefined,
  fallbackOrig: Array<{ text: string; author: string }>,
  cardCss: string = 'bg-white p-10 rounded-2xl shadow-sm italic text-lg leading-relaxed text-on-surface-variant relative',
  authorCss: string = 'not-italic font-bold text-sm text-on-surface mt-6 uppercase tracking-widest',
): string {
  const real = (reviews || [])
    .filter(r => r.text && (r.text || "").length > 30)
    .slice(0, 3)
    .map(r => ({ text: (r.text || "").slice(0, 280), author: r.author || "Client" }));
  const chosen = real.length === 3 ? real : (real.length > 0 ? [...real, ...fallbackOrig.slice(real.length)] : fallbackOrig);
  return chosen.map(r => `<div class="${cardCss}">
                    "${esc(r.text)}"
                    <p class="${authorCss}">— ${esc(r.author)}</p>
</div>`).join("\n");
}
