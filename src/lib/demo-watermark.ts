/**
 * Watermark "Maquette de démonstration" + lien de suppression auto-service.
 *
 * Injecté avant </body> sur toutes les pages servies par /prospects/[slug].
 * Objectif : désamorcer les plaintes juridiques en montrant la bonne foi
 * dès le premier coup d'œil + offrir un opt-out en 1 clic.
 *
 * Discret (12 px en bas, transparent), mais cliquable. Pas de modale, pas
 * de JS lourd : juste un <a> + un <div> stylé inline.
 */

export function buildDemoWatermarkSnippet(prospectEmail: string | null | undefined, prospectWebsite: string | null | undefined): string {
  // Construit l'URL de suppression avec pré-remplissage email/domain
  const params = new URLSearchParams();
  if (prospectEmail) params.set("email", prospectEmail);
  if (prospectWebsite) {
    const cleanDomain = prospectWebsite
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    if (cleanDomain) params.set("domain", cleanDomain);
  }
  const query = params.toString();
  const supprimerUrl = `https://klyora.fr/supprimer${query ? `?${query}` : ""}`;

  // CSS inline pour éviter toute collision avec le mockup
  return `
<!-- KLYORA-DEMO-WATERMARK-START -->
<style>
  #klyora-demo-wm {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483646;
    background: rgba(15, 15, 17, 0.78);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    color: #fff;
    font-family: -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    text-align: center;
    transition: opacity 0.2s ease;
  }
  #klyora-demo-wm[data-collapsed="1"] {
    opacity: 0;
    pointer-events: none;
  }
  #klyora-demo-wm span { opacity: 0.88; }
  #klyora-demo-wm a {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 600;
    opacity: 1;
  }
  #klyora-demo-wm a:hover { color: #c19a56; }
  #klyora-demo-wm button {
    background: none;
    border: 1px solid rgba(255,255,255,0.28);
    color: #fff;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    margin-left: 4px;
  }
  #klyora-demo-wm button:hover { background: rgba(255,255,255,0.12); }
  @media (max-width: 480px) {
    #klyora-demo-wm { font-size: 11px; padding: 6px 10px; gap: 8px; }
  }
</style>
<div id="klyora-demo-wm" role="contentinfo" aria-label="Mention légale de démonstration">
  <span>Maquette de démonstration générée par Klyora · sans engagement</span>
  <a href="${supprimerUrl}" target="_blank" rel="noopener">Retirer cette maquette</a>
  <button type="button" onclick="this.parentElement.dataset.collapsed='1';setTimeout(function(){var e=document.getElementById('klyora-demo-wm');if(e)e.style.display='none';},220);" aria-label="Masquer">×</button>
</div>
<!-- KLYORA-DEMO-WATERMARK-END -->
`;
}

/**
 * Retire toute version précédente du watermark déjà présente dans le HTML
 * (utile pour idempotence : le DB-stocké mockup_html peut contenir une
 * version stale si l'utilisateur a re-sauvegardé via /save-edit).
 */
export function stripOldDemoWatermark(html: string): string {
  return html.replace(/<!-- KLYORA-DEMO-WATERMARK-START -->[\s\S]*?<!-- KLYORA-DEMO-WATERMARK-END -->/g, "");
}
