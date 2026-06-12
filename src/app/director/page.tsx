/**
 * /director — Single-Page App Klyora Director
 *
 * Le composant DirectorApp gère lui-même la transition entre les 4 écrans
 * (login → change-password → welcome → dashboard) via son state interne.
 * Les vraies APIs Next.js sont câblées dans les handlers et les screens
 * (cf. _app/screens/LoginScreen.tsx, ChangePasswordScreen.tsx, et
 * _app/DirectorApp.tsx handleHire/handleRechargeConfirm).
 *
 * showDevNav=false → on cache le panneau de navigation dev en production.
 */
"use client";

import { DirectorApp } from "./_app/DirectorApp";

export default function DirectorPage() {
  return <DirectorApp showDevNav={false} />;
}
