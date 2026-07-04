# CLAUDE.md — ImmoPlatform
## Contexte projet pour Claude (méthode BMAD)
**Astra Wave · Juin 2026 · Confidentiel**

---

## 1. Identité du projet

**ImmoPlatform** est une super-application SaaS immobilière française développée sous la marque **Astra Wave**. Elle repose sur quatre modules intégrés :

| Module | Rôle | Priorité |
|--------|------|----------|
| **ImmoScore** | Analyse d'annonces URL → score IA /100 + rapport | MVP |
| **RenovAI** | Estimation travaux par photo (Claude Vision) | MVP |
| **AgencePro** | CRM SaaS B2B pour agences immobilières | MVP |
| **ImmoDeal** | Marketplace communautaire de deals immobiliers | Phase 2 |

**Positionnement stratégique :** Infrastructure de scoring immobilier B2B-first. Les agences (99€/mois) sont la cible principale. Le B2C sert à construire la marque et le dataset propriétaire.

---

## 2. Stack technique — source de vérité

### Frontend
- **Next.js 15** (App Router, Server Components par défaut)
- **React 19** + **TypeScript 5.7** (strict mode)
- **Tailwind CSS 3.4** (classes utilitaires uniquement, pas de CSS inline sauf animation)
- **Clerk** pour l'auth (SSO Google/GitHub, Organizations pour les agences)

### Backend
- **API Routes Next.js** (pas de serveur séparé en MVP)
- **Prisma 5** + **PostgreSQL** via Supabase (schéma dans `prisma/schema.prisma`)
- **Redis** via Upstash (cache, sessions chatbot, rate limiting)
- **BullMQ** pour les jobs asynchrones (analyse, alertes)

### IA
- **Claude claude-sonnet-4-6** (Anthropic) — chatbot, résumés, modération
- **Claude Vision** — analyse photos RenovAI
- Clé API : côté serveur uniquement, jamais exposée au client
- Endpoint sécurisé : `/api/chat`, `/api/renovai`

### Données françaises
- DVF/Etalab — prix transactions réelles (gratuit, pas de clé)
- ADEME — DPE et diagnostics (gratuit)
- Géorisques — risques naturels (clé gratuite)
- BAN — géocodage adresses (gratuit)
- INSEE — données socio-économiques (clé gratuite)
- Stream Estate — annonces immobilières (payant, programme startup)

### Services tiers
- **Stripe** — abonnements SaaS (webhooks dans `/api/webhooks/stripe`)
- **Cloudflare R2** — stockage photos RenovAI et PDFs
- **Resend** — emails transactionnels
- **Mapbox GL** — cartes et isochrones transports
- **Meilisearch** — recherche full-text deals

### Déploiement
- **Vercel** — frontend Next.js
- **Railway** — workers BullMQ
- **Supabase** — PostgreSQL + stockage

---

## 3. Structure de fichiers — source de vérité

