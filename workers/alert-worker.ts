import { Worker, Queue } from "bullmq";
import { QUEUE_NAMES, createQueueConnection, type AlertJobData } from "../src/lib/queue";
import { prisma } from "../src/lib/db/prisma";
import { sendAlertEmail } from "../src/lib/email/alert";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Traite une alerte : cherche les deals créés depuis le dernier envoi qui matchent
// les critères, envoie l'email Resend, met à jour lastSentAt.
async function processAlert(alertId: string): Promise<void> {
  const alert = await prisma.userAlert.findUnique({
    where: { id: alertId },
    include: { user: { select: { email: true } } },
  });
  if (!alert || !alert.active) return;

  const since = alert.lastSentAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const deals = await prisma.deal.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gt: since },
      city: { equals: alert.city, mode: "insensitive" },
      ...(alert.postalCodes.length > 0 ? { postalCode: { in: alert.postalCodes } } : {}),
      ...(alert.budgetMin ? { price: { gte: alert.budgetMin } } : {}),
      ...(alert.budgetMax ? { price: { lte: alert.budgetMax } } : {}),
      ...(alert.surfaceMin ? { surface: { gte: alert.surfaceMin } } : {}),
      ...(alert.propertyType ? { propertyType: alert.propertyType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (deals.length === 0) return;

  const sent = await sendAlertEmail(
    alert.user.email,
    alert.name,
    deals.map((d) => ({
      title: d.title,
      price: d.price,
      city: d.city,
      url: `${APP_URL}/immodeal/${d.id}`,
    }))
  );

  if (sent) {
    await prisma.userAlert.update({
      where: { id: alert.id },
      data: { lastSentAt: new Date() },
    });
    console.log(`[alert-worker] alerte ${alert.id} — ${deals.length} deals envoyés`);
  }
}

// Planifie le scan périodique des alertes (toutes les heures) : chaque alerte due
// selon sa fréquence est mise en queue individuellement.
async function scheduleScan(queue: Queue): Promise<void> {
  await queue.upsertJobScheduler("alert-scan", { pattern: "0 * * * *" }, { name: "scan" });
}

async function scanDueAlerts(queue: Queue<AlertJobData>): Promise<void> {
  const now = Date.now();
  const alerts = await prisma.userAlert.findMany({ where: { active: true } });
  const DUE_MS = { INSTANT: 0, DAILY: 24 * 3600_000, WEEKLY: 7 * 24 * 3600_000 } as const;

  for (const alert of alerts) {
    const last = alert.lastSentAt?.getTime() ?? 0;
    if (now - last >= DUE_MS[alert.frequency]) {
      await queue.add("alert", { alertId: alert.id });
    }
  }
}

export function startAlertWorker(): Worker {
  const queue = new Queue<AlertJobData>(QUEUE_NAMES.ALERT, {
    connection: createQueueConnection(),
  });

  const worker = new Worker(
    QUEUE_NAMES.ALERT,
    async (job) => {
      if (job.name === "scan") {
        await scanDueAlerts(queue);
      } else {
        await processAlert((job.data as AlertJobData).alertId);
      }
    },
    { connection: createQueueConnection(), concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[alert-worker] job ${job?.id} échoué :`, err.message);
  });

  scheduleScan(queue).catch((err) =>
    console.error("[alert-worker] planification impossible :", err)
  );

  console.log("[alert-worker] démarré (scan horaire des alertes)");
  return worker;
}

if (require.main === module) {
  startAlertWorker();
}
