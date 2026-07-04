# ImmoPlatform — Astra Wave

Super-application SaaS immobilière française : **ImmoScore** (score IA /100 d'annonces),
**RenovAI** (estimation travaux par photo), **AgencePro** (CRM B2B agences) et
**ImmoDeal** (marketplace communautaire de deals).

Voir [CLAUDE.md](CLAUDE.md) pour le contexte complet (stack, conventions, méthode BMAD).

## Stack

- **Frontend/Backend** : Next.js 15 (App Router) · React 19 · TypeScript 5.7 · Tailwind CSS 3.4
- **BDD** : PostgreSQL (Supabase en prod) via Prisma 5
- **Cache/queues** : Redis (Upstash en prod) · BullMQ
- **Auth** : Clerk · **Paiement** : Stripe · **IA** : Claude (Anthropic)
- **Stockage** : Cloudflare R2 · **Emails** : Resend

## Démarrage rapide avec Docker (recommandé)

```bash
cp .env.example .env.local
# Remplir au minimum : NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
# ANTHROPIC_API_KEY. Stripe/R2/Resend/Stream Estate selon les features testées.

docker compose up --build
```

Puis, au premier lancement, initialiser le schéma et les données de démo :

```bash
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

- Application : http://localhost:3000
- PostgreSQL : `localhost:5432` (user/pass/db : `immoplatform`)
- Redis : `localhost:6379`

La stack Docker comprend 4 services : `app` (Next.js standalone), `workers`
(BullMQ analyse + alertes), `postgres` (16) et `redis` (7). En production,
`app` se déploie sur Vercel, `workers` sur Railway, la BDD sur Supabase et
Redis sur Upstash — les mêmes variables d'environnement s'appliquent.

## Démarrage sans Docker

```bash
npm install
cp .env.example .env.local        # remplir les vraies valeurs
npm run db:generate && npm run db:push && npm run db:seed
npm run dev                       # Next.js sur :3000
npm run workers                   # workers BullMQ (terminal séparé)
```

Nécessite un PostgreSQL et un Redis accessibles (`DATABASE_URL`, `REDIS_URL`).

## Commandes utiles

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript sans emit
npm test              # Jest (tests/unit)
npm run test:e2e      # Playwright
npm run db:studio     # Interface visuelle Prisma
npm run build         # Build production
```

## Webhooks à configurer

| Service | Endpoint | Événements |
|---------|----------|------------|
| Clerk | `/api/webhooks/clerk` | `user.created`, `user.updated`, `user.deleted` |
| Stripe | `/api/webhooks/stripe` | `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed` |

En local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe` et un
tunnel (ngrok) pour Clerk.

## Sécurité — rappels absolus

- `ANTHROPIC_API_KEY` reste côté serveur, jamais en `NEXT_PUBLIC_`
- Signatures des webhooks Stripe/Clerk vérifiées avant tout traitement
- Validation Zod + rate limiting Redis sur toutes les routes sensibles
- Le parsing d'annonces passe exclusivement par Stream Estate (jamais de scraping direct)