```
immoplatform/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Pages publiques non-auth
│   │   │   ├── (home)/           # Page d'accueil
│   │   │   ├── fonctionnalites/
│   │   │   ├── tarifs/
│   │   │   └── barometre/        # Carte prix marché (public)
│   │   ├── (auth)/               # Clerk sign-in/sign-up
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── sign-up/[[...sign-up]]/
│   │   ├── (dashboard)/          # App authentifiée
│   │   │   ├── dashboard/        # Vue d'ensemble utilisateur
│   │   │   ├── immoscore/        # Analyse d'annonces
│   │   │   ├── renovai/          # Estimation travaux
│   │   │   ├── immodeal/         # Liste des deals
│   │   │   │   └── [id]/         # Fiche deal + commentaires
│   │   │   ├── agence-pro/       # Dashboard agence
│   │   │   │   ├── acheteurs/    # CRM acheteurs
│   │   │   │   └── rapports/     # Rapports PDF générés
│   │   │   ├── alertes/          # Gestion alertes acheteurs
│   │   │   ├── profil/
│   │   │   └── parametres/       # Abonnement, facturation
│   │   ├── api/
│   │   │   ├── analyse/          # POST — pipeline analyse URL
│   │   │   ├── chat/             # POST — chatbot Claude (streaming)
│   │   │   ├── renovai/          # POST — analyse photos Vision
│   │   │   ├── deals/
│   │   │   │   ├── route.ts      # GET liste, POST créer
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts  # GET, PATCH, DELETE
│   │   │   │       ├── vote/     # POST vote chaud/froid
│   │   │   │       └── comments/ # GET, POST commentaires
│   │   │   ├── alertes/          # GET, POST, DELETE alertes
│   │   │   ├── agence/
│   │   │   │   └── acheteurs/    # CRUD acheteurs agence
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/     # POST — création session Stripe
│   │   │   │   └── portal/       # POST — portail client Stripe
│   │   │   ├── webhooks/
│   │   │   │   ├── clerk/        # Sync users Clerk → PostgreSQL
│   │   │   │   └── stripe/       # Sync abonnements Stripe
│   │   │   ├── upload/           # POST — upload photos R2
│   │   │   ├── pdf/              # POST — génération rapport PDF
│   │   │   └── barometre/        # GET — données prix marché public
│   │   ├── layout.tsx            # Root layout (Clerk, fonts, meta)
│   │   └── globals.css
│   ├── features/                 # Logique métier par module
│   │   ├── immoscore/
│   │   │   ├── components/       # Composants UI spécifiques
│   │   │   ├── hooks/            # useAnalysis, useScore...
│   │   │   └── actions/          # Server Actions Next.js
│   │   ├── renovai/
│   │   ├── immodeal/
│   │   ├── agence-pro/
│   │   ├── chatbot/
│   │   └── barometre/
│   ├── components/
│   │   ├── ui/                   # Composants génériques (Button, Card, Badge...)
│   │   ├── shared/               # Composants métier partagés
│   │   └── layout/               # Header, Sidebar, Footer
│   ├── lib/
│   │   ├── api-clients/          # Wrappers APIs externes
│   │   │   ├── dvf.ts            # DVF Etalab
│   │   │   ├── ademe.ts          # ADEME DPE
│   │   │   ├── georisques.ts     # Géorisques
│   │   │   ├── ban.ts            # Base Adresse Nationale
│   │   │   ├── insee.ts          # INSEE
│   │   │   ├── stream-estate.ts  # Stream Estate (annonces)
│   │   │   ├── mapbox.ts         # Mapbox isochrones
│   │   │   └── claude.ts         # Anthropic Claude API
│   │   ├── db/
│   │   │   ├── prisma.ts         # Singleton Prisma client
│   │   │   └── redis.ts          # Client Redis + helpers cache
│   │   ├── scoring/
│   │   │   └── algorithm.ts      # Algorithme score pondéré /100
│   │   ├── storage/
│   │   │   └── r2.ts             # Cloudflare R2 upload/download
│   │   ├── email/
│   │   │   └── alert.ts          # Templates Resend
│   │   ├── queue/                # Définitions queues BullMQ
│   │   ├── validators/           # Schémas Zod (AnalyseUrl, Deal, Alert...)
│   │   └── utils/
│   │       └── format.ts         # formatPrice, formatDate, formatRelativeDate...
│   ├── types/
│   │   └── index.ts              # Types globaux + helpers (getScoreLabel...)
│   ├── hooks/                    # Hooks React globaux
│   ├── styles/
│   └── middleware.ts             # Protection routes Clerk
├── workers/
│   ├── analyse-worker.ts         # Worker BullMQ — pipeline analyse async
│   └── alert-worker.ts           # Worker BullMQ — envoi alertes email
├── prisma/
│   ├── schema.prisma             # Schéma BDD complet (15 modèles)
│   ├── migrations/               # Migrations versionées Git
│   └── seed.ts                   # Données de démonstration
├── tests/
│   ├── unit/                     # Jest tests unitaires
│   ├── integration/              # Tests API routes
│   └── e2e/                      # Playwright tests end-to-end
├── public/
├── .env.example                  # Template variables d'env (ne pas modifier)
├── .env.local                    # Variables réelles (JAMAIS dans Git)
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── CLAUDE.md                     # CE FICHIER
```

