const { app, BrowserWindow, shell, Menu, nativeTheme } = require("electron");
const path = require("path");

// URL de production Caissio
const CAISSIO_BASE = "https://www.webconceptor.fr/caissio";
const CAISSIO_LOGIN = `${CAISSIO_BASE}/login`;

// Désactive le menu natif (on garde un menu minimal pour les raccourcis clavier)
Menu.setApplicationMenu(Menu.buildFromTemplate([
  {
    label: "Caissio",
    submenu: [
      { label: "À propos", role: "about" },
      { type: "separator" },
      { label: "Quitter", role: "quit" },
    ],
  },
  {
    label: "Édition",
    submenu: [
      { label: "Annuler", role: "undo" },
      { label: "Rétablir", role: "redo" },
      { type: "separator" },
      { label: "Couper", role: "cut" },
      { label: "Copier", role: "copy" },
      { label: "Coller", role: "paste" },
    ],
  },
  {
    label: "Affichage",
    submenu: [
      { label: "Recharger", role: "reload" },
      { label: "Plein écran", role: "togglefullscreen" },
      { label: "Zoom +", role: "zoomin" },
      { label: "Zoom −", role: "zoomout" },
      { label: "Réinitialiser le zoom", role: "resetzoom" },
    ],
  },
]));

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "Caissio",
    icon: path.join(__dirname, "resources", process.platform === "win32" ? "icon.ico" : "icon.png"),
    backgroundColor: "#f8fafc",
    show: false, // Affiche la fenêtre une fois chargée (évite le flash blanc)
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Affiche la fenêtre dès que le contenu est prêt (évite flash blanc)
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  // Charge l'app Caissio
  win.loadURL(CAISSIO_LOGIN).catch(() => {
    // Fallback page hors-ligne
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Caissio — Hors ligne</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 display: flex; align-items: center; justify-content: center;
                 height: 100vh; margin: 0; background: #f8fafc; flex-direction: column; gap: 16px; }
          h1 { font-size: 24px; color: #0f172a; margin: 0; }
          p { color: #64748b; font-size: 14px; margin: 0; }
          button { background: #4f46e5; color: white; border: none; padding: 10px 24px;
                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
          button:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <h1>Caissio</h1>
        <p>Impossible de se connecter à Internet. Vérifiez votre connexion.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </body>
      </html>
    `)}`);
  });

  // Ouvre les liens externes (Stripe checkout, CGU, etc.) dans le navigateur système
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Empêche la navigation en dehors de Caissio (sauf Stripe checkout)
  win.webContents.on("will-navigate", (event, url) => {
    const isAllowed =
      url.startsWith(CAISSIO_BASE) ||
      url.startsWith("https://checkout.stripe.com") ||
      url.startsWith("https://billing.stripe.com") ||
      url.startsWith("data:");

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Évite les popups indésirables dans l'app
  win.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    if (!url.startsWith(CAISSIO_BASE)) {
      shell.openExternal(url);
    } else {
      win.loadURL(url);
    }
  });

  return win;
}

// Lance l'app
app.whenReady().then(() => {
  // Suit le thème système (light/dark)
  nativeTheme.themeSource = "light";

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitte sur Windows/Linux quand toutes les fenêtres sont fermées
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Sécurité : bloque les navigations vers des sites non-Caissio
app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event, url) => {
    if (!url.startsWith(CAISSIO_BASE) && !url.startsWith("data:")) {
      event.preventDefault();
    }
  });
});
