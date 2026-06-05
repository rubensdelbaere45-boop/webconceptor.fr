# Motion Canvas — Teasers vidéo personnalisés

Génère des vidéos courtes (10s, format 1080×1350 Instagram portrait) **personnalisées par prospect**, à embarquer dans :
- Emails Brevo (en GIF animé)
- Posts LinkedIn organiques
- Pages prospects

## Installation

```bash
cd motion-teasers
npm install
```

## Preview en live

```bash
npm start
# Ouvre http://localhost:9000
```

## Rendre une vidéo personnalisée

```bash
PROSPECT_NAME="L'atelier de Kenaël" \
PROSPECT_CITY="Origny-en-Thiérache" \
PROSPECT_TYPE="menuisier" \
npm run render
```

Sortie : `output/teaser-offer.mp4` (10s, ~3 Mo)

## Conversion MP4 → GIF (pour emails)

```bash
ffmpeg -i output/teaser-offer.mp4 -vf "fps=15,scale=600:-1" -loop 0 teaser.gif
```

## Pipeline d'automatisation (futur)

1. Cron Vercel récupère les nouveaux prospects "found"
2. Lance le rendu Motion Canvas pour chacun
3. Upload le GIF/MP4 sur Supabase Storage
4. Email Brevo utilise l'URL du GIF dans le template