---

## 4. Schéma de base de données — résumé

Modèles Prisma (définis dans `prisma/schema.prisma`) :

| Modèle | Description |
|--------|-------------|
| `User` | Utilisateur (lié à Clerk via `clerkId`) |
| `Subscription` | Abonnement Stripe (FREE/STARTER/PRO/AGENCY/ENTERPRISE) |
| `Agency` | Agence immobilière (AgencePro B2B) |
| `AgencyMember` | Liaison User ↔ Agency |
| `AgencyBuyer` | Acheteurs gérés par l'agence (CRM) |
| `Analysis` | Résultat d'analyse ImmoScore (scores, données DVF/DPE...) |
| `RenovEstimate` | Estimation travaux RenovAI |
| `RenovItem` | Ligne de devis par catégorie (ROOF, ELECTRICAL...) |
| `Deal` | Deal communautaire ImmoDeal |
| `Vote` | Vote chaud/froid sur un deal (unique par user+deal) |
| `Comment` | Commentaire sur un deal (imbriqué 2 niveaux) |
| `CommentLike` | Like sur commentaire |
| `SavedDeal` | Deals sauvegardés |
| `UserAlert` | Critères d'alerte acheteur (ville, budget, type...) |
| `Report` | Rapport PDF généré (white-label agence) |
| `AuditLog` | Journal des actions (RGPD) |

**Relations clés :**
- Un `User` → une `Subscription` (1:1)
- Un `User` → plusieurs `Analysis`, `Deal`, `RenovEstimate`, `UserAlert`
- Une `Agency` → plusieurs `AgencyMember`, `AgencyBuyer`, `Report`
- Un `Deal` → plusieurs `Vote`, `Comment`, `SavedDeal`
- Un `Comment` → plusieurs `Comment` (self-relation, replies)

---

## 5. Variables d'environnement — liste complète

Toutes les variables sont documentées dans `.env.example`. Les groupes principaux :

```
# Base de données
DATABASE_URL          # Supabase PostgreSQL (pooler)
DIRECT_URL            # Supabase PostgreSQL (direct migrations)

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET

# Cache
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# IA
ANTHROPIC_API_KEY     # CÔTÉ SERVEUR UNIQUEMENT — jamais NEXT_PUBLIC_

# Paiement
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER_MONTHLY / PRO_MONTHLY / AGENCY_MONTHLY

# Stockage
CLOUDFLARE_R2_ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / BUCKET_NAME
NEXT_PUBLIC_R2_PUBLIC_URL

# Email
RESEND_API_KEY

# Cartes
NEXT_PUBLIC_MAPBOX_TOKEN

# APIs françaises (gratuites)
DVF_API_URL           # https://api.data.gouv.fr/api/dvf/v1
BAN_API_URL           # https://api-adresse.data.gouv.fr
ADEME_API_URL         # https://data.ademe.fr/data-fair/api/v1/datasets
GEORISQUES_API_KEY    # clé gratuite georisques.gouv.fr
INSEE_API_KEY         # clé gratuite api.insee.fr

# Annonces (payant)
STREAM_ESTATE_API_KEY

# Monitoring
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_POSTHOG_KEY
```

---

## 6. Algorithme de scoring ImmoScore

Fichier : `src/lib/scoring/algorithm.ts`

Score global /100 = somme pondérée de 5 sous-scores :

| Sous-score | Poids | Source données |
|-----------|-------|----------------|
| Prix vs marché | 30% | DVF Etalab (médiane m² à 500m) |
| DPE | 20% | ADEME |
| Risques naturels | 20% | Géorisques |
| Transports | 15% | Mapbox isochrones |
| Quartier | 15% | INSEE + OSM POIs |

**Barème prix :** écart par rapport à la médiane DVF
- < -15% → 100 pts · < -10% → 90 · < -5% → 80 · 0% → 70 · +5% → 60 · +10% → 45 · +20% → 30 · > +20% → 15

