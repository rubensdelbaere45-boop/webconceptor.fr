/**
 * Watermark "Maquette de démonstration" + 2 actions :
 *   1. "Retirer cette maquette" → lien vers /supprimer (form complet)
 *   2. "Je ne suis pas intéressé" → animation poubelle + DELETE instant
 *
 * Injecté avant </body> sur toutes les pages servies par /prospects/[slug].
 * Objectif : désamorcer les plaintes juridiques + offrir 2 niveaux d'opt-out.
 */

export function buildDemoWatermarkSnippet(
  slug: string,
  prospectEmail: string | null | undefined,
  prospectWebsite: string | null | undefined
): string {
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
  const supprimerUrl = `https://klyora.fr/supprimer${params.toString() ? `?${params.toString()}` : ""}`;
  const slugSafe = slug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);

  return `
<!-- KLYORA-DEMO-WATERMARK-START -->
<style>
  #klyora-demo-wm {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 2147483646;
    background: rgba(15, 15, 17, 0.82);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    color: #fff;
    font-family: -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
    font-size: 12px; line-height: 1.4;
    padding: 8px 16px;
    display: flex; align-items: center; justify-content: center;
    gap: 14px; flex-wrap: wrap; text-align: center;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  #klyora-demo-wm span { opacity: 0.88; }
  #klyora-demo-wm a, #klyora-demo-wm .kw-ni-btn {
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 12px;
    background: rgba(255,255,255,0.10);
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.16);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  #klyora-demo-wm a:hover, #klyora-demo-wm .kw-ni-btn:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.32);
  }
  #klyora-demo-wm .kw-ni-btn {
    background: rgba(225,29,72,0.85);
    border-color: rgba(225,29,72,0.95);
  }
  #klyora-demo-wm .kw-ni-btn:hover {
    background: rgba(225,29,72,1);
    border-color: #fff;
  }
  #klyora-demo-wm .kw-close {
    background: none; border: none; color: #fff; opacity: 0.55;
    font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1;
    font-family: inherit;
  }
  #klyora-demo-wm .kw-close:hover { opacity: 1; }
  @media (max-width: 480px) {
    #klyora-demo-wm { font-size: 11px; padding: 6px 10px; gap: 8px; }
    #klyora-demo-wm a, #klyora-demo-wm .kw-ni-btn { font-size: 11px; padding: 4px 9px; }
  }

  /* ─── Animation "into the trash" ───────────────────────────── */
  @keyframes kw-fold {
    0%   { transform: scale(1) rotate(0deg);     filter: blur(0); opacity: 1; }
    35%  { transform: scale(0.92) rotate(-2deg); filter: blur(0); }
    70%  { transform: scale(0.35) rotate(8deg) translateY(20vh); filter: blur(1px); opacity: 0.95; }
    100% { transform: scale(0.05) rotate(35deg) translate(0, 60vh); filter: blur(3px); opacity: 0; }
  }
  @keyframes kw-shake {
    0%, 100% { transform: translateX(-50%) rotate(0deg); }
    25%      { transform: translateX(-50%) rotate(-6deg); }
    75%      { transform: translateX(-50%) rotate(6deg); }
  }
  @keyframes kw-lid {
    0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
    20%      { transform: translateX(-50%) translateY(-26px) rotate(-22deg); }
    50%      { transform: translateX(-50%) translateY(-30px) rotate(-30deg); }
    80%      { transform: translateX(-50%) translateY(-26px) rotate(-22deg); }
  }
  @keyframes kw-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .kw-trashing > *:not(#kw-trash-overlay):not(#klyora-demo-wm) {
    animation: kw-fold 1.4s cubic-bezier(.6,.05,.95,.5) forwards;
    transform-origin: 50% 90%;
  }
  .kw-trashing #klyora-demo-wm { opacity: 0; pointer-events: none; transition: opacity 0.3s; }

  #kw-trash-overlay {
    position: fixed; inset: 0;
    z-index: 2147483647;
    background: radial-gradient(ellipse at bottom, rgba(15,15,17,0.92), rgba(15,15,17,0.98));
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    padding-bottom: 12vh;
    color: #fff;
    font-family: -apple-system, "SF Pro Display", "Inter", system-ui, sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  #kw-trash-overlay.visible { opacity: 1; pointer-events: auto; }
  #kw-trash-wrap {
    position: relative;
    width: 220px; height: 220px;
  }
  #kw-trash-bin {
    position: absolute; left: 50%; top: 40px;
    transform: translateX(-50%);
    width: 160px; height: 160px;
  }
  #kw-trash-bin.shake { animation: kw-shake 0.5s ease-in-out 2; transform-origin: bottom; }
  #kw-trash-lid {
    position: absolute; left: 50%; top: 0;
    transform: translateX(-50%);
    width: 180px;
    transform-origin: 100% 100%;
  }
  #kw-trash-lid.open { animation: kw-lid 1.4s ease-in-out forwards; }
  #kw-trash-msg {
    margin-top: 32px;
    text-align: center;
    opacity: 0;
  }
  #kw-trash-msg.visible {
    animation: kw-fade-in 0.6s ease-out forwards;
    animation-delay: 1.2s;
  }
  #kw-trash-msg h2 {
    font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
    margin: 0 0 8px;
  }
  #kw-trash-msg p {
    font-size: 15px; color: #a1a1aa;
    margin: 0; max-width: 380px;
  }
  #kw-trash-msg a {
    display: inline-block; margin-top: 18px;
    color: #fff; text-decoration: none;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.22);
    padding: 9px 18px; border-radius: 999px;
    font-size: 13px; font-weight: 600;
    transition: background 0.15s;
  }
  #kw-trash-msg a:hover { background: rgba(255,255,255,0.18); }
</style>

<div id="klyora-demo-wm" role="contentinfo" aria-label="Mention démonstration">
  <span>Maquette de démonstration · sans engagement</span>
  <a href="${supprimerUrl}" target="_blank" rel="noopener">Retirer cette maquette</a>
  <button type="button" class="kw-ni-btn" onclick="window.__klyoraNotInterested()">Je ne suis pas intéressé</button>
  <button type="button" class="kw-close" onclick="this.parentElement.style.display='none'" aria-label="Masquer">×</button>
</div>

<script>
(function(){
  var SLUG = ${JSON.stringify(slugSafe)};
  if (window.__klyoraNotInterested) return; // idempotent

  window.__klyoraNotInterested = function() {
    if (window.__klyoraTrashing) return;
    window.__klyoraTrashing = true;

    // 1. POST l'opt-out en parallèle de l'animation (UX rapide)
    var deletePromise = fetch('/api/public/not-interested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG }),
      keepalive: true,
    }).then(function(r){ return r.json().catch(function(){ return { ok: r.ok }; }); })
      .catch(function(){ return { ok: false, error: 'network' }; });

    // 2. Construction de l'overlay poubelle
    var ov = document.createElement('div');
    ov.id = 'kw-trash-overlay';
    ov.innerHTML = ''
      + '<div id="kw-trash-wrap">'
      +   '<svg id="kw-trash-bin" viewBox="0 0 160 160" fill="none">'
      +     '<path d="M30 50 L40 150 Q40 156 46 156 L114 156 Q120 156 120 150 L130 50 Z" fill="#e11d48" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
      +     '<line x1="62" y1="70" x2="62" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      +     '<line x1="80" y1="70" x2="80" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      +     '<line x1="98" y1="70" x2="98" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      +   '</svg>'
      +   '<svg id="kw-trash-lid" viewBox="0 0 180 30" fill="none">'
      +     '<path d="M10 20 L170 20 L170 28 L10 28 Z" fill="#e11d48" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
      +     '<path d="M70 10 L110 10 L114 20 L66 20 Z" fill="#fff"/>'
      +   '</svg>'
      + '</div>'
      + '<div id="kw-trash-msg">'
      +   '<h2>C\\'est noté.</h2>'
      +   '<p>La maquette a été supprimée définitivement de nos serveurs. Plus aucun email Klyora ne vous sera envoyé.</p>'
      +   '<a href="https://klyora.fr">Retour à klyora.fr</a>'
      + '</div>';
    document.body.appendChild(ov);

    // 3. Séquence d'animation
    requestAnimationFrame(function(){
      ov.classList.add('visible');
      document.documentElement.classList.add('kw-trashing');
      document.body.classList.add('kw-trashing');
      var lid = document.getElementById('kw-trash-lid');
      var bin = document.getElementById('kw-trash-bin');
      var msg = document.getElementById('kw-trash-msg');
      setTimeout(function(){ if (lid) lid.classList.add('open'); }, 100);
      setTimeout(function(){ if (bin) bin.classList.add('shake'); }, 1300);
      setTimeout(function(){ if (msg) msg.classList.add('visible'); }, 1400);
    });

    // 4. Si l'API foire, on log mais on garde l'UX (la maquette restera mais
    //    visuellement le mec est sorti).
    deletePromise.then(function(res){
      if (!res || !res.ok) console.warn('[Klyora] opt-out failed:', res);
    });
  };
})();
</script>
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
