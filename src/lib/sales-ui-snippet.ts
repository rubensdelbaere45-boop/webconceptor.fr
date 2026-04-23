/* ══════════════════════════════════════════
   SNIPPET SALES UI INJECTABLE
   Injecté via /prospects/[slug]/route.ts pour TOUTE maquette qui n'a pas
   déjà de `.wc-cta-bar` native (épicerie legacy, adaptive non-restaurant…).

   Fournit :
   - CTA bar fixe en haut : prix + countdown 24h + bouton "J'achète"
   - Modal d'achat : plan simple/sérénité + formulaire contact
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
.wc-sx-cta{position:fixed;top:0;left:0;right:0;z-index:9996;background:linear-gradient(90deg,#0a0a0a,#1a1a1a);color:#fff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 2px 16px rgba(0,0,0,0.2);font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:13px;flex-wrap:wrap}
.wc-sx-cta-text{flex:1;min-width:200px;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap}
.wc-sx-cta-price-old{text-decoration:line-through;opacity:0.5;font-size:13px}
.wc-sx-cta-price{font-weight:800;font-size:16px;color:#FFD700;letter-spacing:0.01em}
.wc-sx-cta-countdown{font-size:12px;opacity:0.9}
.wc-sx-cta-countdown strong{color:#FFD700;font-variant-numeric:tabular-nums}
.wc-sx-cta-btn{padding:11px 22px;background:#FFD700;color:#0a0a0a;font-weight:800;font-size:13px;border:none;border-radius:100px;cursor:pointer;letter-spacing:0.04em;transition:transform 0.15s,box-shadow 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.wc-sx-cta-btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(255,215,0,0.3)}
/* ─── Override : les pills WebConceptor (home-btn + demo-badge) étaient
   positionnés à top:14px et recouvraient la CTA bar. On les descend sous
   la CTA bar (top:62px) pour que prix + bouton "Je commande" soient visibles. */
.wc-home-btn{top:62px !important}
.wc-demo-badge{top:62px !important}
body{padding-top:56px !important}
@media(max-width:640px){
  .wc-sx-cta{padding:10px 14px;font-size:12px}
  .wc-sx-cta-btn{padding:9px 16px;font-size:12px}
  .wc-sx-cta-price{font-size:14px}
  body{padding-top:80px !important}
  .wc-home-btn{top:86px !important}
  .wc-demo-badge{top:86px !important}
}