**Barème DPE :** A→100, B→85, C→70, D→55, E→40, F→25, G→10

**Marge négociation :** calculée automatiquement (base 3%, +5% si prix > marché, +5% si DPE F/G)

---

## 7. Conventions de code — règles strictes

### TypeScript
- **Tout est typé** — pas de `any` sans justification commentée
- **Named exports** partout sauf les `page.tsx` et `layout.tsx` Next.js
- **"use client"** uniquement si nécessaire — Server Components par défaut
- **Zod** pour toute validation de données entrantes (API Routes, Server Actions)
- **try/catch** obligatoire sur tous les appels API externes

### Nommage
- Composants : `PascalCase.tsx`
- Utilitaires/hooks : `camelCase.ts`
- Constantes : `UPPER_SNAKE_CASE`
- Dossiers : `kebab-case`
- Modèles Prisma : `PascalCase`

### Gestion des erreurs
```typescript
// Pattern obligatoire pour les API Routes
try {
  // logique
} catch (error) {
  console.error("[/api/route] context:", error);
  return NextResponse.json({ error: "Message utilisateur" }, { status: 500 });
}
```

### Sécurité — règles absolues
- `ANTHROPIC_API_KEY` : jamais dans le préfixe `NEXT_PUBLIC_`, jamais côté client
- Rate limiting sur toutes les API Routes qui appellent Claude ou des APIs tierces
- Validation Zod avant tout traitement
- Auth Clerk vérifiée en premier dans chaque route protégée
- Webhooks Stripe et Clerk : vérification signature obligatoire

### Cache Redis — conventions clés
```
dvf:{lat}:{lng}:{radius}:{type}     TTL: 24h
ademe:{address}:{postal}            TTL: 24h
georisques:{lat}:{lng}              TTL: 30j
ban:{address-slug}                  TTL: 24h
analysis:url:{base64url}            TTL: 24h
ratelimit:analyse:{userId}          TTL: 1h
ratelimit:chat:{userId}             TTL: 1h
chat:session:{userId}               TTL: 24h
```

---

## 8. Plans d'abonnement — quotas

| Plan | Prix | Analyses/mois | RenovAI | Fonctionnalités |
|------|------|--------------|---------|-----------------|
| FREE | 0€ | 2 | 0 | Basique |
| STARTER | 9€ | 20 | 3 | PDF, comparateur 2 biens |
| PRO | 29€ | Illimité | 20 | API, alertes, multi-biens |
| AGENCY | 99€ | Illimité | Illimité | White-label, 10 users, dashboard |
| ENTERPRISE | Sur devis | Illimité | Illimité | SSO, SLA, support dédié |

Gestion des quotas dans `src/app/api/analyse/route.ts` via la table `Subscription`.

---

## 9. Agents BMAD — rôles sur ce projet

Ce projet suit la méthode **BMAD (Breakthrough Method for Agile AI-Driven Development)**. Chaque agent a un rôle précis :

### Agent Analyst (Mary) — Recherche & Veille
**Responsabilités sur ImmoPlatform :**
- Analyse des APIs françaises (DVF, ADEME, Géorisques, INSEE, BAN)
- Veille concurrentielle (score-immo.fr, LyBox, ImmoScan, Castorus)
- Recherche réglementaire (DPE G interdit location, carnet numérique logement, MaPrimeRénov)
- Analyse du marché PropTech France 2026

**Quand invoquer :** recherche de nouvelles sources de données, veille réglementaire, analyse concurrentielle

### Agent Product Manager (John) — PRD & Stories
**Responsabilités sur ImmoPlatform :**
- Rédaction et mise à jour du PRD ImmoPlatform
- Création des user stories par module (ImmoScore, RenovAI, AgencePro, ImmoDeal)
- Priorisation backlog (B2B-first)
- Définition des critères d'acceptation par feature

**Artefacts produits :** `docs/prd.md`, `docs/epics/`, `docs/stories/`

