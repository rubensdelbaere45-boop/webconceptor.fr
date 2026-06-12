/* ══════════════════════════════════════════
   SNIPPET SALES UI INJECTABLE
   Injecté via /prospects/[slug]/route.ts pour TOUTE maquette qui n'a pas
   déjà de `.wc-cta-bar` native (épicerie legacy, adaptive non-restaurant…).

   Fournit :
   - CTA bar fixe en haut : bandeau noir + bouton doré "Je commande ce site →"
   - Modal d'achat : étape 1 sélection plan, étape 2 formulaire complet
     avec domain picker (vérification /api/domain-check, marge 15% silencieuse)
   - Adresse TOUJOURS affichée (les 2 plans)
   - localStorage : persistance clé 'wc_buyer_snippet'
   - Soumission vers /api/prospect/checkout → Stripe redirect

   Les restaurants ont leur propre sales UI native dans mockup-restaurant.ts
   (plus riche, avec domain picker, réservation, chat IA) — l'injection
   détecte et ne fait rien dans ce cas.
   ══════════════════════════════════════════ */

/**
 * Retourne le bloc <style>+<div>+<script> à injecter avant </body> des
 * maquettes qui n'ont pas de CTA d'achat natif.
 */
export function buildSalesUiSnippet(slug: string, prospectName: string, isLuxury = false): string {
  // Pricing adapté au tier
  const basePrice = isLuxury ? "860" : "320";
  const basePriceNbsp = isLuxury ? "860&nbsp;€" : "320&nbsp;€";
  const subPrice = isLuxury ? "75" : "50";
  const klarna = isLuxury ? "3 × 286,67&nbsp;€" : "3 × 106,67&nbsp;€";
  const planLabel = isLuxury ? "Création Exclusive" : "Simple";
  const planSub = isLuxury ? "Design exclusif sur-mesure, livraison 7 jours" : "ou 3× sans frais (106,67&nbsp;€)";
  void basePrice; // used below via template literals
  const safeName = prospectName.replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c]!));
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 100);

  return `
<!-- WC-SX-START -->
<style>
/* ─── CTA bar fixe en haut ─────────────────────────────────── */
.wc-sx-cta{position:fixed;top:0;left:0;right:0;z-index:9996;background:#111;height:54px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 2px 24px rgba(0,0,0,0.5);font-family:-apple-system,'Helvetica Neue',Arial,sans-serif}
.wc-sx-cta-left{display:flex;align-items:center;gap:24px;flex:1;min-width:0;overflow:hidden}
.wc-sx-cta-title{color:#fff;font-size:15px;font-weight:700;white-space:nowrap}
.wc-sx-cta-trust{display:flex;align-items:center;gap:10px}
.wc-sx-cta-t{color:rgba(255,255,255,0.5);font-size:12px;white-space:nowrap}
.wc-sx-cta-dot{color:rgba(255,255,255,0.2);font-size:12px}
.wc-sx-cta-btn{padding:11px 26px;background:#FFD700;color:#0a0a0a;font-weight:800;font-size:14px;border:none;border-radius:100px;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;transition:transform 0.15s,box-shadow 0.15s;white-space:nowrap;flex-shrink:0}
.wc-sx-cta-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,215,0,0.45)}
/* ─── Override : les pills Klyora Sites descendent sous la CTA bar */
.wc-home-btn{top:64px !important}
.wc-demo-badge{top:64px !important}
body{padding-top:54px !important}
@media(max-width:760px){.wc-sx-cta-trust{display:none}}
@media(max-width:500px){
  .wc-sx-cta{padding:0 14px;height:50px}
  .wc-sx-cta-title{font-size:13px}
  .wc-sx-cta-btn{padding:9px 16px;font-size:12px}
  body{padding-top:50px !important}
  .wc-home-btn{top:60px !important}
  .wc-demo-badge{top:60px !important}
}

/* ─── Modal overlay ──────────────────────────────────────────── */
.wc-sx-overlay{position:fixed;inset:0;z-index:10000;background:rgba(10,10,10,0.72);backdrop-filter:blur(6px);display:none;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.wc-sx-overlay.open{display:flex}
.wc-sx-modal{background:#fff;max-width:540px;width:100%;border-radius:16px;padding:28px 28px 24px;box-shadow:0 30px 80px rgba(0,0,0,0.4);position:relative;margin:auto;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;box-sizing:border-box}
.wc-sx-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border:none;background:#f0f0f0;color:#1a1a1a;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wc-sx-close:hover{background:#e0e0e0}
.wc-sx-kicker{font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#0066ff;margin-bottom:6px}
.wc-sx-modal h3{font-size:22px;font-weight:700;margin:0 0 4px;letter-spacing:-0.01em;padding-right:36px}
.wc-sx-modal>.wc-sx-subtitle{font-size:13px;color:#6b6b6b;margin-bottom:18px;line-height:1.5}
.wc-sx-trust{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
.wc-sx-trust span{font-size:11px;padding:4px 10px;background:#f5f5f5;border-radius:100px;color:#525252;font-weight:500;white-space:nowrap}

/* ─── Étape 1 : plans ───────────────────────────────────────── */
.wc-sx-step{display:none}
.wc-sx-step.active{display:block}
.wc-sx-label{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b6b;margin-bottom:10px;display:block}
.wc-sx-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.wc-sx-plan{border:2px solid #eee;border-radius:10px;padding:14px 12px;cursor:pointer;transition:all 0.15s;background:#fff;position:relative;text-align:left}
.wc-sx-plan:hover{border-color:#0066ff}
.wc-sx-plan.selected{border-color:#0066ff;background:#f0f6ff;box-shadow:0 2px 12px rgba(0,102,255,0.08)}
.wc-sx-plan.recommended::before{content:'RECOMMANDÉ';position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#0066ff;color:#fff;font-size:9px;font-weight:800;letter-spacing:0.15em;padding:3px 8px;border-radius:100px;white-space:nowrap}
.wc-sx-plan-title{font-size:14px;font-weight:700;margin-bottom:3px}
.wc-sx-plan-price{font-size:17px;font-weight:800;color:#0066ff;margin-bottom:2px}
.wc-sx-plan-sub{font-size:10px;color:#6b6b6b;margin-bottom:8px;line-height:1.4}
.wc-sx-plan ul{list-style:none;padding:0;margin:0;font-size:11px;color:#1a1a1a;line-height:1.5}
.wc-sx-plan li{padding:2px 0 2px 14px;position:relative}
.wc-sx-plan li::before{content:'✓';position:absolute;left:0;color:#0066ff;font-weight:700}
.wc-sx-step1-next{width:100%;padding:13px;background:#0a0a0a;color:#FFD700;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;border:none;letter-spacing:0.08em;text-transform:uppercase;transition:background 0.2s;margin-top:4px}
.wc-sx-step1-next:hover{background:#0066ff}

/* ─── Étape 2 : formulaire ──────────────────────────────────── */
.wc-sx-back{background:none;border:none;color:#0066ff;font-size:12px;cursor:pointer;padding:0;margin-bottom:12px;display:inline-flex;align-items:center;gap:4px;font-weight:600}
.wc-sx-back:hover{text-decoration:underline}
.wc-sx-plan-recap{background:#f5f5f5;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px}
.wc-sx-plan-recap strong{color:#0066ff}
.wc-sx-field{margin-bottom:10px}
.wc-sx-field label{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b6b6b;margin-bottom:4px;display:block}
.wc-sx-field input,.wc-sx-field select{width:100%;padding:9px 11px;border:1px solid #ddd;border-radius:8px;font-size:14px;color:#1a1a1a;outline:none;font-family:inherit;transition:border-color 0.15s;box-sizing:border-box}
.wc-sx-field input:focus,.wc-sx-field select:focus{border-color:#0066ff}
.wc-sx-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
/* Domain picker */
.wc-sx-domain-row{display:flex;gap:6px;align-items:flex-start}
.wc-sx-domain-row input{flex:1;min-width:0}
.wc-sx-domain-row select{width:96px;flex-shrink:0}
.wc-sx-domain-check-btn{padding:9px 12px;background:#0a0a0a;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.2s;flex-shrink:0}
.wc-sx-domain-check-btn:hover{background:#0066ff}
.wc-sx-domain-check-btn:disabled{opacity:0.5;cursor:not-allowed}
#wcsx-domain-status{font-size:12px;margin-top:6px;min-height:18px;line-height:1.4}
#wcsx-domain-status.ok{color:#16a34a;font-weight:600}
#wcsx-domain-status.ko{color:#dc2626;font-weight:600}
#wcsx-domain-status.checking{color:#6b6b6b}
/* Prix récapitulatif */
#wcsx-price-summary{background:#f0f6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin:14px 0;font-size:13px;line-height:1.7;display:none}
#wcsx-price-summary.show{display:block}
#wcsx-price-summary .ps-total{font-size:15px;font-weight:800;color:#0a0a0a;border-top:1px solid #bfdbfe;margin-top:6px;padding-top:6px}
/* Section adresse */
.wc-sx-addr-section{margin-top:14px;padding-top:12px;border-top:1px solid #f0f0f0}
/* Submit */
.wc-sx-submit{width:100%;padding:13px;background:#0a0a0a;color:#fff;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;border:none;margin-top:10px;letter-spacing:0.08em;text-transform:uppercase;transition:background 0.2s}
.wc-sx-submit:hover:not(:disabled){background:#0066ff}
.wc-sx-submit:disabled{opacity:0.5;cursor:not-allowed}
.wc-sx-legal{font-size:10px;color:#999;text-align:center;margin-top:10px;line-height:1.5}
/* ─── Bouton "Appelez Tom" dans le modal ─── */
.wc-sx-call-help{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding:11px 16px;background:#f8f5ef;border:1px solid #e8dcc1;border-radius:8px;color:#7a6537;text-decoration:none;font-size:13px;font-weight:500;transition:all 0.2s;cursor:pointer}
.wc-sx-call-help:hover{background:#f1ead6;border-color:#d9c89b;transform:translateY(-1px)}
.wc-sx-call-help strong{color:#5d4a1f;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:0.01em}
.wc-sx-call-icon{font-size:15px;flex-shrink:0}

/* Bouton flottant "Appelez-nous" — RETIRÉ : Tom veut uniquement la bande noire en haut */
.wc-sx-err{color:#c62828;font-size:12px;margin-top:8px;text-align:center;display:none;padding:8px;background:#ffebee;border-radius:6px}
.wc-sx-err.show{display:block}

/* ─── V2 MRR : toggle fréquence Mensuel/Annuel ───────────────── */
.wc-sx-freq-toggle{display:flex;background:#f0f0f0;border-radius:100px;padding:3px;margin:14px 0;width:100%;max-width:280px;margin-left:auto;margin-right:auto}
.wc-sx-freq-opt{flex:1;padding:7px 12px;border:none;background:transparent;border-radius:100px;font-size:11.5px;font-weight:700;cursor:pointer;letter-spacing:0.04em;color:#6b6b6b;text-transform:uppercase;transition:all 0.2s}
.wc-sx-freq-opt.active{background:#0a0a0a;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15)}
.wc-sx-freq-opt .wc-sx-freq-save{color:#16a34a;font-weight:800;margin-left:3px}
.wc-sx-freq-opt.active .wc-sx-freq-save{color:#FFD700}

/* ─── V2 MRR : addons récurrents ─────────────────────────────── */
.wc-sx-addons{margin:14px 0 4px;display:flex;flex-direction:column;gap:7px}
.wc-sx-addon{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:2px solid #eee;border-radius:10px;cursor:pointer;transition:all 0.15s;background:#fff}
.wc-sx-addon:hover{border-color:#0066ff}
.wc-sx-addon.checked{border-color:#0066ff;background:#f0f6ff}
.wc-sx-addon input{margin-top:2px;flex-shrink:0;accent-color:#0066ff;width:16px;height:16px}
.wc-sx-addon-body{flex:1;min-width:0}
.wc-sx-addon-name{font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:1px}
.wc-sx-addon-desc{font-size:11px;color:#6b6b6b;line-height:1.4}
.wc-sx-addon-price{font-size:12px;font-weight:800;color:#0066ff;white-space:nowrap;flex-shrink:0}
.wc-sx-addon-old{font-size:10.5px;text-decoration:line-through;opacity:.55;font-weight:500;color:#6b6b6b;margin-right:3px}

/* ─── V2 MRR : ligne récap récurrent ─────────────────────────── */
#wcsx-price-summary .ps-line{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;margin:1px 0}
#wcsx-price-summary .ps-line-sub{padding-left:10px;color:#525252;font-size:11.5px}
#wcsx-price-summary .ps-rec-total{font-size:14px;font-weight:700;color:#0a0a0a;border-top:1px dashed #bfdbfe;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between}
#wcsx-price-summary .ps-once-total{font-size:13px;font-weight:700;color:#0a0a0a;margin-top:6px;display:flex;justify-content:space-between}

/* ─── Mobile-first overrides ────────────────────────────────── */
@media(max-width:500px){
  .wc-sx-modal{padding:20px 16px 18px;border-radius:12px}
  .wc-sx-plans{grid-template-columns:1fr}
  .wc-sx-row{grid-template-columns:1fr}
  .wc-sx-domain-row{flex-wrap:wrap}
  .wc-sx-domain-row select{width:100%}
  .wc-sx-domain-check-btn{width:100%}
  .wc-sx-modal h3{font-size:19px}
}
</style>

<div class="wc-sx-cta" id="wc-sx-cta" role="region" aria-label="Commandez votre site Klyora Sites">
  <div class="wc-sx-cta-left">
    <span class="wc-sx-cta-title">Votre site web professionnel</span>
    <div class="wc-sx-cta-trust">
      <span class="wc-sx-cta-t">✓ Livraison rapide et suivie</span>
      <span class="wc-sx-cta-dot">·</span>
      <span class="wc-sx-cta-t">Remboursé 14j</span>
      <span class="wc-sx-cta-dot">·</span>
      <span class="wc-sx-cta-t">Paiement sécurisé</span>
    </div>
  </div>
  <button class="wc-sx-cta-btn" type="button" onclick="wcSxOpen()">Je commande → ${basePriceNbsp}</button>
</div>

<!-- Float-call retiré : Tom veut UNIQUEMENT la bande noire en haut avec "Je commande" -->
<!-- Le numéro reste accessible via le modal après clic sur "Je commande" -->


<div class="wc-sx-overlay" id="wc-sx-overlay" role="dialog" aria-modal="true" onclick="if(event.target===this)wcSxClose()">
  <div class="wc-sx-modal">
    <button class="wc-sx-close" type="button" onclick="wcSxClose()" aria-label="Fermer">×</button>
    <div class="wc-sx-kicker">Votre site web</div>
    <h3>${safeName}</h3>
    <p class="wc-sx-subtitle">Commande en 2 minutes · Livraison sous 5 jours · Satisfait ou remboursé 14 jours.</p>
    <div class="wc-sx-trust">
      <span>Remboursé 14j</span>
      <span>Stripe sécurisé</span>
      <span>Livré 5 jours</span>
      <span>Facture fournie</span>
    </div>

    <!-- Étape 1 : choix du plan -->
    <div class="wc-sx-step active" id="wcsx-step1">
      <span class="wc-sx-label">Choisissez votre formule</span>

      <!-- V2 : toggle Mensuel / Annuel -10% -->
      <div class="wc-sx-freq-toggle" role="tablist" aria-label="Fréquence de facturation">
        <button type="button" class="wc-sx-freq-opt active" data-freq="monthly" onclick="wcSxSetFreq('monthly')">Mensuel</button>
        <button type="button" class="wc-sx-freq-opt" data-freq="yearly" onclick="wcSxSetFreq('yearly')">Annuel <span class="wc-sx-freq-save">-10%</span></button>
      </div>

      <div class="wc-sx-plans">
        <div class="wc-sx-plan selected" data-plan="simple" onclick="wcSxSelectPlan('simple')">
          <div class="wc-sx-plan-title">${planLabel}</div>
          <div class="wc-sx-plan-price">${basePriceNbsp}</div>
          <div class="wc-sx-plan-sub">${planSub}</div>
          <ul>
            <li>Livré sous 5 jours</li>
            <li>${isLuxury ? "Design exclusif sur-mesure par nos créatifs" : "Design premium responsive"}</li>
            <li>URL provisoire offerte</li>
            <li>${isLuxury ? "Modifications illimitées 30j" : "2 rounds de modifications"}</li>
          </ul>
        </div>
        <div class="wc-sx-plan recommended" data-plan="serenite" onclick="wcSxSelectPlan('serenite')">
          <div class="wc-sx-plan-title">Tout compris ${isLuxury ? "Luxury" : ""}</div>
          <div class="wc-sx-plan-price">
            <span id="wcsx-plan-sub-price">${basePriceNbsp}</span>
            <span style="font-size:11px;opacity:0.7;font-weight:500"> + <span id="wcsx-plan-sub-rec">${subPrice}€/mois</span></span>
          </div>
          <div class="wc-sx-plan-sub"><strong style="color:#16a34a">Hébergement & maintenance inclus</strong> · sans engagement</div>
          <ul>
            <li>Création du site sur-mesure (${basePriceNbsp} unique)</li>
            <li><strong>Hébergement</strong> + SSL + sauvegardes</li>
            <li><strong>Modifications illimitées</strong></li>
            <li>Support prioritaire 24h</li>
            <li>Résiliable à tout moment</li>
          </ul>
        </div>
      </div>
      <button class="wc-sx-step1-next" type="button" onclick="wcSxGoStep2()">Continuer →</button>
      <a href="tel:+33635592471" class="wc-sx-call-help" onclick="try{fetch('/api/prospect/modal-opened',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prospect_slug:SLUG,event:'call_click'})}).catch(function(){})}catch(e){}">
        <span class="wc-sx-call-icon">📞</span>
        Une question ? Appelez Tom au <strong>06 35 59 24 71</strong>
      </a>
    </div>

    <!-- Étape 2 : formulaire -->
    <div class="wc-sx-step" id="wcsx-step2">
      <button class="wc-sx-back" type="button" onclick="wcSxGoStep1()">← Changer de formule</button>
      <div class="wc-sx-plan-recap" id="wcsx-plan-recap"></div>

      <!-- V2 : Options récurrentes (addons) -->
      <span class="wc-sx-label">Options récurrentes (optionnel)</span>
      <div class="wc-sx-addons" id="wcsx-addons"></div>

      <!-- Domaine -->
      <span class="wc-sx-label">Nom de domaine (optionnel)</span>
      <div class="wc-sx-field">
        <div class="wc-sx-domain-row">
          <input type="text" id="wcsx-domain" placeholder="monsite" maxlength="63" autocomplete="off" autocapitalize="none" spellcheck="false">
          <select id="wcsx-tld">
            <option value=".fr">.fr</option>
            <option value=".com">.com</option>
            <option value=".net">.net</option>
            <option value=".io">.io</option>
            <option value=".eu">.eu</option>
          </select>
          <button class="wc-sx-domain-check-btn" type="button" id="wcsx-domain-check-btn" onclick="wcSxCheckDomain()">Vérifier</button>
        </div>
        <div id="wcsx-domain-status"></div>
      </div>
      <div id="wcsx-price-summary"></div>

      <!-- Adresse (toujours visible) -->
      <div class="wc-sx-addr-section">
        <span class="wc-sx-label">Vos coordonnées</span>
        <div class="wc-sx-row">
          <div class="wc-sx-field"><label for="wcsx-prenom">Prénom *</label><input type="text" id="wcsx-prenom" maxlength="60" autocomplete="given-name" required></div>
          <div class="wc-sx-field"><label for="wcsx-nom">Nom *</label><input type="text" id="wcsx-nom" maxlength="60" autocomplete="family-name" required></div>
        </div>
        <div class="wc-sx-row">
          <div class="wc-sx-field"><label for="wcsx-email">Email *</label><input type="email" id="wcsx-email" maxlength="200" autocomplete="email" required></div>
          <div class="wc-sx-field"><label for="wcsx-tel">Téléphone *</label><input type="tel" id="wcsx-tel" maxlength="30" autocomplete="tel" required></div>
        </div>
        <div class="wc-sx-field"><label for="wcsx-adresse">Adresse</label><input type="text" id="wcsx-adresse" maxlength="200" autocomplete="street-address"></div>
        <div class="wc-sx-row">
          <div class="wc-sx-field"><label for="wcsx-cp">Code postal</label><input type="text" id="wcsx-cp" maxlength="10" autocomplete="postal-code"></div>
          <div class="wc-sx-field"><label for="wcsx-ville">Ville</label><input type="text" id="wcsx-ville" maxlength="100" autocomplete="address-level2"></div>
        </div>
      </div>

      <button class="wc-sx-submit" id="wcsx-submit" type="button" onclick="wcSxSubmit()">Payer en ligne (Stripe) →</button>
      <p class="wc-sx-legal">Paiement sécurisé · 1× ou 3× sans frais (Klarna) · Facture après paiement · Les badges Klyora Sites disparaissent à l'achat.</p>
      <p class="wc-sx-err" id="wcsx-err"></p>
    </div>
  </div>
</div>

<script>
(function wcSxInit() {
  var SLUG = ${JSON.stringify(safeSlug)};
  var LS_KEY = 'wc_buyer_snippet';
  var _domainVerified = null; // {name, tld, priceCents} ou null

  // Si le template a une barre native (restaurant / tous métiers), on la cache
  // pour garder seulement notre barre en haut, et on redirige pmOpen → wcSxOpen
  if (document.querySelector('.wc-cta-bar')) {
    var _nativeBar = document.querySelector('.wc-cta-bar');
    if (_nativeBar) _nativeBar.style.display = 'none';
    window.pmOpen = function() { window.wcSxOpen(); };
  }

  /* ─── localStorage ────────────────────────────────────────── */
  function wcSxSave() {
    try {
      var d = {};
      ['wcsx-prenom','wcsx-nom','wcsx-email','wcsx-tel','wcsx-adresse','wcsx-cp','wcsx-ville','wcsx-domain','wcsx-tld'].forEach(function(id){
        var el = document.getElementById(id); if(el) d[id] = el.value;
      });
      localStorage.setItem(LS_KEY, JSON.stringify(d));
    } catch(e){}
  }
  function wcSxRestore() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      Object.keys(d).forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.value = d[id] || '';
      });
    } catch(e){}
  }

  /* ─── V2 MRR : Frequency & Addons state ──────────────────── */
  var _freq = 'monthly'; // "monthly" | "yearly"
  var _availableAddons = []; // ["universel", "restaurant", "artisan"]
  var _selectedAddons = {}; // { universel: true, ... }
  var _businessType = '';
  var _prefilled = false;

  var ADDON_DEFS = {
    universel:  { name: 'Pack Visibilité (Google Ads + GMB)', desc: 'Campagne géolocalisée + fiche Google Business optimisée', monthlyEur: 30 },
    restaurant: { name: 'Menu QR Code digital',               desc: 'Menu accessible via QR en salle, MAJ en temps réel',     monthlyEur: 15 },
    artisan:    { name: 'Module de Devis en ligne 24/7',      desc: 'Vos clients génèrent un devis instantané sans appeler',  monthlyEur: 20 }
  };

  function availableAddonsForType(t) {
    var list = ['universel'];
    var lt = (t || '').toLowerCase();
    if (/restaur|brasser|bistr|pizz|crêper|creperie|café|cafe|glacier|fast.?food|boulang|patisser/.test(lt)) list.push('restaurant');
    if (/plomb|electrici|electric|menuis|serrur|carrele|peintr|couvr|maçon|macon|garage|carross|artisan|chauffag/.test(lt)) list.push('artisan');
    return list;
  }

  function renderAddons() {
    var container = document.getElementById('wcsx-addons');
    if (!container) return;
    container.innerHTML = '';
    _availableAddons.forEach(function(key) {
      var d = ADDON_DEFS[key];
      var monthly = _freq === 'yearly' ? (d.monthlyEur * 0.9) : d.monthlyEur;
      var monthlyStr = monthly.toFixed(2).replace('.', ',').replace(/,00$/, '');
      var oldStr = _freq === 'yearly' ? '<span class="wc-sx-addon-old">' + d.monthlyEur + '€</span>' : '';
      var label = document.createElement('label');
      label.className = 'wc-sx-addon' + (_selectedAddons[key] ? ' checked' : '');
      label.innerHTML =
        '<input type="checkbox" data-addon="' + key + '"' + (_selectedAddons[key] ? ' checked' : '') + '>' +
        '<div class="wc-sx-addon-body">' +
          '<div class="wc-sx-addon-name">' + d.name + '</div>' +
          '<div class="wc-sx-addon-desc">' + d.desc + '</div>' +
        '</div>' +
        '<div class="wc-sx-addon-price">' + oldStr + monthlyStr + '€<span style="font-weight:500;font-size:10.5px;opacity:0.7">/mo</span></div>';
      var input = label.querySelector('input');
      input.addEventListener('change', function(e) {
        _selectedAddons[key] = e.target.checked;
        label.classList.toggle('checked', e.target.checked);
        wcSxUpdatePriceSummary();
      });
      container.appendChild(label);
    });
  }

  window.wcSxSetFreq = function(f) {
    _freq = f;
    document.querySelectorAll('.wc-sx-freq-opt').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-freq') === f);
    });
    // Update prix mensuel affiché dans la card "tout compris"
    var basePrice = ${isLuxury ? 75 : 50};
    var perMonth = _freq === 'yearly' ? (basePrice * 0.9) : basePrice;
    var pmStr = perMonth.toFixed(2).replace('.', ',').replace(/,00$/, '');
    var recEl = document.getElementById('wcsx-plan-sub-rec');
    if (recEl) recEl.textContent = pmStr + '€/mois' + (_freq === 'yearly' ? ' (annuel)' : '');
    renderAddons();
    wcSxUpdateRecap();
    wcSxUpdatePriceSummary();
  };

  function prefillFromProspect() {
    if (_prefilled) return;
    _prefilled = true;
    fetch('/api/prospect/details?slug=' + encodeURIComponent(SLUG))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d || !d.prefill) return;
        var pf = d.prefill;
        var setIfEmpty = function(id, val) {
          var el = document.getElementById(id);
          if (el && !el.value && val) el.value = val;
        };
        setIfEmpty('wcsx-prenom', pf.prenom);
        setIfEmpty('wcsx-nom', pf.nom);
        setIfEmpty('wcsx-email', pf.email);
        setIfEmpty('wcsx-tel', pf.telephone);
        setIfEmpty('wcsx-adresse', pf.adresse);
        setIfEmpty('wcsx-cp', pf.cp);
        setIfEmpty('wcsx-ville', pf.ville);
        // Suggestion domaine
        if (d.suggested_domain) {
          var domEl = document.getElementById('wcsx-domain');
          if (domEl && !domEl.value) domEl.value = d.suggested_domain;
        }
        // Addons disponibles selon métier
        _businessType = d.business_type || '';
        _availableAddons = availableAddonsForType(_businessType);
        renderAddons();
      })
      .catch(function(){});
  }

  /* ─── Open / Close ───────────────────────────────────────── */
  window.wcSxOpen = function() {
    var ov = document.getElementById('wc-sx-overlay');
    if (!ov) return;
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    wcSxRestore();
    wcSxUpdateRecap();
    prefillFromProspect(); // V2 : auto-prefill depuis Supabase
    try {
      fetch('/api/prospect/modal-opened', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ prospect_slug: SLUG })
      }).catch(function(){});
    } catch(e){}
  };
  window.wcSxClose = function() {
    var ov = document.getElementById('wc-sx-overlay');
    if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
  };

  /* Reset _domainVerified si l'utilisateur modifie le domaine après vérif */
  (function() {
    var domInp = document.getElementById('wcsx-domain');
    var tldSel = document.getElementById('wcsx-tld');
    function resetDomain() {
      if (_domainVerified) {
        _domainVerified = null;
        var st = document.getElementById('wcsx-domain-status');
        if (st) { st.className = ''; st.textContent = ''; }
        var ps = document.getElementById('wcsx-price-summary');
        if (ps) ps.style.display = 'none';
      }
    }
    if (domInp) domInp.addEventListener('input', resetDomain);
    if (tldSel) tldSel.addEventListener('change', resetDomain);
  })();

  /* ─── Plan selection ─────────────────────────────────────── */
  window.wcSxSelectPlan = function(p) {
    document.querySelectorAll('.wc-sx-plan').forEach(function(el){
      el.classList.toggle('selected', el.getAttribute('data-plan') === p);
    });
  };

  function wcSxGetSelectedPlan() {
    var sel = document.querySelector('.wc-sx-plan.selected');
    return sel ? sel.getAttribute('data-plan') : 'simple';
  }

  /* ─── Étapes ─────────────────────────────────────────────── */
  window.wcSxGoStep2 = function() {
    document.getElementById('wcsx-step1').classList.remove('active');
    document.getElementById('wcsx-step2').classList.add('active');
    wcSxUpdateRecap();
    wcSxUpdatePriceSummary();
    wcSxRestore();
    wcSxBindSaveListeners();
    var ov = document.getElementById('wc-sx-overlay');
    if (ov) ov.scrollTop = 0;
  };
  window.wcSxGoStep1 = function() {
    document.getElementById('wcsx-step2').classList.remove('active');
    document.getElementById('wcsx-step1').classList.add('active');
    var ov = document.getElementById('wc-sx-overlay');
    if (ov) ov.scrollTop = 0;
  };

  function wcSxBindSaveListeners() {
    ['wcsx-prenom','wcsx-nom','wcsx-email','wcsx-tel','wcsx-adresse','wcsx-cp','wcsx-ville','wcsx-domain','wcsx-tld'].forEach(function(id){
      var el = document.getElementById(id);
      if (el && !el._wcSxBound) {
        el.addEventListener('input', wcSxSave);
        el.addEventListener('change', wcSxSave);
        el._wcSxBound = true;
      }
    });
  }

  function wcSxUpdateRecap() {
    var recap = document.getElementById('wcsx-plan-recap');
    if (!recap) return;
    var BASE_SETUP = ${isLuxury ? 860 : 320};
    var BASE_HOST_MO = ${isLuxury ? 75 : 50};
    var monthly = _freq === 'yearly' ? (BASE_HOST_MO * 0.9) : BASE_HOST_MO;
    var freqLabel = _freq === 'yearly' ? 'annuel' : 'mensuel';
    recap.innerHTML = 'Formule : <strong>${planLabel}</strong> — ' + BASE_SETUP + ' € + ' +
      monthly.toFixed(2).replace('.', ',').replace(/,00$/, '') + ' €/mois (' + freqLabel + ')';
  }

  /* ─── Domain check ───────────────────────────────────────── */
  window.wcSxCheckDomain = function() {
    var domEl = document.getElementById('wcsx-domain');
    var tldEl = document.getElementById('wcsx-tld');
    var statusEl = document.getElementById('wcsx-domain-status');
    var btn = document.getElementById('wcsx-domain-check-btn');
    if (!domEl || !tldEl || !statusEl) return;

    var name = domEl.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'');
    var tld  = tldEl.value;
    if (!name) { statusEl.className='ko'; statusEl.textContent='Saisissez un nom de domaine.'; return; }

    _domainVerified = null;
    btn.disabled = true;
    statusEl.className = 'checking';
    statusEl.textContent = 'Vérification en cours…';
    wcSxUpdatePriceSummary();

    fetch('/api/domain-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullDomain: name + tld })
      })
      .then(function(r){ return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        if (data.available) {
          // L'API retourne déjà le prix avec marge (× 1.15 côté serveur)
          var priceCents = data.priceCents || 0;
          var priceEuros = (priceCents / 100).toFixed(2).replace('.',',');
          _domainVerified = { name: name, tld: tld.replace(/^\./, ''), priceCents: priceCents };
          statusEl.className = 'ok';
          statusEl.textContent = name + tld + ' est disponible — ' + priceEuros + ' €/an';
        } else {
          _domainVerified = null;
          statusEl.className = 'ko';
          statusEl.textContent = (data.error || (name + tld + " n'est pas disponible."));
        }
        wcSxUpdatePriceSummary();
      })
      .catch(function() {
        btn.disabled = false;
        _domainVerified = null;
        statusEl.className = 'ko';
        statusEl.textContent = 'Impossible de vérifier — réessayez.';
        wcSxUpdatePriceSummary();
      });
  };

  function wcSxUpdatePriceSummary() {
    var el = document.getElementById('wcsx-price-summary');
    if (!el) return;
    var promo = window.__WC_PROMO || null;
    var BASE_SETUP = ${isLuxury ? 860 : 320}; // setup fee
    var BASE_HOST_MO = ${isLuxury ? 75 : 50}; // hébergement mensuel
    var isYearly = _freq === 'yearly';

    var fmt = function(n) { return n.toFixed(2).replace('.', ',') + ' €'; };
    var html = '';

    // ── Ligne 1 : setup site (one-time) ──
    var setup = promo ? promo.price : BASE_SETUP;
    html += '<div class="ps-line"><span>Création du site</span>';
    if (promo) {
      html += '<span><span style="text-decoration:line-through;opacity:.5">' + fmt(BASE_SETUP) + '</span> <strong>' + fmt(setup) + '</strong></span></div>';
    } else {
      html += '<span><strong>' + fmt(setup) + '</strong></span></div>';
    }

    // ── Lignes récurrentes ──
    var recMonthly = isYearly ? (BASE_HOST_MO * 0.9) : BASE_HOST_MO;
    html += '<div class="ps-line"><span>Hébergement ' + (isYearly ? 'annuel -10%' : 'mensuel') + '</span>';
    html += '<span><strong>' + recMonthly.toFixed(2).replace('.', ',') + ' €/mois</strong></span></div>';

    var totalRec = recMonthly;
    Object.keys(_selectedAddons).forEach(function(k) {
      if (!_selectedAddons[k]) return;
      var d = ADDON_DEFS[k];
      if (!d) return;
      var m = isYearly ? (d.monthlyEur * 0.9) : d.monthlyEur;
      totalRec += m;
      html += '<div class="ps-line ps-line-sub"><span>+ ' + d.name + '</span>';
      html += '<span>' + m.toFixed(2).replace('.', ',') + ' €/mois</span></div>';
    });

    // ── Domaine (one-time si fourni) ──
    var oneTimeTotal = setup;
    if (_domainVerified) {
      var domE = _domainVerified.priceCents / 100;
      oneTimeTotal += domE;
      html += '<div class="ps-line"><span>Domaine ' + _domainVerified.name + _domainVerified.tld + '</span>';
      html += '<span><strong>' + fmt(domE) + '</strong></span></div>';
    }

    // ── Totaux ──
    html += '<div class="ps-once-total"><span>À payer aujourd\\'hui</span><span>' + fmt(oneTimeTotal) + '</span></div>';
    if (isYearly) {
      var yrly = totalRec * 12;
      html += '<div class="ps-rec-total"><span>Puis ' + totalRec.toFixed(2).replace('.', ',') + ' €/mois</span><span>(' + yrly.toFixed(2).replace('.', ',') + ' €/an)</span></div>';
      html += '<div style="font-size:11px;color:#16a34a;margin-top:3px;text-align:right;font-weight:600">Économie -10% vs mensuel</div>';
    } else {
      html += '<div class="ps-rec-total"><span>Puis ' + totalRec.toFixed(2).replace('.', ',') + ' €/mois</span><span></span></div>';
    }

    el.innerHTML = html;
    el.classList.add('show');
  }

  /* ─── Submit ─────────────────────────────────────────────── */
  window.wcSxSubmit = function() {
    var err = document.getElementById('wcsx-err');
    var submit = document.getElementById('wcsx-submit');
    if (!err || !submit) return;
    err.classList.remove('show');

    var plan = wcSxGetSelectedPlan();
    var g = function(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    var prenom = g('wcsx-prenom'), nom = g('wcsx-nom'), email = g('wcsx-email'), tel = g('wcsx-tel');
    var adresse = g('wcsx-adresse'), cp = g('wcsx-cp'), ville = g('wcsx-ville');

    if (!prenom || !nom || !email || !tel) {
      err.textContent = 'Merci de remplir les champs obligatoires (prénom, nom, email, téléphone).';
      err.classList.add('show'); return;
    }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      err.textContent = 'Adresse email invalide.';
      err.classList.add('show'); return;
    }
    if (tel.replace(/[^0-9]/g, '').length < 9) {
      err.textContent = 'Numéro de téléphone invalide (minimum 9 chiffres).';
      err.classList.add('show'); return;
    }

    /* Bloquer si l'utilisateur a saisi un domaine sans cliquer Vérifier */
    var domainInput = document.getElementById('wcsx-domain');
    var domainVal = domainInput ? domainInput.value.trim() : '';
    if (domainVal && !_domainVerified) {
      err.textContent = 'Veuillez cliquer sur "Vérifier" pour confirmer la disponibilité du domaine avant de payer.';
      err.classList.add('show');
      var statusEl = document.getElementById('wcsx-domain-status');
      if (statusEl) { statusEl.className = 'ko'; statusEl.textContent = '⚠ Vérifiez la disponibilité du domaine d\\'abord.'; }
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Redirection…';

    // V2 : on collecte tier + frequency + addons
    var selectedAddonKeys = Object.keys(_selectedAddons).filter(function(k){ return _selectedAddons[k]; });
    var payload = {
      prospect_slug: SLUG,
      tier: ${JSON.stringify(isLuxury ? "luxury" : "simple")},
      frequency: _freq,
      addons: selectedAddonKeys,
      promo_code: (window.__WC_PROMO && window.__WC_PROMO.code) || undefined,
      buyer: { prenom: prenom, nom: nom, email: email, telephone: tel, adresse: adresse, cp: cp, ville: ville },
    };
    if (_domainVerified) {
      payload.domain = { name: _domainVerified.name, tld: _domainVerified.tld, priceCents: _domainVerified.priceCents };
    }

    fetch('/api/prospect/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, data: j }; }); })
      .then(function(res){
        if (res.ok && res.data.url) { location.href = res.data.url; return; }
        err.textContent = res.data.error || 'Erreur technique, réessayez ou écrivez à contact@klyora.fr';
        err.classList.add('show');
        submit.disabled = false;
        submit.textContent = 'Payer en ligne (Stripe) →';
      })
      .catch(function(){
        err.textContent = 'Erreur réseau, vérifiez votre connexion.';
        err.classList.add('show');
        submit.disabled = false;
        submit.textContent = 'Payer en ligne (Stripe) →';
      });
  };
})();

/* ══════════════════════════════════════════════════
   DÉMO RÉSERVATION — formulaire interactif
   Injecté automatiquement si la page contient un
   formulaire de réservation (.wc-booking-form, #wc-reservation, etc.)
   ou si le prospect est un restaurant/café/glacier.
   ══════════════════════════════════════════════════ */
(function() {
  var demoForms = document.querySelectorAll('[data-wc-demo-booking], .wc-reservation-form, .wc-booking-form, #wc-reservation');
  demoForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var f = form;
      var nameEl   = f.querySelector('[name="guest_name"], [name="name"], [name="prenom"]');
      var phoneEl  = f.querySelector('[name="guest_phone"], [name="phone"], [name="telephone"]');
      var guestsEl = f.querySelector('[name="guests"], [name="couverts"], [name="personnes"]');
      var dateEl   = f.querySelector('[name="date"]');
      var timeEl   = f.querySelector('[name="time"], [name="heure"]');
      var msgEl    = f.querySelector('[name="message"]');
      var btn      = f.querySelector('button[type="submit"], input[type="submit"]');

      var guestName = (nameEl && nameEl.value) ? nameEl.value.trim() : 'Un client';
      var guests    = (guestsEl && guestsEl.value) ? parseInt(guestsEl.value) : 2;
      var date      = (dateEl && dateEl.value) ? dateEl.value : new Date().toISOString().split('T')[0];
      var time      = (timeEl && timeEl.value) ? timeEl.value : '20:00';

      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

      fetch('/api/prospect/demo-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: '${safeSlug}',
          guest_name: guestName,
          guest_phone: phoneEl ? phoneEl.value : '',
          guests: guests,
          date: date,
          time: time,
          message: msgEl ? msgEl.value : ''
        })
      }).then(function(r) { return r.json(); }).then(function(data) {
        // Show success message
        var successDiv = document.createElement('div');
        successDiv.style.cssText = 'background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;padding:16px;margin-top:12px;color:#155724;font-size:14px;text-align:center;font-family:-apple-system,sans-serif';
        successDiv.innerHTML = data.sms_sent
          ? '✅ <strong>Réservation confirmée !</strong><br><small>Le propriétaire vient de recevoir une notification SMS sur son téléphone.</small>'
          : '✅ <strong>Demande envoyée !</strong><br><small>Le propriétaire a bien été notifié.</small>';
        form.appendChild(successDiv);
        if (btn) { btn.disabled = false; btn.textContent = 'Réserver'; }
      }).catch(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'Réserver'; }
      });
    });
  });
})();
</script>
<!-- WC-SX-END -->
`;
}