/* ─── Modal achat ──────────────────────────────────────────── */
.wc-sx-overlay{position:fixed;inset:0;z-index:10000;background:rgba(10,10,10,0.7);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto}
.wc-sx-overlay.open{display:flex}
.wc-sx-modal{background:#fff;max-width:560px;width:100%;border-radius:16px;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,0.4);position:relative;margin:20px 0;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#1a1a1a}
.wc-sx-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border:none;background:#f5f5f5;color:#1a1a1a;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}
.wc-sx-close:hover{background:#eee}
.wc-sx-kicker{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0066ff;margin-bottom:8px}
.wc-sx-modal h3{font-size:24px;font-weight:700;margin-bottom:6px;letter-spacing:-0.01em}
.wc-sx-modal > p{font-size:14px;color:#6b6b6b;margin-bottom:20px;line-height:1.5}
.wc-sx-trust{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.wc-sx-trust span{font-size:11px;padding:5px 10px;background:#f5f5f5;border-radius:100px;color:#525252;font-weight:500}
.wc-sx-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.wc-sx-plan{border:2px solid #eee;border-radius:10px;padding:16px 14px;cursor:pointer;transition:all 0.15s;background:#fff;position:relative}
.wc-sx-plan:hover{border-color:#0066ff}
.wc-sx-plan.selected{border-color:#0066ff;background:#f0f6ff;box-shadow:0 2px 12px rgba(0,102,255,0.08)}
.wc-sx-plan.recommended::before{content:'RECOMMANDÉ';position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#0066ff;color:#fff;font-size:9px;font-weight:800;letter-spacing:0.15em;padding:3px 8px;border-radius:100px}
.wc-sx-plan-title{font-size:15px;font-weight:700;margin-bottom:4px}
.wc-sx-plan-price{font-size:18px;font-weight:800;color:#0066ff;margin-bottom:2px}
.wc-sx-plan-price span{text-decoration:line-through;opacity:0.4;font-size:13px;margin-right:6px;font-weight:400;color:#6b6b6b}
.wc-sx-plan-sub{font-size:10px;color:#6b6b6b;margin-bottom:10px}
.wc-sx-plan ul{list-style:none;padding:0;margin:0;font-size:11px;color:#1a1a1a;line-height:1.5}
.wc-sx-plan li{padding:2px 0 2px 14px;position:relative}
.wc-sx-plan li::before{content:'✓';position:absolute;left:0;color:#0066ff;font-weight:700}
.wc-sx-label{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#6b6b6b;margin-bottom:10px;display:block}
.wc-sx-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.wc-sx-field{margin-bottom:12px}
.wc-sx-field label{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b6b6b;margin-bottom:5px;display:block}
.wc-sx-field input,.wc-sx-field select{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;color:#1a1a1a;outline:none;font-family:inherit;transition:border-color 0.15s}
.wc-sx-field input:focus,.wc-sx-field select:focus{border-color:#0066ff}
.wc-sx-addr-block{display:none;padding-top:4px}
.wc-sx-addr-block.visible{display:block}
.wc-sx-submit{width:100%;padding:14px;background:#0a0a0a;color:#fff;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;border:none;margin-top:8px;letter-spacing:0.08em;text-transform:uppercase;transition:background 0.2s}
.wc-sx-submit:hover:not(:disabled){background:#0066ff}
.wc-sx-submit:disabled{opacity:0.5;cursor:not-allowed}
.wc-sx-legal{font-size:10px;color:#999;text-align:center;margin-top:12px;line-height:1.5}
.wc-sx-err{color:#c62828;font-size:12px;margin-top:10px;text-align:center;display:none;padding:8px;background:#ffebee;border-radius:6px}
.wc-sx-err.show{display:block}
@media(max-width:520px){.wc-sx-modal{padding:22px;border-radius:12px}.wc-sx-row{grid-template-columns:1fr}.wc-sx-plans{grid-template-columns:1fr}}
</style>

<div class="wc-sx-cta" id="wc-sx-cta" role="region" aria-label="Offre site web WebConceptor">
  <span class="wc-sx-cta-text">
    <span style="font-size:18px">⚡</span>
    <span><span class="wc-sx-cta-price-old">599&nbsp;€</span> <span class="wc-sx-cta-price">199&nbsp;€ TTC</span></span>
    <span class="wc-sx-cta-countdown">· <span id="wc-sx-cd">Expire dans --:--:--</span></span>
  </span>
  <button class="wc-sx-cta-btn" type="button" onclick="wcSxOpen()">Je commande ce site →</button>
</div>

<div class="wc-sx-overlay" id="wc-sx-overlay" role="dialog" aria-modal="true" onclick="if(event.target===this)wcSxClose()">
  <div class="wc-sx-modal">
    <button class="wc-sx-close" type="button" onclick="wcSxClose()" aria-label="Fermer">×</button>
    <div class="wc-sx-kicker">Votre site web</div>
    <h3>${safeName}</h3>
    <p>Commande en 2 minutes, livraison sous 5 à 7 jours. Satisfait ou remboursé 14 jours.</p>
    <div class="wc-sx-trust">
      <span>🛡 Remboursé 14j</span>
      <span>🔒 Stripe sécurisé</span>
      <span>⚡ Livré 5 jours</span>
      <span>📄 Facture fournie</span>
    </div>

    <span class="wc-sx-label">Choisissez votre formule</span>
    <div class="wc-sx-plans">
      <div class="wc-sx-plan selected" data-plan="simple" onclick="wcSxSelectPlan('simple')">
        <div class="wc-sx-plan-title">Simple</div>
        <div class="wc-sx-plan-price"><span>599€</span>199&nbsp;€</div>
        <div class="wc-sx-plan-sub">ou 3× sans frais (66,33 €)</div>
        <ul>
          <li>Livré sous 5 jours</li>
          <li>Design premium responsive</li>
          <li>URL provisoire WebConceptor</li>
          <li>2 rounds de modifications</li>
        </ul>
      </div>
      <div class="wc-sx-plan recommended" data-plan="serenite" onclick="wcSxSelectPlan('serenite')">
        <div class="wc-sx-plan-title">Sérénité</div>
        <div class="wc-sx-plan-price">199&nbsp;€ <span style="font-size:11px;opacity:0.7;text-decoration:none">+ 50€/mois</span></div>
        <div class="wc-sx-plan-sub">Tout compris, zéro prise de tête</div>
        <ul>
          <li><strong>Votre nom de domaine</strong> inclus</li>
          <li>Hébergement + sauvegardes</li>
          <li><strong>Modifications illimitées</strong></li>
          <li>Support prioritaire 24h</li>
        </ul>
      </div>
    </div>

    <span class="wc-sx-label">Vos coordonnées</span>
    <div class="wc-sx-row">
      <div class="wc-sx-field"><label for="wcsx-prenom">Prénom</label><input type="text" id="wcsx-prenom" maxlength="60" autocomplete="given-name" required></div>
      <div class="wc-sx-field"><label for="wcsx-nom">Nom</label><input type="text" id="wcsx-nom" maxlength="60" autocomplete="family-name" required></div>
    </div>
    <div class="wc-sx-row">
      <div class="wc-sx-field"><label for="wcsx-email">Email</label><input type="email" id="wcsx-email" maxlength="200" autocomplete="email" required></div>
      <div class="wc-sx-field"><label for="wcsx-tel">Téléphone</label><input type="tel" id="wcsx-tel" maxlength="30" autocomplete="tel" required></div>
    </div>

    <div class="wc-sx-addr-block" id="wcsx-addr">
      <span class="wc-sx-label">Adresse de facturation (requise pour le nom de domaine)</span>
      <div class="wc-sx-field"><label for="wcsx-adresse">Adresse</label><input type="text" id="wcsx-adresse" maxlength="200" autocomplete="street-address"></div>
      <div class="wc-sx-row">
        <div class="wc-sx-field"><label for="wcsx-ville">Ville</label><input type="text" id="wcsx-ville" maxlength="100" autocomplete="address-level2"></div>
        <div class="wc-sx-field"><label for="wcsx-cp">Code postal</label><input type="text" id="wcsx-cp" maxlength="10" autocomplete="postal-code"></div>
      </div>
    </div>

    <button class="wc-sx-submit" id="wcsx-submit" type="button" onclick="wcSxSubmit()">Payer en ligne (Stripe) →</button>
    <p class="wc-sx-legal">Paiement sécurisé · 1× ou 3× sans frais (Klarna) · Facture après paiement · Les badges WebConceptor disparaissent à l'achat.</p>
    <p class="wc-sx-err" id="wcsx-err"></p>
  </div>
</div>

<script>
(function wcSxInit() {
  var SLUG = ${JSON.stringify(safeSlug)};

  // Deadline countdown 24h, persistée en localStorage pour la continuité
  try {
    var KEY = 'wc_sx_deadline_' + SLUG;
    var deadline = Number(localStorage.getItem(KEY));
    if (!deadline || isNaN(deadline) || deadline < Date.now()) {
      deadline = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(KEY, String(deadline));
    }
    var cd = document.getElementById('wc-sx-cd');
    var upd = function() {
      if (!cd) return;
      var diff = deadline - Date.now();
      if (diff <= 0) { cd.innerHTML = '<strong>Offre expirée — contactez-nous</strong>'; return; }
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
      cd.innerHTML = 'Expire dans <strong>' + pad(h) + ':' + pad(m) + ':' + pad(s) + '</strong>';
    };
    upd();
    setInterval(upd, 1000);
  } catch (e) {}

  window.wcSxOpen = function() {
    var ov = document.getElementById('wc-sx-overlay');
    if (ov) { ov.classList.add('open'); document.body.style.overflow = 'hidden'; }
    // Track cart abandon
    try {
      fetch('/api/prospect/modal-opened', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_slug: SLUG }),
      }).catch(function(){});
    } catch (e) {}
  };
  window.wcSxClose = function() {
    var ov = document.getElementById('wc-sx-overlay');
    if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
  };
  window.wcSxSelectPlan = function(p) {
    var plans = document.querySelectorAll('.wc-sx-plan');
    plans.forEach(function(el){ el.classList.toggle('selected', el.getAttribute('data-plan') === p); });
    var addr = document.getElementById('wcsx-addr');
    if (addr) addr.classList.toggle('visible', p === 'serenite');
  };

  window.wcSxSubmit = function() {
    var err = document.getElementById('wcsx-err');
    var submit = document.getElementById('wcsx-submit');
    err.classList.remove('show');

    var plan = document.querySelector('.wc-sx-plan.selected');
    plan = plan ? plan.getAttribute('data-plan') : 'simple';

    var g = function(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    var prenom = g('wcsx-prenom'), nom = g('wcsx-nom'), email = g('wcsx-email'), tel = g('wcsx-tel');
    var adresse = g('wcsx-adresse'), ville = g('wcsx-ville'), cp = g('wcsx-cp');

    if (!prenom || !nom || !email || !tel) {
      err.textContent = 'Merci de remplir tous les champs obligatoires.';
      err.classList.add('show'); return;
    }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      err.textContent = 'Adresse email invalide.';
      err.classList.add('show'); return;
    }
    if (plan === 'serenite' && (!adresse || !ville || !cp)) {
      err.textContent = 'Adresse, ville et code postal requis pour la formule Sérénité (nom de domaine).';
      err.classList.add('show'); return;
    }

    submit.disabled = true;
    submit.textContent = 'Redirection…';

    fetch('/api/prospect/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_slug: SLUG,
        plan: plan,
        buyer: { prenom: prenom, nom: nom, email: email, telephone: tel, adresse: adresse, ville: ville, cp: cp },
      }),
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