### Agent Architect (Winston) — Architecture technique
**Responsabilités sur ImmoPlatform :**
- Décisions architecturales (App Router, Server Components, Prisma, BullMQ)
- Design des API Routes et des schémas de données
- Choix des APIs externes et patterns de cache
- Revue de l'algorithme de scoring

**Artefacts produits :** `docs/architecture.md` (ce fichier est une synthèse)

### Agent Developer (Amelia) — Implémentation
**Responsabilités sur ImmoPlatform :**
- Implémentation des composants React/Next.js
- Écriture des API Routes
- Intégration des APIs externes (DVF, ADEME, Claude...)
- Tests unitaires Jest

**Règles strictes à respecter :**
- Toujours lire `CLAUDE.md` avant d'écrire du code
- Vérifier la structure de fichiers avant de créer de nouveaux fichiers
- Respecter les conventions TypeScript et les patterns de gestion d'erreurs
- Ne jamais exposer `ANTHROPIC_API_KEY` côté client

### Agent UX Designer (Sally) — Interfaces
**Responsabilités sur ImmoPlatform :**
- Design des pages marketing (landing, tarifs, baromètre)
- Composants du dashboard (score cards, radar charts, cartes Mapbox)
- Chatbot widget ImmoScore et AgencePro
- Interface mobile-first (breakpoints Tailwind)

**Palette de couleurs officielle :**
```
Navy:  #0B1C3D  (fond dark, textes titres)
Teal:  #0D9488  (accent primaire, CTAs, scores bons)
Gold:  #F59E0B  (accent chaud, négociation, deals)
White: #FFFFFF
Gray:  Tailwind slate-*
Green: #10B981 (scores > 75)
Amber: #F59E0B (scores 50-74)
Red:   #EF4444 (scores < 50)
```

### Agent Technical Writer (Paige) — Documentation
**Responsabilités sur ImmoPlatform :**
- Documentation API (endpoints, paramètres, exemples)
- Guide d'intégration AgencePro white-label
- Documentation du schéma Prisma
- Mise à jour de ce fichier CLAUDE.md

---

## 10. Workflows BMAD appliqués à ImmoPlatform

### Workflow 1 — Nouvelle feature (standard)
```
1. PM (John)  → Créer user story avec critères d'acceptation
2. Architect  → Valider l'impact architecture (DB, API, cache)
3. UX (Sally) → Maquette composant si UI nouvelle
4. Dev (Amelia) → Implémenter (component + API route + tests)
5. Review     → Vérifier conventions CLAUDE.md respectées
6. QA         → Tests manuels + Playwright si critique
```

### Workflow 2 — Bug fix rapide
```
1. Dev (Amelia) → Reproduire, isoler, corriger
2. Test         → Ajouter test qui couvre le cas
3. Review       → Vérifier pas de régression
```

### Workflow 3 — Intégration nouvelle API externe
```
1. Analyst (Mary) → Documenter l'API (auth, rate limits, format)
2. Architect      → Décider le pattern de cache Redis
3. Dev (Amelia)   → Créer le client dans src/lib/api-clients/
4. Dev (Amelia)   → Tester avec données réelles
5. Writer (Paige) → Documenter dans .env.example + README
```

---

## 11. Priorités de développement — état actuel

### MVP Phase 1 (en cours)
- [ ] Page d'accueil marketing avec chatbot intégré
- [ ] Module ImmoScore — saisie URL + pipeline analyse
- [ ] Affichage rapport de score (composants)
- [ ] Module RenovAI V1 — upload photo + Vision API
- [ ] Auth Clerk complète (sign-in/sign-up/webhook)
- [ ] Webhook Stripe + abonnements
- [ ] Dashboard utilisateur (liste analyses)

### Phase 2 (post-MVP)
- [ ] AgencePro dashboard complet
- [ ] Module ImmoDeal (deals + votes + commentaires)
- [ ] Système d'alertes (BullMQ + Resend)
- [ ] Baromètre marché (carte Mapbox + DVF)
- [ ] Génération PDF branded

