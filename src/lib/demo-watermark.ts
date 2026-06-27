/**
 * Watermark bas de page : un seul bouton d'opt-out.
 *   Click → POST /api/public/not-interested (DELETE le prospect en DB)
 *        → animation poubelle (~1.6 s)
 *        → redirect vers /maquette-supprimee
 *
 * Une fois supprimé, retour sur /prospects/<slug> retourne un 404 natif
 * géré par la route GET (data null → "Maquette introuvable").
 */

export function buildDemoWatermarkSnippet(slug: string): string {
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
    transition: opacity 0.2s ease;
  }
  #klyora-demo-wm span { opacity: 0.88; }
  #klyora-demo-wm .kw-ni-btn {
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 12px;
    background: rgba(225,29,72,0.85);
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid rgba(225,29,72,0.95);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  #klyora-demo-wm .kw-ni-btn:hover {
    background: rgba(225,29,72,1);
    border-color: #fff;
  }
  #klyora-demo-wm .kw-ni-btn:disabled {
    opacity: 0.6; cursor: wait;
  }
  #klyora-demo-wm .kw-close {
    background: none; border: none; color: #fff; opacity: 0.55;
    font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1;
    font-family: inherit;
  }
  #klyora-demo-wm .kw-close:hover { opacity: 1; }
  @media (max-width: 480px) {
    #klyora-demo-wm { font-size: 11px; padding: 6px 10px; gap: 8px; }
    #klyora-demo-wm .kw-ni-btn { font-size: 11px; padding: 4px 10px; }
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

  .kw-trashing > *:not(#kw-trash-overlay):not(#klyora-demo-wm) {
    animation: kw-fold 1.4s cubic-bezier(.6,.05,.95,.5) forwards;
    transform-origin: 50% 90%;
  }
  .kw-trashing #klyora-demo-wm { opacity: 0; pointer-events: none; transition: opacity 0.3s; }

  #kw-trash-overlay {
    position: fixed; inset: 0;
    z-index: 2147483647;
    background: radial-gradient(ellipse at bottom, rgba(15,15,17,0.92), rgba(15,15,17,0.98));
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  #kw-trash-overlay.visible { opacity: 1; pointer-events: auto; }
  #kw-trash-bin {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: 180px; height: 180px;
  }
  #kw-trash-bin.shake { animation: kw-shake 0.5s ease-in-out 2; transform-origin: bottom; }
  #kw-trash-lid {
    position: absolute; left: 50%; top: calc(50% - 100px);
    transform: translateX(-50%);
    width: 200px;
    transform-origin: 100% 100%;
  }
  #kw-trash-lid.open { animation: kw-lid 1.4s ease-in-out forwards; }
</style>

<div id="klyora-demo-wm" role="contentinfo" aria-label="Mention démonstration">
  <span>Maquette de démonstration · sans engagement</span>
  <button type="button" class="kw-ni-btn" onclick="window.__klyoraNotInterested(this)">
    Je ne suis pas intéressé · Supprimer ma maquette
  </button>
  <button type="button" class="kw-close" onclick="this.parentElement.style.display='none'" aria-label="Masquer">×</button>
</div>

<script>
(function(){
  var SLUG = ${JSON.stringify(slugSafe)};
  if (window.__klyoraNotInterested) return;

  window.__klyoraNotInterested = function(btn) {
    if (window.__klyoraTrashing) return;
    window.__klyoraTrashing = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Suppression…'; }

    // 1. DELETE en parallèle de l'animation (UX rapide)
    var deletePromise = fetch('/api/public/not-interested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG }),
      keepalive: true,
    }).then(function(r){ return r.json().catch(function(){ return { ok: r.ok }; }); })
      .catch(function(){ return { ok: false, error: 'network' }; });

    // 2. Overlay poubelle
    var ov = document.createElement('div');
    ov.id = 'kw-trash-overlay';
    ov.innerHTML = ''
      + '<svg id="kw-trash-bin" viewBox="0 0 160 160" fill="none">'
      +   '<path d="M30 50 L40 150 Q40 156 46 156 L114 156 Q120 156 120 150 L130 50 Z" fill="#e11d48" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
      +   '<line x1="62" y1="70" x2="62" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      +   '<line x1="80" y1="70" x2="80" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      +   '<line x1="98" y1="70" x2="98" y2="138" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
      + '</svg>'
      + '<svg id="kw-trash-lid" viewBox="0 0 200 32" fill="none">'
      +   '<path d="M10 20 L190 20 L190 30 L10 30 Z" fill="#e11d48" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
      +   '<path d="M78 10 L122 10 L126 20 L74 20 Z" fill="#fff"/>'
      + '</svg>';
    document.body.appendChild(ov);

    requestAnimationFrame(function(){
      ov.classList.add('visible');
      document.documentElement.classList.add('kw-trashing');
      document.body.classList.add('kw-trashing');
      var lid = document.getElementById('kw-trash-lid');
      var bin = document.getElementById('kw-trash-bin');
      setTimeout(function(){ if (lid) lid.classList.add('open'); }, 100);
      setTimeout(function(){ if (bin) bin.classList.add('shake'); }, 1300);
    });

    // 3. Attend l'API ET la fin de l'animation (~2s), puis redirect
    var animDone = new Promise(function(resolve){ setTimeout(resolve, 2000); });
    Promise.all([deletePromise, animDone]).then(function(arr){
      var res = arr[0];
      if (!res || !res.ok) {
        console.warn('[Klyora] opt-out failed:', res);
        // On redirige quand même : la page d'erreur sera plus claire que de rester bloqué
      }
      window.location.href = '/maquette-supprimee';
    });
  };
})();
</script>
<!-- KLYORA-DEMO-WATERMARK-END -->
`;
}

export function stripOldDemoWatermark(html: string): string {
  return html.replace(/<!-- KLYORA-DEMO-WATERMARK-START -->[\s\S]*?<!-- KLYORA-DEMO-WATERMARK-END -->/g, "");
}
