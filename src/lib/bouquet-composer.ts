/**
 * Configurateur de bouquet interactif "Composer mon bouquet".
 *
 * Modal full-screen avec 2 colonnes :
 *   - Gauche : aperçu visuel qui change en temps réel (photo de référence
 *     qui mute selon la palette + badge palette dots + prix estimé big)
 *   - Droite : 4 étapes de configuration
 *       1. Occasion (6 pills)
 *       2. Palette de couleurs (6 cards avec preview palette)
 *       3. Taille / budget (slider 30→300€ avec preview taille)
 *       4. Date + coordonnées
 *
 * Mobile : stack vertical, modal bottom-sheet, scrollable.
 *
 * Réutilisable dans tous les templates fleuriste. Style hérité du
 * template parent via CSS variables (--primary, --bg, --line, etc.).
 */

export function buildBouquetComposer(slug: string): string {
  const slugSafe = slug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);

  return `
<!-- ═══════════════════ BOUQUET COMPOSER ═══════════════════ -->
<style>
  #bc-overlay {
    position: fixed; inset: 0;
    z-index: 60;
    background: rgba(20,15,15,0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: none;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
  }
  #bc-overlay.open { display: flex; }
  @keyframes bc-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes bc-slide-up {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  #bc-overlay.open { animation: bc-fade-in .35s ease forwards; }
  #bc-overlay.open .bc-modal { animation: bc-slide-up .5s cubic-bezier(.2,.8,.2,1) forwards; }

  .bc-modal {
    width: 100%; max-width: 1280px;
    margin: auto;
    background: var(--bg, #fff);
    border-radius: 0;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
    max-height: 100vh;
    position: relative;
  }
  @media (min-width: 900px) {
    .bc-modal {
      grid-template-columns: 1fr 1fr;
      border-radius: 8px;
      max-height: 92vh;
      margin: 4vh auto;
      box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    }
  }

  /* ─── COL GAUCHE : APERÇU VISUEL ───────────────────── */
  .bc-preview {
    position: relative;
    background: var(--surface, #f7eee8);
    min-height: 280px;
    overflow: hidden;
  }
  @media (min-width: 900px) {
    .bc-preview { min-height: 92vh; }
  }
  .bc-preview-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.6s cubic-bezier(.2,.8,.2,1), transform 8s cubic-bezier(.2,.8,.2,1);
  }
  .bc-preview-img.active { opacity: 1; transform: scale(1.02); }

  .bc-preview-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.55) 100%);
    pointer-events: none;
  }
  .bc-preview-info {
    position: absolute; left: 28px; right: 28px; bottom: 28px;
    color: #fff;
    z-index: 2;
  }
  @media (max-width: 899px) {
    .bc-preview { aspect-ratio: 4/3; min-height: 320px; }
    .bc-preview-info { left: 20px; right: 20px; bottom: 20px; }
  }

  .bc-preview-kicker {
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 600;
    opacity: 0.85;
    margin-bottom: 12px;
    font-family: var(--font-body);
  }
  .bc-preview-title {
    font-family: var(--font-heading);
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.05;
    font-weight: 500;
    margin: 0 0 16px;
  }
  .bc-preview-title em {
    font-style: italic;
  }
  .bc-preview-meta {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 18px;
    font-size: 13px;
    opacity: 0.95;
    font-family: var(--font-body);
  }
  .bc-palette-dots {
    display: inline-flex; gap: 4px;
  }
  .bc-palette-dot {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.8);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: transform 0.4s;
  }
  .bc-price-box {
    display: flex; align-items: baseline; gap: 12px;
    padding: 16px 20px;
    background: rgba(255,255,255,0.95);
    color: var(--fg, #1a1a1a);
    border-radius: 999px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    width: fit-content;
  }
  .bc-price-amount {
    font-family: var(--font-heading);
    font-size: 28px; font-weight: 500;
    line-height: 1;
    transition: color 0.3s;
  }
  .bc-price-note {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    opacity: 0.6;
  }

  /* ─── COL DROITE : ÉTAPES ───────────────────── */
  .bc-form {
    padding: 32px 28px 28px;
    overflow-y: auto;
    max-height: 100vh;
    position: relative;
  }
  @media (min-width: 900px) {
    .bc-form { padding: 56px 56px 48px; max-height: 92vh; }
  }
  .bc-close {
    position: absolute; top: 18px; right: 18px;
    width: 38px; height: 38px;
    background: var(--surface, #f4f0eb);
    border: none; border-radius: 50%;
    display: grid; place-items: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    z-index: 10;
  }
  .bc-close:hover { background: var(--line, #e2dcd5); transform: rotate(90deg); }
  .bc-close svg { color: var(--fg, #1a1a1a); }

  .bc-step { margin-bottom: 32px; }
  .bc-step-label {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 600;
    color: var(--fg-soft, #6b6b6b);
    margin-bottom: 16px;
  }
  .bc-step-num {
    display: inline-grid; place-items: center;
    width: 22px; height: 22px;
    background: var(--primary, #c89697);
    color: #fff;
    border-radius: 50%;
    font-size: 11px;
    font-family: var(--font-heading); font-weight: 500;
  }
  .bc-step-title {
    font-family: var(--font-heading);
    font-size: 22px;
    font-weight: 500;
    line-height: 1.15;
    margin: 0 0 18px;
    color: var(--fg, #1a1a1a);
  }
  .bc-step-title em { font-style: italic; color: var(--primary, #c89697); }

  /* ─── Pills (occasion) ───────────────────── */
  .bc-pills {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  @media (min-width: 540px) {
    .bc-pills { grid-template-columns: repeat(3, 1fr); }
  }
  .bc-pill {
    padding: 12px 14px;
    background: transparent;
    border: 1px solid var(--line, #e2dcd5);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    color: var(--fg, #1a1a1a);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.2s;
    text-align: center;
  }
  .bc-pill:hover { border-color: var(--primary, #c89697); transform: translateY(-1px); }
  .bc-pill.active {
    background: var(--fg, #1a1a1a);
    color: var(--bg, #fff);
    border-color: var(--fg, #1a1a1a);
  }

  /* ─── Palettes cards ───────────────────── */
  .bc-palettes {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 720px) {
    .bc-palettes { grid-template-columns: repeat(3, 1fr); }
  }
  .bc-palette {
    padding: 14px 12px;
    background: var(--bg, #fff);
    border: 1px solid var(--line, #e2dcd5);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.25s;
    text-align: left;
    font-family: var(--font-body);
  }
  .bc-palette:hover { border-color: var(--primary, #c89697); transform: translateY(-2px); box-shadow: 0 8px 24px -8px rgba(0,0,0,0.08); }
  .bc-palette.active {
    border-color: var(--fg, #1a1a1a);
    background: var(--surface, #f7eee8);
    transform: translateY(-2px);
  }
  .bc-palette-swatches {
    display: flex; gap: 4px; margin-bottom: 10px;
  }
  .bc-palette-swatch {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--bg, #fff);
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  }
  .bc-palette-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--fg, #1a1a1a);
    line-height: 1.2;
  }
  .bc-palette-desc {
    font-size: 11px;
    color: var(--fg-soft, #6b6b6b);
    margin-top: 3px;
  }

  /* ─── Slider budget ───────────────────── */
  .bc-budget {
    background: var(--surface, #f7eee8);
    border-radius: 14px;
    padding: 22px 20px 18px;
  }
  .bc-budget-row {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 14px;
  }
  .bc-budget-amount {
    font-family: var(--font-heading);
    font-size: 36px;
    font-weight: 500;
    color: var(--primary, #c89697);
    line-height: 1;
  }
  .bc-budget-size {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--fg-soft, #6b6b6b);
  }
  .bc-slider {
    width: 100%;
    -webkit-appearance: none; appearance: none;
    height: 4px;
    background: var(--line, #e2dcd5);
    border-radius: 999px;
    outline: none;
  }
  .bc-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px;
    background: var(--primary, #c89697);
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid var(--bg, #fff);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.15s;
  }
  .bc-slider::-webkit-slider-thumb:active { transform: scale(1.15); }
  .bc-slider::-moz-range-thumb {
    width: 22px; height: 22px;
    background: var(--primary, #c89697);
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid var(--bg, #fff);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .bc-budget-labels {
    display: flex; justify-content: space-between;
    margin-top: 10px;
    font-size: 11px;
    color: var(--fg-soft, #6b6b6b);
  }

  /* ─── Date input ───────────────────── */
  .bc-date {
    width: 100%;
    padding: 14px 16px;
    background: var(--surface, #f7eee8);
    border: 1px solid var(--line, #e2dcd5);
    border-radius: 10px;
    font-size: 15px;
    color: var(--fg, #1a1a1a);
    font-family: var(--font-body);
    outline: none;
    transition: border-color 0.2s;
  }
  .bc-date:focus { border-color: var(--primary, #c89697); }

  /* ─── Coordonnées inputs ───────────────────── */
  .bc-contact { display: flex; flex-direction: column; gap: 10px; }
  .bc-input {
    width: 100%;
    padding: 14px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--line, #e2dcd5);
    color: var(--fg, #1a1a1a);
    font-family: var(--font-body);
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
  }
  .bc-input:focus { border-color: var(--fg, #1a1a1a); }
  .bc-input::placeholder { color: var(--fg-soft, #6b6b6b); opacity: 0.7; }

  /* ─── Submit ───────────────────── */
  .bc-submit {
    width: 100%;
    margin-top: 24px;
    padding: 16px 28px;
    background: var(--fg, #1a1a1a);
    color: var(--bg, #fff);
    border: none;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: var(--font-body);
    transition: transform 0.2s, opacity 0.2s;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  }
  .bc-submit:hover { transform: translateY(-2px); }
  .bc-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ─── Success state ───────────────────── */
  .bc-success {
    display: none;
    text-align: center;
    padding: 60px 24px;
  }
  .bc-success.show { display: block; animation: bc-slide-up 0.4s ease forwards; }
  .bc-success-icon {
    width: 64px; height: 64px;
    margin: 0 auto 24px;
  }
  .bc-success h3 {
    font-family: var(--font-heading);
    font-size: 32px;
    font-weight: 500;
    margin: 0 0 12px;
  }
  .bc-success p {
    font-size: 15px;
    color: var(--fg-soft, #6b6b6b);
    line-height: 1.7;
    max-width: 380px;
    margin: 0 auto;
  }
</style>

<div id="bc-overlay" onclick="if(event.target===this) composerClose()">
  <div class="bc-modal">

    <!-- ── COL GAUCHE : APERÇU ── -->
    <div class="bc-preview">
      <img class="bc-preview-img active" id="bc-preview-img-0" alt="" loading="lazy"/>
      <img class="bc-preview-img" id="bc-preview-img-1" alt="" loading="lazy"/>
      <div class="bc-preview-overlay"></div>
      <div class="bc-preview-info">
        <div class="bc-preview-kicker" id="bc-preview-kicker">— Composez votre bouquet</div>
        <h3 class="bc-preview-title" id="bc-preview-title">
          Bouquet <em id="bc-preview-style">pastels doux</em>
        </h3>
        <div class="bc-preview-meta">
          <div class="bc-palette-dots" id="bc-preview-dots"></div>
          <span id="bc-preview-tiges">25 tiges · taille L</span>
        </div>
        <div class="bc-price-box">
          <span class="bc-price-amount" id="bc-price-amount">85 €</span>
          <span class="bc-price-note">prix estimatif</span>
        </div>
      </div>
    </div>

    <!-- ── COL DROITE : ÉTAPES ── -->
    <div class="bc-form">
      <button class="bc-close" onclick="composerClose()" aria-label="Fermer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div id="bc-default-view">
        <!-- Étape 1 : Occasion -->
        <div class="bc-step">
          <div class="bc-step-label"><span class="bc-step-num">1</span> Occasion</div>
          <h4 class="bc-step-title">Pour quelle <em>occasion</em> ?</h4>
          <div class="bc-pills" id="bc-occasions">
            <button class="bc-pill" data-occ="Anniversaire">Anniversaire</button>
            <button class="bc-pill" data-occ="Saint-Valentin">Saint-Valentin</button>
            <button class="bc-pill" data-occ="Mariage">Mariage</button>
            <button class="bc-pill" data-occ="Naissance">Naissance</button>
            <button class="bc-pill" data-occ="Deuil">Deuil</button>
            <button class="bc-pill" data-occ="Sans raison">Sans raison</button>
          </div>
        </div>

        <!-- Étape 2 : Palette -->
        <div class="bc-step">
          <div class="bc-step-label"><span class="bc-step-num">2</span> Couleurs</div>
          <h4 class="bc-step-title">Quelle <em>palette</em> ?</h4>
          <div class="bc-palettes" id="bc-palettes"></div>
        </div>

        <!-- Étape 3 : Budget / taille -->
        <div class="bc-step">
          <div class="bc-step-label"><span class="bc-step-num">3</span> Taille & budget</div>
          <h4 class="bc-step-title">Quel <em>budget</em> ?</h4>
          <div class="bc-budget">
            <div class="bc-budget-row">
              <div class="bc-budget-amount" id="bc-budget-amount">85 €</div>
              <div class="bc-budget-size" id="bc-budget-size">Taille L · 25 tiges</div>
            </div>
            <input type="range" id="bc-slider" class="bc-slider" min="30" max="300" step="5" value="85" oninput="bcUpdateBudget(this.value)"/>
            <div class="bc-budget-labels">
              <span>30 €</span>
              <span>Royal 300 €</span>
            </div>
          </div>
        </div>

        <!-- Étape 4 : Date + coordonnées -->
        <div class="bc-step">
          <div class="bc-step-label"><span class="bc-step-num">4</span> Quand & qui</div>
          <h4 class="bc-step-title"><em>Quand</em> le voulez-vous ?</h4>
          <input type="date" id="bc-date" class="bc-date" style="margin-bottom:14px"/>
          <form onsubmit="bcSubmit(event)" class="bc-contact">
            <input type="text" id="bc-name" class="bc-input" placeholder="Votre nom" required>
            <input type="tel" id="bc-phone" class="bc-input" placeholder="Téléphone" required>
            <input type="email" id="bc-email" class="bc-input" placeholder="Email (facultatif)">
            <textarea id="bc-msg" rows="2" class="bc-input" placeholder="Dédicace ou précisions (facultatif)" style="resize:none"></textarea>
            <button type="submit" class="bc-submit">
              Recevoir ma proposition
              <span aria-hidden>→</span>
            </button>
          </form>
        </div>
      </div>

      <div class="bc-success" id="bc-success">
        <svg class="bc-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary)"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        <h3>Merci.</h3>
        <p>Votre fleuriste vous rappelle sous 24 h pour finaliser la composition et la livraison.</p>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
  var SLUG = ${JSON.stringify(slugSafe)};

  // 6 palettes, chacune avec : nom court, description, 3 couleurs, photo de référence
  var PALETTES = [
    {
      id: 'pastels', name: 'Pastels doux', desc: 'Tendre, romantique',
      swatches: ['#fce7f3', '#fef3c7', '#dbeafe'],
      photo: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1400&auto=format&fit=crop&q=85'
    },
    {
      id: 'romantique', name: 'Romantique rose', desc: 'Roses & pivoines',
      swatches: ['#f9a8d4', '#ec4899', '#c084fc'],
      photo: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1400&auto=format&fit=crop&q=85'
    },
    {
      id: 'vif', name: 'Vif & joyeux', desc: 'Couleurs vives, éclat',
      swatches: ['#ec4899', '#facc15', '#f97316'],
      photo: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1400&auto=format&fit=crop&q=85'
    },
    {
      id: 'champetre', name: 'Champêtre', desc: 'Naturel, saisonnier',
      swatches: ['#b08968', '#87a96b', '#fef3c7'],
      photo: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1400&auto=format&fit=crop&q=85'
    },
    {
      id: 'blanc', name: 'Blanc pur', desc: 'Élégance, mariage',
      swatches: ['#ffffff', '#fef3c7', '#6b8e5a'],
      photo: 'https://images.unsplash.com/photo-1469259943454-aa100abba749?w=1400&auto=format&fit=crop&q=85'
    },
    {
      id: 'automne', name: 'Automne chaud', desc: 'Terres brûlées',
      swatches: ['#ea580c', '#9a3412', '#ca8a04'],
      photo: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1400&auto=format&fit=crop&q=85'
    }
  ];

  // 4 tranches de taille selon budget (€ → tiges + label)
  function sizeForBudget(b) {
    if (b < 50)  return { tiges: 12, label: 'Délicat',  taille: 'S' };
    if (b < 90)  return { tiges: 20, label: 'Standard', taille: 'M' };
    if (b < 160) return { tiges: 32, label: 'Généreux', taille: 'L' };
    return { tiges: 50, label: 'Royal', taille: 'XL' };
  }

  var bcData = { occasion: null, palette: 'pastels', budget: 85, name: '', phone: '', email: '', message: '', date: '' };
  var bcOpened = false;

  // Init dynamique des palettes (HTML)
  function bcInitPalettes() {
    var html = '';
    PALETTES.forEach(function(p, i){
      html += '<button class="bc-palette' + (i === 0 ? ' active' : '') + '" data-palette="' + p.id + '">';
      html += '  <div class="bc-palette-swatches">';
      p.swatches.forEach(function(c){ html += '<span class="bc-palette-swatch" style="background:' + c + '"></span>'; });
      html += '  </div>';
      html += '  <div class="bc-palette-name">' + p.name + '</div>';
      html += '  <div class="bc-palette-desc">' + p.desc + '</div>';
      html += '</button>';
    });
    document.getElementById('bc-palettes').innerHTML = html;
    // Event listeners
    document.querySelectorAll('.bc-palette').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('.bc-palette').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        bcData.palette = btn.dataset.palette;
        bcUpdatePreview();
      });
    });
  }

  // Wire occasion pills
  function bcInitOccasions() {
    document.querySelectorAll('.bc-pill').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('.bc-pill').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        bcData.occasion = btn.dataset.occ;
      });
    });
  }

  // Update preview image + meta + price
  var bcImgToggle = 0;
  function bcUpdatePreview() {
    var pal = PALETTES.find(function(p){ return p.id === bcData.palette; }) || PALETTES[0];
    // Crossfade entre 2 imgs pour smoothness
    var imgNext = document.getElementById('bc-preview-img-' + (bcImgToggle ? 0 : 1));
    var imgCurr = document.getElementById('bc-preview-img-' + bcImgToggle);
    imgNext.src = pal.photo;
    imgNext.onload = function(){
      imgNext.classList.add('active');
      imgCurr.classList.remove('active');
      bcImgToggle = bcImgToggle ? 0 : 1;
    };
    // Update meta
    document.getElementById('bc-preview-style').textContent = pal.name.toLowerCase();
    // Palette dots
    var dots = '';
    pal.swatches.forEach(function(c){ dots += '<span class="bc-palette-dot" style="background:' + c + '"></span>'; });
    document.getElementById('bc-preview-dots').innerHTML = dots;
    // Update tiges / taille selon budget
    var s = sizeForBudget(bcData.budget);
    document.getElementById('bc-preview-tiges').textContent = s.tiges + ' tiges · taille ' + s.taille;
  }

  window.bcUpdateBudget = function(val) {
    bcData.budget = parseInt(val, 10);
    document.getElementById('bc-budget-amount').textContent = bcData.budget + ' €';
    document.getElementById('bc-price-amount').textContent = bcData.budget + ' €';
    var s = sizeForBudget(bcData.budget);
    document.getElementById('bc-budget-size').textContent = 'Taille ' + s.taille + ' · ' + s.tiges + ' tiges · ' + s.label;
    document.getElementById('bc-preview-tiges').textContent = s.tiges + ' tiges · taille ' + s.taille;
  };

  window.composerOpen = function() {
    var ov = document.getElementById('bc-overlay');
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!bcOpened) {
      bcOpened = true;
      bcInitPalettes();
      bcInitOccasions();
      bcUpdatePreview();
    }
    // Date min = aujourd'hui
    var today = new Date().toISOString().split('T')[0];
    var dateInput = document.getElementById('bc-date');
    if (dateInput && !dateInput.min) dateInput.min = today;
  };

  window.composerClose = function() {
    document.getElementById('bc-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  // Esc to close
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && document.getElementById('bc-overlay').classList.contains('open')) {
      composerClose();
    }
  });

  window.bcSubmit = function(e) {
    e.preventDefault();
    bcData.name = document.getElementById('bc-name').value;
    bcData.phone = document.getElementById('bc-phone').value;
    bcData.email = document.getElementById('bc-email').value;
    bcData.message = document.getElementById('bc-msg').value;
    bcData.date = document.getElementById('bc-date').value;
    var pal = PALETTES.find(function(p){ return p.id === bcData.palette; }) || PALETTES[0];
    var s = sizeForBudget(bcData.budget);
    fetch('/api/prospect/contact-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        type: 'bouquet_composer',
        name: bcData.name,
        phone: bcData.phone,
        email: bcData.email,
        message: 'Composition demandée — Occasion: ' + (bcData.occasion || '-') +
                 ' | Palette: ' + pal.name +
                 ' | Budget: ' + bcData.budget + '€ (' + s.tiges + ' tiges, taille ' + s.taille + ')' +
                 ' | Date: ' + (bcData.date || 'non précisée') +
                 (bcData.message ? ' | Note: ' + bcData.message : ''),
      }),
      keepalive: true
    }).catch(function(){});
    document.getElementById('bc-default-view').style.display = 'none';
    document.getElementById('bc-success').classList.add('show');
    setTimeout(function(){ composerClose(); document.getElementById('bc-default-view').style.display = ''; document.getElementById('bc-success').classList.remove('show'); }, 4500);
  };
})();
</script>
<!-- ═══════════════════ /BOUQUET COMPOSER ═══════════════════ -->
`;
}
