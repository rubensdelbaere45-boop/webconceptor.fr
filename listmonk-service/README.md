# Listmonk — Remplaçant gratuit de Brevo (à partir du 18 juin)

## Pourquoi

Brevo coûte ~30€/mois. Le plan expire le 17 juin avec 18 056 crédits.
À partir du 18 juin, on bascule sur **Listmonk + Resend** = 0€/mois.

## Architecture

```
WebConceptor (Vercel) ──API──> Listmonk (Railway) ──SMTP──> Resend (3000 emails/mois gratuits)
                                       │
                                       └──> AWS SES (backup, $0.10 / 1000 emails)
```

## Déploiement Railway

### 1. Crée un nouveau projet Railway
- New Project → Deploy from GitHub → `webconceptor.fr`
- Settings → Root Directory → `listmonk-service`

### 2. Ajoute PostgreSQL au projet
- "+ New" → Database → PostgreSQL

### 3. Variables d'environnement
```
LISTMONK_app__admin_username=admin
LISTMONK_app__admin_password=<openssl rand -hex 24>
LISTMONK_db__host=${{Postgres.PGHOST}}
LISTMONK_db__port=${{Postgres.PGPORT}}
LISTMONK_db__user=${{Postgres.PGUSER}}
LISTMONK_db__password=${{Postgres.PGPASSWORD}}
LISTMONK_db__database=${{Postgres.PGDATABASE}}
LISTMONK_db__ssl_mode=require
TZ=Europe/Paris
```

### 4. Premier démarrage : migration DB
- Settings → Start Command → `./listmonk --install --yes`
- Deploy → attendre les logs "DB tables created"
- Remettre Start Command à `./listmonk`

### 5. Génère le domaine Railway, port 9000

### 6. Configure Resend dans Listmonk
- Va sur l'admin Listmonk
- Settings → SMTP → Add new
  ```
  Host: smtp.resend.com
  Port: 587
  Username: resend
  Password: <ta clé API Resend>
  Auth: Login
  TLS: STARTTLS
  ```
- Test → Save

### 7. Crée une clé API Listmonk
- Admin → Settings → API → Create new API key
- Note la `username` + `token`

### 8. Variables Vercel (à set le 17 juin soir)
```
EMAIL_PROVIDER=listmonk
LISTMONK_URL=https://<ton-url>.up.railway.app
LISTMONK_USER=<api-username>
LISTMONK_TOKEN=<api-token>
```

## Migration code

Le code Next.js a un wrapper `src/lib/email-provider.ts` qui choisit
automatiquement entre Brevo et Listmonk selon `EMAIL_PROVIDER`.
Aucun changement dans les routes existantes.

## Resend signup (gratuit)

1. Va sur https://resend.com
2. Sign up avec contact@webconceptor.fr
3. Verify domain (webconceptor.fr) — ajoute les DNS records
4. API Keys → Create → Note la clé
5. Free tier : **3 000 emails/mois gratuits** (suffit largement)

Si tu dépasses, AWS SES en backup ($0.10 / 1000 emails).
