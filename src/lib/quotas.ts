import type { Plan, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

// Quotas par plan — CLAUDE.md §8 (-1 = illimité)
export const PLAN_QUOTAS: Record<Plan, { analyses: number; renov: number }> = {
  FREE: { analyses: 2, renov: 0 },
  STARTER: { analyses: 20, renov: 3 },
  PRO: { analyses: -1, renov: 20 },
  AGENCY: { analyses: -1, renov: -1 },
  ENTERPRISE: { analyses: -1, renov: -1 },
};

export async function getOrCreateSubscription(userId: string): Promise<Subscription> {
  return prisma.subscription.upsert({
    where: { userId },
    update: {},
    create: { userId, plan: "FREE" },
  });
}

// Remet les compteurs à zéro si la période mensuelle est écoulée
async function resetIfNewPeriod(sub: Subscription): Promise<Subscription> {
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - sub.quotaResetAt.getTime() < monthMs) return sub;
  return prisma.subscription.update({
    where: { id: sub.id },
    data: { analysesUsed: 0, renovUsed: 0, quotaResetAt: new Date() },
  });
}

export async function checkAndConsumeQuota(
  userId: string,
  kind: "analyses" | "renov"
): Promise<{ allowed: boolean; plan: Plan; used: number; limit: number }> {
  let sub = await getOrCreateSubscription(userId);
  sub = await resetIfNewPeriod(sub);

  const limit = PLAN_QUOTAS[sub.plan][kind];
  const used = kind === "analyses" ? sub.analysesUsed : sub.renovUsed;

  if (limit !== -1 && used >= limit) {
    return { allowed: false, plan: sub.plan, used, limit };
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: kind === "analyses" ? { analysesUsed: { increment: 1 } } : { renovUsed: { increment: 1 } },
  });

  return { allowed: true, plan: sub.plan, used: used + 1, limit };
}
