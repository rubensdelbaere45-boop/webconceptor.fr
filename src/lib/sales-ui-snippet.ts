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
export function buildSalesUiSnippet(slug: string, prospectName: string): string {
  const safeName = prospectName.replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c]!));
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 100);

  return `
<style>
/* ─── CTA bar fixe en haut ─────────────────────────────────── */
.wc-sx-cta{position:fixed;top:0;left:0;right:0;z-index:9996;background:#0a0a0a;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 16px rgba(0,0,0,0.35);font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:13px}
.wc-sx-cta-btn{padding:10px 22px;background:#FFD700;color:#0a0a0a;font-weight:800;font-size:13px;border:none;border-radius:100px;cursor:pointer;letter-spacing:0.04em;transition:transform 0.15s,box-shadow 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.wc-sx-cta-btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(255,215,0,0.35)}
/* ─── Override : les pills WebConceptor (home-btn + demo-badge) descendent sous la CTA bar */
.wc-home-btn{top:54px !important}
.wc-demo-badge{top:54px !important}
body{padding-top:50px !important}
@media(max-width:600px){
  .wc-sx-cta{padding:8px 12px;font-size:12px}
  .wc-sx-cta-btn{padding:8px 14px;font-size:12px}
  body{padding-top:52px !important}
  .wc-home-btn{top:58px !important}
  .wc-demo-badge{top:58px !important}
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
.wc-sx-err{color:#c62828;font-size:12px;margin-top:8px;text-align:center;display:none;padding:8px;background:#ffebee;border-radius:6px}
.wc-sx-err.show{display:block}

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

<div class="wc-sx-cta" id="wc-sx-cta" role="region" aria-label="Commandez votre site WebConceptor">
  <span style="font-size:13px;color:#ccc;font-weight:500">Votre site web professionnel</span>
  <button class="wc-sx-cta-btn" type="button" onclick="wcSxOpen()">Je commande ce site →</button>
</div>

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
      <div class="wc-sx-plans">
        <div class="wc-sx-plan selected" data-plan="simple" onclick="wcSxSelectPlan('simple')">
          <div class="wc-sx-plan-title">Simple</div>
          <div class="wc-sx-plan-price">320&nbsp;€</div>
          <div class="wc-sx-plan-sub">ou 3× sans frais (106,67&nbsp;€)</div>
          <ul>
            <li>Livré sous 5 jours</li>
            <li>Design premium responsive</li>
            <li>URL provisoire WebConceptor</li>
            <li>2 rounds de modifications</li>
          </ul>
        </div>
        <div class="wc-sx-plan recommended" data-plan="serenite" onclick="wcSxSelectPlan('serenite')">
          <div class="wc-sx-plan-title">Sérénité</div>
          <div class="wc-sx-plan-price">320&nbsp;€ <span style="font-size:10px;opacity:0.7;font-weight:400">+ 50€/mois</span></div>
          <div class="wc-sx-plan-sub">Tout compris, zéro prise de tête</div>
          <ul>
            <li><strong>Nom de domaine</strong> inclus</li>
            <li>Hébergement + sauvegardes</li>
            <li><strong>Modifications illimitées</strong></li>
            <li>Support prioritaire 24h</li>
          </ul>
        </div>
      </div>
      <button class="wc-sx-step1-next" type="button" onclick="wcSxGoStep2()">Continuer →</button>
    </div>

    <!-- Étape 2 : formulaire -->
    <div class="wc-sx-step" id="wcsx-step2">
      <button class="wc-sx-back" type="button" onclick="wcSxGoStep1()">← Changer de formule</button>
      <div class="wc-sx-plan-recap" id="wcsx-plan-recap"></div>

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
      <p class="wc-sx-legal">Paiement sécurisé · 1× ou 3× sans frais (Klarna) · Facture après paiement · Les badges WebConceptor disparaissent à l'achat.</p>
      <p class="wc-sx-err" id="wcsx-err"></p>
    </div>
  </div>
</div>

<script>
(function wcSxInit() {
  var SLUG = ${JSON.stringify(safeSlug)};
  var LS_KEY = 'wc_buyer_snippet';
  var _domainVerified = null; // {name, tld, price_cents} ou null

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

  /* ─── Open / Close ───────────────────────────────────────── */
  window.wcSxOpen = function() {
    var ov = document.getElementById('wc-sx-overlay');
    if (!ov) return;
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    wcSxRestore();
    wcSxUpdateRecap();
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
    var plan = wcSxGetSelectedPlan();
    var label = plan === 'serenite'
      ? '<strong>Sérénité</strong> — 320&nbsp;€ + 50€/mois'
      : '<strong>Simple</strong> — 320&nbsp;€';
    recap.innerHTML = 'Formule : ' + label;
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

    fetch('/api/domain-check?domain=' + encodeURIComponent(name + tld))
      .then(function(r){ return r.json(); })
      .then(function(data) {
        btn.disabled = false;
        if (data.available) {
          // Marge 15% silencieuse
          var rawCents = data.price_cents || 0;
          var finalCents = Math.round(rawCents * 1.15);
          var finalEuros = (finalCents / 100).toFixed(2).replace('.',',');
          _domainVerified = { name: name, tld: tld, price_cents: finalCents };
          statusEl.className = 'ok';
          statusEl.textContent = name + tld + ' est disponible — ' + finalEuros + ' €/an';
        } else {
          _domainVerified = null;
          statusEl.className = 'ko';
          statusEl.textContent = (data.message || (name + tld + ' n\'est pas disponible.'));
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
    var html = '';
    var total = 320;
    html += '<div>Création du site : <strong>320,00 €</strong></div>';
    if (_domainVerified) {
      var domEuros = (_domainVerified.price_cents / 100).toFixed(2).replace('.',',');
      total = 320 + _domainVerified.price_cents / 100;
      html += '<div>Domaine ' + _domainVerified.name + _domainVerified.tld + ' : <strong>' + domEuros + ' €</strong></div>';
    }
    html += '<div class="ps-total">Total : ' + total.toFixed(2).replace('.',',') + ' €</div>';
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

    submit.disabled = true;
    submit.textContent = 'Redirection…';

    var payload = {
      prospect_slug: SLUG,
      plan: plan,
      buyer: { prenom: prenom, nom: nom, email: email, telephone: tel, adresse: adresse, cp: cp, ville: ville },
    };
    if (_domainVerified) {
      payload.domain = { name: _domainVerified.name, tld: _domainVerified.tld, price_cents: _domainVerified.price_cents };
    }

    fetch('/api/prospect/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, data: j }; }); })
      .then(function(res){
        if (res.ok && res.data.url) { location.href = res.data.url; return; }
        err.textContent = res.data.error || 'Erreur technique, réessayez ou écrivez à contact@webconceptor.fr';
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
</script>
`;
}
