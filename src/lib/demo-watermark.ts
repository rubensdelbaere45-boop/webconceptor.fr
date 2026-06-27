/**
 * Watermark bas de page injecté sur toutes les /prospects/[slug] :
 *   - Bouton "Voir sur mobile" (desktop only, cache sur mobile et dans iframe)
 *     → ouvre un overlay avec un frame iPhone qui charge la même URL en iframe
 *   - Bouton rouge "Je ne suis pas intéressé · Supprimer ma maquette"
 *     → POST /api/public/not-interested + animation poubelle + redirect
 *
 * Le watermark est auto-masqué quand affiché DANS l'iframe de preview mobile
 * (détection `window.self !== window.top`) pour éviter la récursion.
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
  #klyora-demo-wm .kw-ni-btn,
  #klyora-demo-wm .kw-mobile-btn {
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 12px;
    padding: 5px 14px;
    border-radius: 999px;
    cursor: pointer;
    font-family: inherit;
    border: 1px solid transparent;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  #klyora-demo-wm .kw-ni-btn {
    background: rgba(225,29,72,0.85);
    border-color: rgba(225,29,72,0.95);
  }
  #klyora-demo-wm .kw-ni-btn:hover { background: rgba(225,29,72,1); border-color: #fff; }
  #klyora-demo-wm .kw-ni-btn:disabled { opacity: 0.6; cursor: wait; }
  #klyora-demo-wm .kw-mobile-btn {
    background: rgba(59,130,246,0.85);
    border-color: rgba(59,130,246,0.95);
    /* visible uniquement >= md */
    display: none;
  }
  #klyora-demo-wm .kw-mobile-btn:hover { background: rgba(59,130,246,1); border-color: #fff; }
  @media (min-width: 1024px) { #klyora-demo-wm .kw-mobile-btn { display: inline-flex; } }
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

  /* ─── Animation "into the trash" ───────────────────── */
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

  .kw-trashing > *:not(#kw-trash-overlay):not(#klyora-demo-wm):not(#kw-mp-overlay) {
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

  /* ════════ MOBILE PREVIEW OVERLAY (frame iPhone) ════════ */
  #kw-mp-overlay {
    position: fixed; inset: 0;
    z-index: 2147483645;
    background: radial-gradient(ellipse at center, rgba(20,20,30,.94) 0%, rgba(0,0,0,.97) 100%);
    display: none;
    align-items: center; justify-content: center;
    padding: 40px 20px;
    opacity: 0;
    transition: opacity .3s ease;
  }
  #kw-mp-overlay.visible { display: flex; opacity: 1; }
  .kw-mp-controls {
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 10px;
    z-index: 10;
  }
  .kw-mp-btn {
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(20px);
    color: #fff;
    border: 1px solid rgba(255,255,255,.18);
    padding: 8px 16px;
    border-radius: 999px;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: background .15s, transform .12s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .kw-mp-btn:hover { background: rgba(255,255,255,.22); transform: translateY(-1px); }
  .kw-mp-btn.primary { background: #3b82f6; border-color: #3b82f6; }
  .kw-mp-btn.primary:hover { background: #2563eb; }
  .kw-mp-device-row {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 8px;
    background: rgba(255,255,255,.08);
    padding: 6px;
    border-radius: 999px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.1);
    z-index: 10;
  }
  .kw-mp-device-row button {
    background: transparent;
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 999px;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    transition: background .12s;
  }
  .kw-mp-device-row button.active { background: rgba(255,255,255,.18); }
  .kw-mp-device-row button:hover { background: rgba(255,255,255,.10); }

  /* Frame iPhone — couleurs deep titanium */
  .kw-phone-frame {
    position: relative;
    background: linear-gradient(135deg, #1f1f23 0%, #2a2a2f 50%, #1a1a1f 100%);
    border-radius: 56px;
    padding: 14px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.06) inset,
      0 30px 80px -20px rgba(0,0,0,.7),
      0 10px 32px rgba(0,0,0,.5);
    transition: width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1), transform .35s;
  }
  .kw-phone-screen {
    position: relative;
    background: #000;
    border-radius: 42px;
    overflow: hidden;
    width: 390px; height: 844px;
    transition: width .35s, height .35s;
  }
  .kw-phone-frame[data-device="galaxy"] .kw-phone-screen { width: 360px; height: 800px; }
  .kw-phone-frame[data-device="ipad"]   .kw-phone-screen { width: 600px; height: 800px; border-radius: 24px; }
  .kw-phone-frame[data-device="ipad"]   { border-radius: 38px; padding: 18px; }
  .kw-phone-frame[data-rotation="landscape"] .kw-phone-screen { width: 844px; height: 390px; }
  .kw-phone-frame[data-rotation="landscape"][data-device="galaxy"] .kw-phone-screen { width: 800px; height: 360px; }
  .kw-phone-frame[data-rotation="landscape"][data-device="ipad"]   .kw-phone-screen { width: 800px; height: 600px; }

  /* Dynamic Island (iPhone) */
  .kw-phone-notch {
    position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 32px;
    background: #000;
    border-radius: 999px;
    z-index: 5;
    pointer-events: none;
  }
  .kw-phone-frame[data-device="galaxy"] .kw-phone-notch {
    width: 8px; height: 8px; top: 14px;
  }
  .kw-phone-frame[data-device="ipad"] .kw-phone-notch { display: none; }
  .kw-phone-frame[data-rotation="landscape"] .kw-phone-notch { display: none; }

  .kw-phone-iframe {
    width: 100%; height: 100%;
    border: none;
    background: #fff;
  }

  /* Scaling automatique pour grand écran */
  @media (max-height: 920px) {
    .kw-phone-frame { transform: scale(0.85); transform-origin: center; }
  }
  @media (max-height: 800px) {
    .kw-phone-frame { transform: scale(0.72); }
  }
  @media (max-height: 700px) {
    .kw-phone-frame { transform: scale(0.62); }
  }
</style>

<div id="klyora-demo-wm" role="contentinfo" aria-label="Mention démonstration">
  <span>Maquette de démonstration · sans engagement</span>
  <button type="button" class="kw-mobile-btn" onclick="window.__klyoraMobilePreview()" aria-label="Voir sur mobile">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    Voir sur mobile
  </button>
  <button type="button" class="kw-ni-btn" onclick="window.__klyoraNotInterested(this)">
    Je ne suis pas intéressé · Supprimer ma maquette
  </button>
  <button type="button" class="kw-close" onclick="this.parentElement.style.display='none'" aria-label="Masquer">×</button>
</div>

<script>
(function(){
  var SLUG = ${JSON.stringify(slugSafe)};

  /* ── Récursion : si on est déjà dans une iframe, on cache tout ── */
  try {
    if (window.self !== window.top) {
      var wm = document.getElementById('klyora-demo-wm');
      if (wm) wm.style.display = 'none';
      return; // skip toute initialisation
    }
  } catch (e) {}

  if (window.__klyoraNotInterested) return;

  /* ══════════════════ MOBILE PREVIEW ══════════════════ */
  window.__klyoraMobilePreview = function() {
    var existing = document.getElementById('kw-mp-overlay');
    if (existing) { existing.classList.add('visible'); return; }
    var currentUrl = window.location.pathname + window.location.search;

    var ov = document.createElement('div');
    ov.id = 'kw-mp-overlay';
    ov.innerHTML = ''
      + '<div class="kw-mp-controls">'
      +   '<button class="kw-mp-btn" onclick="window.__klyoraClosePreview()">'
      +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      +     'Fermer'
      +   '</button>'
      +   '<button class="kw-mp-btn" onclick="window.__klyoraRotatePreview()">'
      +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
      +     'Pivoter'
      +   '</button>'
      +   '<button class="kw-mp-btn" onclick="document.getElementById(\\'kw-phone-iframe\\').contentWindow.location.reload()">'
      +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden><polyline points="23 4 23 10 17 10"/><path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10"/></svg>'
      +     'Recharger'
      +   '</button>'
      + '</div>'
      + '<div class="kw-phone-frame" id="kw-phone-frame" data-device="iphone" data-rotation="portrait">'
      +   '<div class="kw-phone-screen">'
      +     '<div class="kw-phone-notch"></div>'
      +     '<iframe class="kw-phone-iframe" id="kw-phone-iframe" src="' + currentUrl + '" loading="lazy" allow="fullscreen"></iframe>'
      +   '</div>'
      + '</div>'
      + '<div class="kw-mp-device-row">'
      +   '<button data-device="iphone" class="active" onclick="window.__klyoraSetDevice(\\'iphone\\')">iPhone 14 Pro</button>'
      +   '<button data-device="galaxy" onclick="window.__klyoraSetDevice(\\'galaxy\\')">Galaxy S23</button>'
      +   '<button data-device="ipad" onclick="window.__klyoraSetDevice(\\'ipad\\')">iPad mini</button>'
      + '</div>';
    document.body.appendChild(ov);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function(){ ov.classList.add('visible'); });

    // Esc to close
    ov.addEventListener('click', function(e){
      if (e.target === ov) window.__klyoraClosePreview();
    });
    document.addEventListener('keydown', function escHandler(e){
      if (e.key === 'Escape') {
        window.__klyoraClosePreview();
        document.removeEventListener('keydown', escHandler);
      }
    });
  };

  window.__klyoraClosePreview = function() {
    var ov = document.getElementById('kw-mp-overlay');
    if (!ov) return;
    ov.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 300);
  };

  window.__klyoraRotatePreview = function() {
    var frame = document.getElementById('kw-phone-frame');
    if (!frame) return;
    var cur = frame.getAttribute('data-rotation');
    frame.setAttribute('data-rotation', cur === 'portrait' ? 'landscape' : 'portrait');
  };

  window.__klyoraSetDevice = function(dev) {
    var frame = document.getElementById('kw-phone-frame');
    if (!frame) return;
    frame.setAttribute('data-device', dev);
    document.querySelectorAll('.kw-mp-device-row button').forEach(function(b){
      b.classList.toggle('active', b.dataset.device === dev);
    });
  };

  /* ══════════════════ NOT INTERESTED ══════════════════ */
  window.__klyoraNotInterested = function(btn) {
    if (window.__klyoraTrashing) return;
    window.__klyoraTrashing = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Suppression…'; }

    var deletePromise = fetch('/api/public/not-interested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG }),
      keepalive: true,
    }).then(function(r){ return r.json().catch(function(){ return { ok: r.ok }; }); })
      .catch(function(){ return { ok: false, error: 'network' }; });

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

    var animDone = new Promise(function(resolve){ setTimeout(resolve, 2000); });
    Promise.all([deletePromise, animDone]).then(function(arr){
      var res = arr[0];
      if (!res || !res.ok) console.warn('[Klyora] opt-out failed:', res);
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
