# Guide pour Claude — Gérer N8N et Railway sur WebConceptor

Ce document est destiné à toi, **Claude**, futur agent qui ouvre ce repo.
Tom (Rubens) attend que tu fasses **toi-même** les modifications sur N8N et
Railway sans lui demander des étapes manuelles. Voici comment.

---

## 🎯 Règles d'or (à respecter strictement)

1. **Tom ne fait rien à la main.** Si tu peux automatiser, fais-le. Ne renvoie
   jamais un "va dans tel menu et clique ici", sauf si vraiment impossible.
2. **Push après chaque modif** sur GitHub `main` → Vercel déploie auto.
3. **Idempotence** : avant de créer un workflow, check s'il existe déjà
   (`findWorkflowByName`). Avant d'insérer en DB, check le doublon.
4. **Pas de demande de confirmation** sauf si action destructrice.

---

## 🔧 N8N — API et conventions

### Instance et endpoint

```
N8N_BASE_URL = https://n8n-production-3b6a.up.railway.app
N8N_API_KEY  = (dispo dans Vercel env vars + GitHub secrets)
```

L'API officielle est documentée sur https://docs.n8n.io/api/. Le client est
déjà câblé dans `src/lib/n8n-client.ts`. Les helpers disponibles :

| Helper | Usage |
|---|---|
| `listWorkflows()` | Liste tous les workflows |
| `findWorkflowByName(name)` | Cherche par nom exact (idempotence) |
| `createWorkflow(json)` | Crée à partir d'un export JSON |
| `activateWorkflow(id)` | Active |
| `deactivateWorkflow(id)` | Désactive |
| `cycleWorkflow(id)` | Déactivate + reactivate (force reset) |
| `listExecutions(id, limit)` | Logs des N dernières exécutions |
| `stopExecution(id)` | Stoppe une exécution stuck |

### Importer un nouveau workflow programmatiquement

1. Écris le JSON du workflow dans `n8n-workflows/NN_nom.json` (suit la
   convention des workflows 01-07 existants).
2. Crée une route admin qui appelle `createWorkflow()` puis `activateWorkflow()`.
   Exemple : `src/app/api/admin/setup-tiktok-pipeline/route.ts`.
3. Push. Demande à Tom d'appeler la route une fois — la mécanique gère tout.

### Format JSON workflow attendu

Champs obligatoires : `name`, `nodes`, `connections`, `settings`.
**NE PAS inclure** `active`, `createdAt`, `id`, `versionId` — l'API les rejette.

Référence de structure : ouvre n'importe quel fichier de `n8n-workflows/`.
Schedule trigger pattern type :
```json
{
  "parameters": {
    "rule": { "interval": [{ "field": "cronExpression", "expression": "0 8 * * *" }] },
    "timezone": "Europe/Paris"
  },
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

HTTP Request vers Vercel pattern type :
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://webconceptor.fr/api/admin/XXX",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "x-admin-key", "value": "Rubens2026-WebConceptor" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "jsonBody": "={{ JSON.stringify({ key: value }) }}",
    "options": { "timeout": 295000 }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

Telegram notif pattern type :
```json
{
  "parameters": {
    "chatId": "8673908436",
    "text": "=📦 Texte {{ $json.field }}",
    "additionalFields": { "parse_mode": "Markdown" }
  },
  "type": "n8n-nodes-base.telegram",
  "typeVersion": 1.2,
  "credentials": { "telegramApi": { "id": "R7ocSIvNCsEI3AKl", "name": "Telegram account" } }
}
```

### Workflows existants (ne PAS toucher sans demander)

| ID | Nom |
|---|---|
| `wSmfcn9acDuKdVqT` | Prospection quotidienne 9h |
| `YxIeBu4yoYxwOLoC` | Relances J+2 (10h30) |
| `wfG4XLRdreNqmao4` | 2ème vague emails (15h) |
| `sIZJEsAXU3lAH8Ep` | Prospection 200 Emails IA Direct |
| `03noc9YABRA3KMao` | SIRENE scrape daily 5h |

Ces workflows sont surveillés par `src/app/api/monitor/n8n/route.ts` qui
re-active automatiquement s'ils tombent.

---

## 🚂 Railway — services et déploiement

### Services existants

| Service | Rôle | URL |
|---|---|---|
| N8N | Workflows | `n8n-production-3b6a.up.railway.app` |
| Scrapling | Scrape Pages Jaunes anti-bot | env `SCRAPLING_SERVICE_URL` |
| short-video-maker | Gen vidéos TikTok | env `SHORT_VIDEO_MAKER_URL` (à set par Tom) |

### Limite Claude

Tu ne peux PAS déployer un nouveau service Railway sans intervention humaine
(Railway demande OAuth GitHub + paiement plan Hobby). Pour un nouveau service :

1. Crée un template Railway JSON à la racine (ex : `railway-svm-template.json`)
2. Écris les instructions claires dans le README ou le doc dédié
3. Demande à Tom de cliquer "Deploy to Railway" 1 fois (1 min)
4. Une fois déployé, **tu** récupères l'URL via Tom et automatises tout le reste

Pour les services DÉJÀ déployés : tu peux changer env vars via Railway API si
`RAILWAY_TOKEN` est dispo sur Vercel, mais c'est rare. Plus simple : passe par
le dashboard via Tom.

---

## 🗄️ Supabase — migrations

### Limite PostgREST

L'API Supabase REST (PostgREST) **ne supporte pas le DDL** (CREATE TABLE,
ALTER TABLE). Si tu écris un fichier `sql/YYYY_MM_DD_*.sql`, tu DOIS demander
à Tom de l'exécuter dans **Supabase > SQL Editor**. C'est la seule étape
manuelle inévitable.

**Astuce idempotence** : utilise toujours `CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
Comme ça si Tom relance le SQL plusieurs fois, ça ne casse rien.

