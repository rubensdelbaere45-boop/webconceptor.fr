// preload.js — Bridge sécurisé entre Electron et l'app web Caissio
// contextIsolation est activé : seules les APIs exposées ici sont accessibles

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("caissioDesktop", {
  // Version de l'app desktop
  version: process.env.npm_package_version || "1.0.0",

  // Platform (win32 | darwin | linux)
  platform: process.platform,

  // Signale que c'est l'app desktop (pour adapter l'UI si besoin)
  isDesktop: true,
});
