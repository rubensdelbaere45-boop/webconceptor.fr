# Déploiement pipeline vidéos TikTok

## Vue d'ensemble

```
[N8N cron 8h/14h/18h Paris]
        │
        ▼
[POST /api/admin/generate-tiktok-video]   ← Vercel (Next.js, 5min max)
        │
        ▼
[POST short-video-maker /api/short-video] ← Railway (Docker, GPU optionnel)
        │
        ▼  (polling status)
[GET  short-video-maker /api/short-video/{id}/status]
        │
        ▼  status=ready
[INSERT mockup_videos en DB]
[Telegram → URL MP4 → Tom upload manuel iPhone TikTok]
```

## 1. Déployer short-video-maker sur Railway

```bash
# Repo : https://github.com/gyoridavid/short-video-maker
# Image officielle : ghcr.io/gyoridavid/short-video-maker:latest-tiny
```

**Railway → New Project → Deploy from GitHub repo → fork short-video-maker.**

Variables d'environnement Railway :
| Variable | Valeur | Note |
|---|---|---|
| `PEXELS_API_KEY` | (gratuit pexels.com/api) | Vidéos de fond |
| `LOG_LEVEL` | `info` | |
| `WHISPER_MODEL` | `tiny.en` | Anglais, rapide |
| `CONCURRENCY` | `1` | Évite OOM si pas de GPU |
| `KOKORO_MODEL_PRECISION` | `q4` | Modèle quantifié, RAM faible |
| `PORT` | `3123` | (Railway l'expose auto) |

**RAM minimale : 4 Go**. Plan Railway "Hobby" 5$/mois suffit.

Une fois déployé, récupère l'URL publique (ex: `svm-production.up.railway.app`).

## 2. Variables d'environnement Vercel

À ajouter dans Vercel → Settings → Environment Variables :

| Variable | Valeur | Note |
|---|---|---|
| `SHORT_VIDEO_MAKER_URL` | `https://svm-production.up.railway.app` | Pas de slash final |
| `SHORT_VIDEO_MAKER_SECRET` | (optionnel) | Si tu actives auth Bearer côté SVM |

## 3. Migrer la DB

Dans Supabase SQL editor, exécute :
```sql
-- contenu de sql/2026_06_06_mockup_videos.sql
```

## 4. Importer le workflow N8N

1. N8N → Import workflow
2. Coller le JSON de `n8n-workflows/07_tiktok_video_generation.json`
3. Activer le workflow
4. Les 3 schedules tournent : 8h, 14h, 18h Paris

## 5. Cycle de vie d'une vidéo

| Étape | Outil | Temps |
|---|---|---|
| 1. Gen entreprise fictive + script | Vercel | < 100ms |
| 2. Création job SVM | Railway | < 5s |
| 3. TTS + captions + Pexels + Remotion | Railway | 2-5min |
| 4. Polling | Vercel | 4min max |
| 5. Notif Telegram avec URL MP4 | Telegram | instant |
| 6. **Tom télécharge + upload TikTok iPhone** | manuel | 30s |

## ⚠️ Limitations actuelles à connaître

### Narration en ANGLAIS uniquement
Kokoro-js (le TTS embarqué dans short-video-maker) **ne supporte que l'anglais**.
C'est documenté en limitation du repo upstream.

**Options pour passer en français :**

| Option | Coût | Effort | Qualité |
|---|---|---|---|
| **A) VO EN + sous-titres FR overlay** | 0€ | Faible (déjà géré) | OK pour audience millennials/Z |
| **B) ElevenLabs API multilingual** | 5$/mois (10k chars) | Moyen (fork + remplace Kokoro) | Excellente |
| **C) XTTS-v2 self-hosted Railway** | 0€ + RAM | Élevé (besoin GPU pour vitesse) | Bonne |
| **D) Coqui TTS / Piper FR** | 0€ | Élevé | Correct |

**Recommandation pragmatique :** lancer en EN (option A) + voir si ça performe sur TikTok FR. Si oui, valider l'investissement vers ElevenLabs (B). 10k chars/mois = ~30 vidéos de 60 sec.

### Upload TikTok manuel
TikTok n'a pas d'API publique d'upload sans validation Content Posting API
(processus de plusieurs mois, refusé hors gros comptes). Alternatives :

- **Postiz** (open-source, auto-héberge sur Railway, gratuit) — recommandé si tu veux automatiser
- **Buffer / Hootsuite** (payants, à partir de 6$/mois)
- **Manuel iPhone** (zéro risque ban, 30s/vidéo) — choix par défaut

## 6. Stratégie de contenu

- **3 vidéos / jour** (cron 8h, 14h, 18h → upload prime time 12h, 19h, 21h)
- **Alterne** "creation" (entreprise nouvelle) et "transformation" (avant/après)
- **Toujours fictif** — le générateur `fake-business.ts` invente noms + villes pour éviter plainte
- **Format 9:16 portrait**, 60 sec, captions centrées
- **Hashtags à coller manuellement TikTok** : `#webdesign #petiteentreprise #artisan #avantapres #freelance #frenchtouch #tiktokfr`
