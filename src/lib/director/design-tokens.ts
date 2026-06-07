/**
 * WebDirector Design System — Premium Dark Mode Gamifié
 *
 * Tokens autonomes (pas de dépendance à l'UI existante /prospects/).
 * Pensés pour effet "Wahou" + gamification (paris sportifs).
 *
 * Si EMERGENT_API_KEY est dispo, certains aspects peuvent être enrichis
 * via /api/director/emergent-style. Sinon, on tourne sur ces tokens
 * autonomes (qui sont déjà premium).
 */

export const DIRECTOR_TOKENS = {
  // ─── Palette : noir profond + or + accents néon ───
  colors: {
    // Surfaces
    bg_deep: "#05060A",         // fond ultra-sombre (presque noir avec teinte bleu nuit)
    bg_card: "#0E1015",
    bg_elevated: "#161922",
    bg_glass: "rgba(255, 255, 255, 0.03)",
    border: "rgba(255, 215, 0, 0.08)",
    border_strong: "rgba(255, 215, 0, 0.18)",

    // Texte
    text_primary: "#F5F5F7",
    text_secondary: "#A7A8AE",
    text_muted: "#6B6C73",
    text_dim: "#4A4B52",

    // Accents premium
    gold: "#FFD700",            // jaune Webconceptor cohérent
    gold_glow: "rgba(255, 215, 0, 0.35)",
    gold_soft: "#FFE779",

    // Signaux gamification (paris sportifs)
    win: "#00E676",             // vert néon
    win_glow: "rgba(0, 230, 118, 0.35)",
    danger: "#FF3B6B",          // rouge magenta (pas de boring rouge)
    danger_glow: "rgba(255, 59, 107, 0.35)",
    pending: "#4D7EFF",
    pending_glow: "rgba(77, 126, 255, 0.35)",

    // Crédits / tokens
    token_pink: "#FF52A5",      // rose vif pour les jetons
    token_glow: "rgba(255, 82, 165, 0.45)",
  },

  // ─── Typographie ───
  fonts: {
    display: `"Space Grotesk", "Inter", system-ui, sans-serif`,
    body: `"Inter", system-ui, sans-serif`,
    mono: `"JetBrains Mono", "Courier New", monospace`,
  },

  // ─── Spacing / sizing ───
  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "24px",
    pill: "100px",
  },

  shadows: {
    glow_gold: "0 0 30px rgba(255, 215, 0, 0.25), 0 0 60px rgba(255, 215, 0, 0.10)",
    glow_win: "0 0 30px rgba(0, 230, 118, 0.30)",
    glow_danger: "0 0 30px rgba(255, 59, 107, 0.30)",
    card: "0 12px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)",
    elevated: "0 24px 80px rgba(0, 0, 0, 0.55), 0 8px 20px rgba(0, 0, 0, 0.35)",
  },

  // ─── Animations gamifiées ───
  motion: {
    bounce_in: "cubic-bezier(0.34, 1.56, 0.64, 1)",       // overshoot
    snap: "cubic-bezier(0.20, 0.85, 0.30, 1.10)",         // claquant
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

/**
 * CSS embarqué pour les pages /director/* — chargé via <style> dans le layout.
 * Pas de Tailwind ici pour rester indépendant de l'UI existante.
 */
export const DIRECTOR_BASE_CSS = `
  :root {
    --d-bg: ${DIRECTOR_TOKENS.colors.bg_deep};
    --d-card: ${DIRECTOR_TOKENS.colors.bg_card};
    --d-elevated: ${DIRECTOR_TOKENS.colors.bg_elevated};
    --d-glass: ${DIRECTOR_TOKENS.colors.bg_glass};
    --d-border: ${DIRECTOR_TOKENS.colors.border};
    --d-border-strong: ${DIRECTOR_TOKENS.colors.border_strong};
    --d-text: ${DIRECTOR_TOKENS.colors.text_primary};
    --d-text-2: ${DIRECTOR_TOKENS.colors.text_secondary};
    --d-text-3: ${DIRECTOR_TOKENS.colors.text_muted};
    --d-gold: ${DIRECTOR_TOKENS.colors.gold};
    --d-gold-glow: ${DIRECTOR_TOKENS.colors.gold_glow};
    --d-win: ${DIRECTOR_TOKENS.colors.win};
    --d-win-glow: ${DIRECTOR_TOKENS.colors.win_glow};
    --d-danger: ${DIRECTOR_TOKENS.colors.danger};
    --d-token: ${DIRECTOR_TOKENS.colors.token_pink};
    --d-token-glow: ${DIRECTOR_TOKENS.colors.token_glow};
    --d-font-display: ${DIRECTOR_TOKENS.fonts.display};
    --d-font-body: ${DIRECTOR_TOKENS.fonts.body};
    --d-radius-md: ${DIRECTOR_TOKENS.radius.md};
    --d-radius-lg: ${DIRECTOR_TOKENS.radius.lg};
    --d-radius-xl: ${DIRECTOR_TOKENS.radius.xl};
    --d-shadow-card: ${DIRECTOR_TOKENS.shadows.card};
    --d-shadow-elevated: ${DIRECTOR_TOKENS.shadows.elevated};
    --d-shadow-glow-gold: ${DIRECTOR_TOKENS.shadows.glow_gold};
  }

  /* Reset & base */
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  .director-app {
    background: radial-gradient(ellipse at top, #0A0D18 0%, #05060A 50%, #000 100%);
    color: var(--d-text);
    font-family: var(--d-font-body);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* Halo doré au fond */
  .director-app::before {
    content: '';
    position: fixed;
    top: -50%; left: 50%;
    width: 1200px; height: 1200px;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .d-container {
    position: relative;
    z-index: 1;
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* ── Cartes premium ── */
  .d-card {
    background: var(--d-card);
    border: 1px solid var(--d-border);
    border-radius: var(--d-radius-lg);
    padding: 24px;
    box-shadow: var(--d-shadow-card);
    backdrop-filter: blur(10px);
    transition: transform 0.3s ${DIRECTOR_TOKENS.motion.smooth},
                border-color 0.3s ${DIRECTOR_TOKENS.motion.smooth},
                box-shadow 0.3s ${DIRECTOR_TOKENS.motion.smooth};
  }
  .d-card:hover {
    transform: translateY(-2px);
    border-color: var(--d-border-strong);
    box-shadow: var(--d-shadow-elevated);
  }

  /* ── Bouton premium doré ── */
  .d-btn-primary {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #0a0a0a;
    border: none;
    padding: 14px 28px;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: ${DIRECTOR_TOKENS.radius.pill};
    cursor: pointer;
    transition: transform 0.2s ${DIRECTOR_TOKENS.motion.snap},
                box-shadow 0.2s ${DIRECTOR_TOKENS.motion.smooth};
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.30), 0 2px 8px rgba(255, 215, 0, 0.20);
  }
  .d-btn-primary:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 16px 40px rgba(255, 215, 0, 0.45), 0 4px 14px rgba(255, 215, 0, 0.25);
  }
  .d-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .d-btn-ghost {
    background: transparent;
    color: var(--d-text);
    border: 1px solid var(--d-border-strong);
    padding: 12px 22px;
    font-weight: 600;
    border-radius: ${DIRECTOR_TOKENS.radius.pill};
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .d-btn-ghost:hover { background: var(--d-glass); border-color: var(--d-gold); }

  /* ── Inputs ── */
  .d-input {
    width: 100%;
    background: var(--d-elevated);
    border: 1px solid var(--d-border);
    color: var(--d-text);
    padding: 14px 16px;
    border-radius: var(--d-radius-md);
    font-family: var(--d-font-body);
    font-size: 15px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .d-input:focus {
    outline: none;
    border-color: var(--d-gold);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.15);
  }

  .d-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--d-text-3);
    margin-bottom: 8px;
  }

  /* ── Titres ── */
  .d-display {
    font-family: var(--d-font-display);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }

  .d-h1 { font-size: clamp(32px, 5vw, 56px); margin: 0 0 12px; }
  .d-h2 { font-size: clamp(22px, 3vw, 32px); margin: 0 0 10px; font-family: var(--d-font-display); font-weight: 700; }

  /* ── Jauge de crédits gamifiée ── */
  .d-credits-orb {
    position: relative;
    background: radial-gradient(circle at 30% 30%, var(--d-token) 0%, #ad2470 60%, #5d0e3a 100%);
    color: #fff;
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 40px var(--d-token-glow), inset 0 -10px 20px rgba(0,0,0,0.3), inset 0 10px 20px rgba(255,255,255,0.2);
    animation: dPulse 3s ease-in-out infinite;
  }
  .d-credits-orb .num {
    font-family: var(--d-font-display);
    font-weight: 800;
    font-size: 32px;
    line-height: 1;
  }
  .d-credits-orb .label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.85;
    margin-top: 4px;
  }
  @keyframes dPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); box-shadow: 0 0 60px var(--d-token-glow), inset 0 -10px 20px rgba(0,0,0,0.3), inset 0 10px 20px rgba(255,255,255,0.25); }
  }

  /* ── Badge "PAYOUT" gamifié ── */
  .d-payout-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(0, 230, 118, 0.12);
    color: var(--d-win);
    border: 1px solid rgba(0, 230, 118, 0.30);
    border-radius: ${DIRECTOR_TOKENS.radius.pill};
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  /* ── Animations succès (utilisées au clic "Lancer") ── */
  @keyframes dSuccessFlash {
    0% { transform: scale(0.85); opacity: 0; }
    50% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .d-success-pulse { animation: dSuccessFlash 0.6s ${DIRECTOR_TOKENS.motion.bounce_in}; }
`;