### Phase 3 (post-seed)
- [ ] API publique B2B (scoring pour courtiers/banques)
- [ ] White-label agences complet
- [ ] Comparateur multi-biens
- [ ] App mobile React Native

---

## 12. Points d'attention critiques

### Légal
- **Stream Estate est la SEULE option légale** pour parser les annonces SeLoger/Leboncoin/PAP
- Le scraping direct de ces portails est interdit (CGU + jurisprudence)
- Les données DVF, ADEME, Géorisques, BAN, INSEE sont des données publiques librement réutilisables (licence Etalab)

### Performance
- Le pipeline d'analyse fait 5–7 appels API parallèles (`Promise.allSettled`)
- Objectif : < 5s de temps de traitement total
- Cache Redis obligatoire sur toutes les données stables (DVF, DPE, risques)
- Les analyses sont stockées en BDD pour éviter de recalculer la même URL

### Sécurité RGPD
- Données hébergées en Europe (Vercel EU, Supabase EU)
- `AuditLog` pour tracer les actions sensibles
- Bandeau cookies Axeptio obligatoire au lancement
- `User` supprimé → cascade sur toutes ses données (Prisma `onDelete: Cascade`)

### Coûts API
- Claude API : ~0,003$/1000 tokens input, ~0,015$/1000 tokens output
- Limiter les appels Claude à ce qui est strictement nécessaire
- Ne pas appeler Claude pour des résumés si le score global < 30 (bien risqué, résumé standard)
- Mapbox : surveiller les quotas mensuels (50 000 requêtes gratuites)

---

## 13. Commandes de développement

```bash
# Installation initiale
npm install
cp .env.example .env.local    # Remplir les vraies valeurs

# Base de données
npm run db:generate            # Générer le client Prisma
npm run db:push                # Pousser le schéma (dev)
npm run db:migrate             # Créer une migration (prod)
npm run db:seed                # Données de démonstration
npm run db:studio              # Interface visuelle Prisma

# Développement
npm run dev                    # Serveur Next.js localhost:3000
npm run workers                # BullMQ workers (terminal séparé)
npm run worker:analyse         # Worker analyse seulement
npm run worker:alert           # Worker alertes seulement

# Qualité
npm run lint                   # ESLint
npm run typecheck              # TypeScript sans emit
npm test                       # Jest tests unitaires
npm run test:e2e               # Playwright tests E2E

# Build
npm run build                  # Build production
npm start                      # Serveur production local
```

---

## 14. Instructions pour Claude — comment m'aider

### Quand tu génères du code pour ImmoPlatform :

1. **Lis ce fichier en entier avant de commencer**
2. **Respecte la structure de fichiers** — ne crée pas de nouveaux dossiers sans raison
3. **Utilise les types Prisma** — importe depuis `@prisma/client` ou `@/types`
4. **Respecte les patterns d'auth** : `const { userId } = await auth()` en premier
5. **Cache Redis** : utilise `getCached` / `setCached` de `@/lib/db/redis`
6. **Validation** : Zod en premier, avant toute logique métier
7. **Erreurs** : log avec contexte `[/api/route]`, retourne un message utilisateur clair
8. **Nommage** : respecte strictement les conventions section 7

### Ce que tu dois toujours vérifier :
- La clé `ANTHROPIC_API_KEY` n'apparaît jamais dans du code côté client
- Les webhooks Stripe et Clerk vérifient la signature avant de traiter
- Tout appel externe est wrappé dans un try/catch
- Les API Routes protégées appellent `auth()` en tout premier

### Format de réponse préféré :
- Code TypeScript complet avec imports
- Commentaires sur les décisions non-évidentes (pas sur le code trivial)
- Si plusieurs fichiers sont modifiés, les lister clairement
- Signaler explicitement si une décision dévie de l'architecture définie ici

---

*CLAUDE.md — Version 1.0 · Astra Wave · ImmoPlatform · Juin 2026*
*Mettre à jour ce fichier à chaque décision architecturale majeure.*
