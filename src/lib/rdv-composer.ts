/**
 * Composer "Prendre RDV" — calendrier interactif pour dentiste/ostéo/
 * médecin. Modal full-screen 2 colonnes :
 *   - Gauche : calendrier 14 jours suivants (cards date), créneaux du jour
 *     sélectionné en bas
 *   - Droite : motif de RDV (consultation/urgence/suivi/etc.) + coordonnées
 *
 * Créneaux générés aléatoirement mais convaincants (matin 9-12h + après-midi
 * 14-18h, avec quelques créneaux indisponibles pour réalisme).
 *
 * Hérite des CSS variables du template parent (--primary, --bg, --line…).
 */

export function buildRdvComposer(slug: string): string {
  const slugSafe = slug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);

  return `
<!-- ═══════════════════ RDV COMPOSER ═══════════════════ -->
<style>
  #rdv-overlay {
    position: fixed; inset: 0;
    z-index: 60;
    background: rgba(20,20,30,0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: none;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
  }
  #rdv-overlay.open { display: flex; }
  @keyframes rdv-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rdv-slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  #rdv-overlay.open { animation: rdv-fade-in .35s ease forwards; }
  #rdv-overlay.open .rdv-modal { animation: rdv-slide-up .5s cubic-bezier(.2,.8,.2,1) forwards; }

  .rdv-modal {
    width: 100%; max-width: 1100px;
    margin: auto;
    background: var(--bg, #fff);
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
    max-height: 100vh;
    position: relative;
    border-radius: 0;
  }
  @media (min-width: 900px) {
    .rdv-modal {
      grid-template-columns: 1.2fr 1fr;
      border-radius: 16px;
      max-height: 92vh;
      margin: 4vh auto;
      box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    }
  }

  /* ─── COL GAUCHE : CALENDRIER ───────────────────── */
  .rdv-cal {
    background: var(--surface, #f5f9fc);
    padding: 32px 24px;
    overflow-y: auto;
    max-height: 100vh;
  }
  @media (min-width: 900px) { .rdv-cal { padding: 48px 40px; max-height: 92vh; } }

  .rdv-cal-header {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 18px;
  }
  .rdv-cal-kicker {
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 600; color: var(--primary, #3b82f6);
  }
  .rdv-cal-month {
    font-family: var(--font-heading);
    font-size: 14px; font-weight: 600;
    color: var(--fg-soft, #64748b);
  }
  .rdv-cal-title {
    font-family: var(--font-heading);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.15;
    margin: 0 0 24px;
    color: var(--fg, #0f172a);
  }
  .rdv-cal-title em { font-style: italic; color: var(--primary, #3b82f6); }

  /* Grille jours */
  .rdv-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin-bottom: 24px;
  }
  .rdv-day {
    aspect-ratio: 1;
    background: var(--bg, #fff);
    border: 1.5px solid transparent;
    border-radius: 10px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.2s;
    padding: 6px 2px;
    text-align: center;
  }
  .rdv-day:hover:not(.disabled) {
    border-color: var(--primary, #3b82f6);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px -8px rgba(0,0,0,0.12);
  }
  .rdv-day.disabled {
    background: transparent;
    color: var(--fg-soft, #64748b);
    opacity: 0.35;
    cursor: not-allowed;
  }
  .rdv-day.active {
    background: var(--primary, #3b82f6);
    color: #fff;
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 8px 24px -8px var(--primary, #3b82f6);
  }
  .rdv-day-dow {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.6;
    line-height: 1;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .rdv-day-num {
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: 600;
    line-height: 1;
  }
  @media (max-width: 600px) {
    .rdv-day-num { font-size: 16px; }
    .rdv-day-dow { font-size: 9px; }
  }

  /* Créneaux du jour */
  .rdv-slots-section {
    margin-top: 14px;
  }
  .rdv-slots-label {
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 600; color: var(--fg-soft, #64748b);
    margin-bottom: 14px;
  }
  .rdv-slots-empty {
    text-align: center;
    padding: 30px 16px;
    font-size: 13px;
    color: var(--fg-soft, #64748b);
    background: var(--bg, #fff);
    border-radius: 12px;
    font-style: italic;
  }
  .rdv-slots-group {
    margin-bottom: 14px;
  }
  .rdv-slots-grouplabel {
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    font-weight: 600; color: var(--fg, #0f172a);
    margin-bottom: 8px;
    display: flex; align-items: center; gap: 8px;
  }
  .rdv-slots-grouplabel::after {
    content: ''; flex: 1; height: 1px; background: var(--line, #e2e8f0);
  }
  .rdv-slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
    gap: 6px;
  }
  .rdv-slot {
    padding: 9px 6px;
    background: var(--bg, #fff);
    border: 1.5px solid var(--line, #e2e8f0);
    border-radius: 999px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: var(--fg, #0f172a);
    cursor: pointer;
    transition: all 0.18s;
    text-align: center;
  }
  .rdv-slot:hover:not(.taken) {
    border-color: var(--primary, #3b82f6);
    color: var(--primary, #3b82f6);
    transform: translateY(-1px);
  }
  .rdv-slot.taken {
    opacity: 0.32;
    cursor: not-allowed;
    text-decoration: line-through;
  }
  .rdv-slot.active {
    background: var(--primary, #3b82f6);
    color: #fff;
    border-color: var(--primary, #3b82f6);
  }

  /* ─── COL DROITE : MOTIF + COORDONNÉES ───────────────────── */
  .rdv-form {
    padding: 32px 24px 28px;
    overflow-y: auto;
    max-height: 100vh;
    position: relative;
  }
  @media (min-width: 900px) {
    .rdv-form { padding: 48px 40px; max-height: 92vh; }
  }

  .rdv-close {
    position: absolute; top: 18px; right: 18px;
    width: 38px; height: 38px;
    background: var(--surface, #f5f9fc);
    border: none; border-radius: 50%;
    display: grid; place-items: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    z-index: 10;
    color: var(--fg, #0f172a);
  }
  .rdv-close:hover { background: var(--line, #e2e8f0); transform: rotate(90deg); }

  .rdv-summary {
    background: var(--surface, #f5f9fc);
    border-radius: 14px;
    padding: 18px 20px;
    margin-bottom: 26px;
    border: 1px solid var(--line, #e2e8f0);
  }
  .rdv-summary-row {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 16px;
    padding: 8px 0;
  }
  .rdv-summary-row:not(:last-child) {
    border-bottom: 1px solid var(--line, #e2e8f0);
  }
  .rdv-summary-label {
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    font-weight: 600; color: var(--fg-soft, #64748b);
  }
  .rdv-summary-value {
    font-family: var(--font-heading);
    font-size: 17px; font-weight: 600;
    color: var(--fg, #0f172a);
    text-align: right;
  }
  .rdv-summary-value.empty {
    font-family: var(--font-body);
    color: var(--fg-soft, #64748b);
    font-size: 13px;
    font-style: italic;
    font-weight: 400;
  }

  .rdv-step { margin-bottom: 24px; }
  .rdv-step-label {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    font-weight: 600;
    color: var(--fg-soft, #64748b);
    margin-bottom: 14px;
  }
  .rdv-step-num {
    display: inline-grid; place-items: center;
    width: 22px; height: 22px;
    background: var(--primary, #3b82f6);
    color: #fff;
    border-radius: 50%;
    font-size: 11px; font-weight: 600;
  }

  /* Motif pills */
  .rdv-motifs {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
  }
  .rdv-motif {
    padding: 11px 12px;
    background: transparent;
    border: 1px solid var(--line, #e2e8f0);
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--fg, #0f172a);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.18s;
    text-align: center;
  }
  .rdv-motif:hover { border-color: var(--primary, #3b82f6); }
  .rdv-motif.active {
    background: var(--fg, #0f172a);
    color: var(--bg, #fff);
    border-color: var(--fg, #0f172a);
  }
  .rdv-motif.urgence.active {
    background: #ef4444;
    border-color: #ef4444;
  }

  .rdv-input {
    width: 100%;
    padding: 13px 14px;
    background: var(--surface, #f5f9fc);
    border: 1px solid var(--line, #e2e8f0);
    border-radius: 10px;
    color: var(--fg, #0f172a);
    font-family: var(--font-body);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 8px;
  }
  .rdv-input:focus { border-color: var(--primary, #3b82f6); }
  .rdv-input::placeholder { color: var(--fg-soft, #64748b); opacity: 0.7; }

  .rdv-submit {
    width: 100%;
    margin-top: 18px;
    padding: 15px 24px;
    background: var(--primary, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: var(--font-body);
    transition: transform 0.2s, opacity 0.2s, background 0.2s;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  }
  .rdv-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    background: var(--fg, #0f172a);
  }
  .rdv-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  .rdv-help {
    margin-top: 14px;
    font-size: 12px;
    color: var(--fg-soft, #64748b);
    line-height: 1.55;
    text-align: center;
  }
  .rdv-help a { color: var(--primary, #3b82f6); text-decoration: underline; font-weight: 600; }

  /* Success */
  .rdv-success {
    display: none;
    text-align: center;
    padding: 60px 24px;
  }
  .rdv-success.show { display: block; animation: rdv-slide-up 0.4s ease forwards; }
  .rdv-success-icon { width: 64px; height: 64px; margin: 0 auto 24px; }
  .rdv-success h3 {
    font-family: var(--font-heading);
    font-size: 30px; font-weight: 600;
    margin: 0 0 12px;
    color: var(--fg, #0f172a);
  }
  .rdv-success p {
    font-size: 14px;
    color: var(--fg-soft, #64748b);
    line-height: 1.7;
    max-width: 360px;
    margin: 0 auto;
  }
  .rdv-success .rdv-confirm-detail {
    background: var(--surface, #f5f9fc);
    border-radius: 12px;
    padding: 14px 18px;
    margin: 22px auto 0;
    max-width: 320px;
    font-size: 13px;
    color: var(--fg, #0f172a);
    font-family: var(--font-heading);
    font-weight: 600;
  }
</style>

<div id="rdv-overlay" onclick="if(event.target===this) rdvClose()">
  <div class="rdv-modal">

    <!-- ── COL GAUCHE : CALENDRIER ── -->
    <div class="rdv-cal" id="rdv-cal-section">
      <div class="rdv-cal-header">
        <div>
          <div class="rdv-cal-kicker">— Prendre RDV en ligne</div>
        </div>
        <div class="rdv-cal-month" id="rdv-cal-month">—</div>
      </div>
      <h3 class="rdv-cal-title">Choisissez un <em>créneau</em>.</h3>

      <div class="rdv-days" id="rdv-days"></div>

      <div class="rdv-slots-section">
        <div class="rdv-slots-label" id="rdv-slots-label">Créneaux disponibles</div>
        <div id="rdv-slots-container">
          <div class="rdv-slots-empty">Sélectionnez d'abord une date</div>
        </div>
      </div>
    </div>

    <!-- ── COL DROITE : MOTIF + COORDONNÉES ── -->
    <div class="rdv-form">
      <button class="rdv-close" onclick="rdvClose()" aria-label="Fermer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div id="rdv-default-view">
        <div class="rdv-summary">
          <div class="rdv-summary-row">
            <span class="rdv-summary-label">Date</span>
            <span class="rdv-summary-value empty" id="rdv-sum-date">à choisir</span>
          </div>
          <div class="rdv-summary-row">
            <span class="rdv-summary-label">Créneau</span>
            <span class="rdv-summary-value empty" id="rdv-sum-slot">à choisir</span>
          </div>
          <div class="rdv-summary-row">
            <span class="rdv-summary-label">Motif</span>
            <span class="rdv-summary-value empty" id="rdv-sum-motif">à choisir</span>
          </div>
        </div>

        <div class="rdv-step">
          <div class="rdv-step-label"><span class="rdv-step-num">1</span> Motif de consultation</div>
          <div class="rdv-motifs" id="rdv-motifs">
            <button class="rdv-motif" data-motif="Consultation" data-cat="standard">Consultation</button>
            <button class="rdv-motif" data-motif="Détartrage" data-cat="standard">Détartrage</button>
            <button class="rdv-motif" data-motif="Suivi" data-cat="standard">Suivi</button>
            <button class="rdv-motif" data-motif="Soin (carie)" data-cat="standard">Soin (carie)</button>
            <button class="rdv-motif urgence" data-motif="Urgence douleur" data-cat="urgence">🚨 Urgence douleur</button>
            <button class="rdv-motif" data-motif="Première visite" data-cat="standard">Première visite</button>
          </div>
        </div>

        <div class="rdv-step">
          <div class="rdv-step-label"><span class="rdv-step-num">2</span> Vos coordonnées</div>
          <form onsubmit="rdvSubmit(event)">
            <input type="text" id="rdv-name" class="rdv-input" placeholder="Nom & prénom" required>
            <input type="tel" id="rdv-phone" class="rdv-input" placeholder="Téléphone" required>
            <input type="email" id="rdv-email" class="rdv-input" placeholder="Email">
            <textarea id="rdv-msg" rows="2" class="rdv-input" placeholder="Précisions (facultatif)" style="resize:none"></textarea>
            <button type="submit" id="rdv-submit-btn" class="rdv-submit" disabled>
              Confirmer mon RDV
              <span aria-hidden>→</span>
            </button>
          </form>
          <div class="rdv-help">
            Vous êtes déjà patient ? Précisez-le pour gagner du temps.<br>
            Urgence vitale ? <a href="tel:15">Appelez le 15</a>.
          </div>
        </div>
      </div>

      <div class="rdv-success" id="rdv-success">
        <svg class="rdv-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary)"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        <h3>RDV demandé.</h3>
        <p>Le cabinet confirme votre RDV par SMS ou téléphone dans la journée.</p>
        <div class="rdv-confirm-detail" id="rdv-confirm-detail"></div>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
  var SLUG = ${JSON.stringify(slugSafe)};
  var DOWS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  var MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  var rdvState = { date: null, dateLabel: null, slot: null, motif: null, motifCat: null, name: '', phone: '', email: '', message: '' };
  var rdvInited = false;

  // Génère 14 jours suivants (skip dimanche pour réalisme cabinet)
  function rdvGenDays() {
    var days = [];
    var d = new Date();
    d.setHours(0,0,0,0);
    while (days.length < 14) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) { // skip dimanche
        var iso = d.toISOString().split('T')[0];
        days.push({
          iso: iso,
          dow: DOWS[d.getDay()],
          num: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          // Samedi : seulement matin, certains samedis fermés
          isSaturday: d.getDay() === 6,
          // 25% des jours = pas de dispo (fully booked, pour réalisme)
          fullyBooked: Math.random() < 0.18,
        });
      }
    }
    return days;
  }

  // Génère créneaux pour un jour donné
  function rdvGenSlots(day) {
    var slots = [];
    var morning = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00'];
    var afternoon = ['14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
    var hash = day.iso.split('-').join('').slice(-6);
    var seed = parseInt(hash, 10) || 1;
    function takenAt(idx) {
      // 30-50% des créneaux pris, distribution pseudo-aléatoire stable par jour
      return ((seed + idx * 7) % 10) < 4;
    }
    morning.forEach(function(t, i){ slots.push({ time: t, taken: takenAt(i), period: 'matin' }); });
    if (!day.isSaturday) {
      afternoon.forEach(function(t, i){ slots.push({ time: t, taken: takenAt(i + 12), period: 'apres-midi' }); });
    }
    return slots;
  }

  function rdvRenderDays() {
    var days = rdvGenDays();
    var html = '';
    days.forEach(function(d, i){
      var disabled = d.fullyBooked;
      html += '<button class="rdv-day' + (disabled ? ' disabled' : '') + '" data-iso="' + d.iso + '" data-idx="' + i + '"' + (disabled ? ' disabled' : '') + '>';
      html += '  <span class="rdv-day-dow">' + d.dow + '</span>';
      html += '  <span class="rdv-day-num">' + d.num + '</span>';
      html += '</button>';
    });
    document.getElementById('rdv-days').innerHTML = html;
    // Update month label avec le 1er jour visible
    var first = days[0];
    document.getElementById('rdv-cal-month').textContent = MONTHS[first.month] + ' ' + first.year;

    document.querySelectorAll('.rdv-day').forEach(function(btn){
      if (btn.classList.contains('disabled')) return;
      btn.addEventListener('click', function(){
        document.querySelectorAll('.rdv-day').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        var iso = btn.dataset.iso;
        var idx = parseInt(btn.dataset.idx, 10);
        var day = days[idx];
        rdvState.date = iso;
        rdvState.dateLabel = day.dow + '. ' + day.num + ' ' + MONTHS[day.month];
        rdvState.slot = null;
        document.getElementById('rdv-sum-date').textContent = rdvState.dateLabel;
        document.getElementById('rdv-sum-date').classList.remove('empty');
        document.getElementById('rdv-sum-slot').textContent = 'à choisir';
        document.getElementById('rdv-sum-slot').classList.add('empty');
        rdvRenderSlots(day);
        rdvUpdateSubmit();
      });
    });
  }

  function rdvRenderSlots(day) {
    var slots = rdvGenSlots(day);
    var matin = slots.filter(function(s){ return s.period === 'matin'; });
    var apresmidi = slots.filter(function(s){ return s.period === 'apres-midi'; });
    var html = '';
    if (matin.length) {
      html += '<div class="rdv-slots-group">';
      html += '  <div class="rdv-slots-grouplabel">Matin</div>';
      html += '  <div class="rdv-slots">';
      matin.forEach(function(s){
        html += '<button class="rdv-slot' + (s.taken ? ' taken' : '') + '" data-time="' + s.time + '"' + (s.taken ? ' disabled' : '') + '>' + s.time + '</button>';
      });
      html += '  </div>';
      html += '</div>';
    }
    if (apresmidi.length) {
      html += '<div class="rdv-slots-group">';
      html += '  <div class="rdv-slots-grouplabel">Après-midi</div>';
      html += '  <div class="rdv-slots">';
      apresmidi.forEach(function(s){
        html += '<button class="rdv-slot' + (s.taken ? ' taken' : '') + '" data-time="' + s.time + '"' + (s.taken ? ' disabled' : '') + '>' + s.time + '</button>';
      });
      html += '  </div>';
      html += '</div>';
    }
    var slotsAvailable = slots.filter(function(s){ return !s.taken; }).length;
    if (slotsAvailable === 0) {
      html = '<div class="rdv-slots-empty">Aucun créneau disponible ce jour-là. Essayez un autre jour.</div>';
    }
    document.getElementById('rdv-slots-container').innerHTML = html;
    document.querySelectorAll('.rdv-slot').forEach(function(btn){
      if (btn.classList.contains('taken')) return;
      btn.addEventListener('click', function(){
        document.querySelectorAll('.rdv-slot').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        rdvState.slot = btn.dataset.time;
        document.getElementById('rdv-sum-slot').textContent = rdvState.slot;
        document.getElementById('rdv-sum-slot').classList.remove('empty');
        rdvUpdateSubmit();
      });
    });
  }

  function rdvInitMotifs() {
    document.querySelectorAll('.rdv-motif').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('.rdv-motif').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        rdvState.motif = btn.dataset.motif;
        rdvState.motifCat = btn.dataset.cat;
        document.getElementById('rdv-sum-motif').textContent = btn.dataset.motif;
        document.getElementById('rdv-sum-motif').classList.remove('empty');
        rdvUpdateSubmit();
      });
    });
  }

  function rdvUpdateSubmit() {
    var btn = document.getElementById('rdv-submit-btn');
    if (!btn) return;
    btn.disabled = !(rdvState.date && rdvState.slot && rdvState.motif);
  }

  window.rdvOpen = function() {
    var ov = document.getElementById('rdv-overlay');
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!rdvInited) {
      rdvInited = true;
      rdvRenderDays();
      rdvInitMotifs();
    }
  };

  window.rdvClose = function() {
    document.getElementById('rdv-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && document.getElementById('rdv-overlay').classList.contains('open')) {
      rdvClose();
    }
  });

  window.rdvSubmit = function(e) {
    e.preventDefault();
    rdvState.name = document.getElementById('rdv-name').value;
    rdvState.phone = document.getElementById('rdv-phone').value;
    rdvState.email = document.getElementById('rdv-email').value;
    rdvState.message = document.getElementById('rdv-msg').value;
    fetch('/api/prospect/contact-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        type: 'rdv_composer',
        name: rdvState.name,
        phone: rdvState.phone,
        email: rdvState.email,
        message: 'RDV demandé — ' + rdvState.dateLabel + ' à ' + rdvState.slot +
                 ' | Motif: ' + rdvState.motif +
                 (rdvState.motifCat === 'urgence' ? ' (URGENCE)' : '') +
                 (rdvState.message ? ' | Note: ' + rdvState.message : ''),
      }),
      keepalive: true
    }).catch(function(){});
    document.getElementById('rdv-default-view').style.display = 'none';
    document.getElementById('rdv-confirm-detail').textContent = rdvState.dateLabel + ' · ' + rdvState.slot;
    document.getElementById('rdv-success').classList.add('show');
    setTimeout(function(){
      rdvClose();
      document.getElementById('rdv-default-view').style.display = '';
      document.getElementById('rdv-success').classList.remove('show');
    }, 4500);
  };
})();
</script>
<!-- ═══════════════════ /RDV COMPOSER ═══════════════════ -->
`;
}
