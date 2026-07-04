# ============================================================
# ImmoPlatform — Image Next.js (frontend + API Routes)
# Runtime Bun : install (bun install), build (bun run build)
# et serveur standalone (bun server.js)
# ============================================================

FROM oven/bun:1-alpine AS base
# openssl requis par les moteurs Prisma (linux-musl)
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Étape 1 : dépendances ----
FROM base AS deps
# bun install migre automatiquement package-lock.json vers son propre lockfile
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma
RUN bun install

# ---- Étape 2 : build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Le client Prisma doit être généré avant le build Next.js
# (bun bloque les scripts postinstall non approuvés — on le lance explicitement)
RUN bunx prisma generate
# Les variables NEXT_PUBLIC_* sont inlinées dans le bundle client AU BUILD.
# Passer la vraie clé Clerk en build arg pour une image utilisable en prod ;
# à défaut, une clé placeholder (format valide) permet au build d'aboutir.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_Y2xlcmsuZXhhbXBsZS5jb20k}
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- Étape 3 : runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma : schéma + moteur nécessaires aux migrations et au client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["bun", "server.js"]