### Pour le DML (insert/update/delete) et le SELECT

`createClient(URL, SERVICE_ROLE_KEY)` te donne tous les droits.
Toujours utiliser `SUPABASE_SERVICE_ROLE_KEY` côté serveur — jamais l'anon key.

---

## 📦 Pattern setup tout-en-un

Exemple : `src/app/api/admin/setup-tiktok-pipeline/route.ts`. Ce pattern doit
être ton réflexe pour toute nouvelle feature qui touche N8N + Supabase + Vercel.

Structure type :
```ts
export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 300, routeKey: "setup-xxx" });
  if (guard) return guard;

  const report: Array<{ step: string; ok: boolean; detail?: string }> = [];

  // 1. Vérifie Supabase (probe table, dis à Tom de migrer si absente)
  // 2. Crée workflow N8N si absent (findWorkflowByName + createWorkflow)
  // 3. Active le workflow
  // 4. Health-check les services externes (safeFetch)
  // 5. Notifie Telegram avec le rapport
  // 6. Renvoie le report + next_steps

  return NextResponse.json({ ok: report.every(r => r.ok), report, next_steps: [...] });
}
```

Tom appelle `POST /api/admin/setup-xxx` une fois depuis l'admin UI.
Pas de manipulation manuelle de fichiers JSON, pas de copier-coller.

---

## 🔐 Secrets et auth

| Variable | Où | Usage |
|---|---|---|
| `ADMIN_SECRET_KEY` | Vercel + GitHub | Auth des routes /api/admin/* |
| `N8N_API_KEY` | Vercel | Client N8N (n8n-client.ts) |
| `N8N_BASE_URL` | Vercel | Base URL N8N (Railway) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | DB côté serveur |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Vercel | Notifs |
| `BREVO_API_KEY` | Vercel | Email + SMS |
| `RESEND_API_KEY` | Vercel | Failover email |
| `SHORT_VIDEO_MAKER_URL` | Vercel (à set) | Service Railway vidéos |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Vercel | Paiement |

Toujours protéger les routes admin avec `requireAdminGuard(req, { limit, windowSec, routeKey })`.

---

## 🧪 Tester sans déployer

Pour tester une route en local :
```bash
cd /Users/rubensdelbaere/Downloads/webconceptor-3.fr-main
npm run dev
# Dans un autre terminal :
curl -X POST http://localhost:3000/api/admin/setup-tiktok-pipeline \
  -H "x-admin-key: $ADMIN_SECRET_KEY"
```

Pour tester un workflow N8N sans cron : ouvre N8N, clique "Execute workflow"
en haut à droite.

---

## ❌ Ce que tu ne dois JAMAIS faire

- ❌ Toucher au compte WhatsApp perso de Tom (ban risk)
- ❌ Cibler une VRAIE entreprise dans les vidéos TikTok (plainte)
- ❌ Skip les pre-commit hooks (`--no-verify`)
- ❌ Force push sur main
- ❌ Commiter des secrets en clair dans le repo
- ❌ Bypasser `requireAdminGuard` sur une route admin
- ❌ Utiliser `.or()` PostgREST avec interpolation user-controlled (injection)
- ❌ `fetch(userProvidedUrl)` sans `safeFetch` (SSRF)
- ❌ Faire envoyer SMS à 5h du matin (couvre-feu SMS = 9h-19h, pas 5h-19h)

---

## 📋 Checklist nouveau feature

Quand Tom demande une feature qui touche N8N + serveur :

- [ ] Code la route Next.js dans `src/app/api/...`
- [ ] Auth obligatoire : `requireAdminGuard(req, ...)`
- [ ] Si nouvelle table : `sql/YYYY_MM_DD_*.sql` avec `IF NOT EXISTS`
- [ ] Si workflow N8N : JSON dans `n8n-workflows/NN_*.json`
- [ ] Endpoint `setup-xxx` qui orchestre tout (1 clic pour Tom)
- [ ] Page admin avec bouton (optionnel mais préférable)
- [ ] Doc dans `docs/` si nouveau service externe
- [ ] TypeScript check : `npx tsc --noEmit` doit passer
- [ ] Commit + push
- [ ] Notifier Tom de ce qui reste manuel (rarement plus que cliquer 1 bouton)

C'est ça la barre.
