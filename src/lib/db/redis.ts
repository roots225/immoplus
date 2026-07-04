import Redis from "ioredis";

// Client Redis unique — Upstash (rediss://) en prod, service redis en Docker local.
// maxRetriesPerRequest: null requis par BullMQ qui partage cette connexion de base.
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ------------------------------------------------------------
// Helpers cache — conventions de clés et TTL définis dans CLAUDE.md §7
// ------------------------------------------------------------

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    // Le cache ne doit jamais faire échouer la requête
    console.error("[redis] getCached failed:", key, error);
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error("[redis] setCached failed:", key, error);
  }
}

export const TTL = {
  DAY: 60 * 60 * 24,
  MONTH: 60 * 60 * 24 * 30,
  HOUR: 60 * 60,
} as const;

// ------------------------------------------------------------
// Rate limiting — fenêtre fixe (ratelimit:{scope}:{userId}, TTL 1h)
// ------------------------------------------------------------

export async function checkRateLimit(
  scope: "analyse" | "chat" | "renovai" | "upload",
  userId: string,
  maxPerHour: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${scope}:${userId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, TTL.HOUR);
    }
    return { allowed: count <= maxPerHour, remaining: Math.max(0, maxPerHour - count) };
  } catch (error) {
    console.error("[redis] checkRateLimit failed:", key, error);
    // En cas de panne Redis, on laisse passer plutôt que de bloquer le produit
    return { allowed: true, remaining: maxPerHour };
  }
}
