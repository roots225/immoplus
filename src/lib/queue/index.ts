import { Queue } from "bullmq";
import Redis from "ioredis";

// Connexion BullMQ dédiée — maxRetriesPerRequest: null est requis par BullMQ
export function createQueueConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

export const QUEUE_NAMES = {
  ANALYSE: "analyse",
  ALERT: "alert",
} as const;

export interface AnalyseJobData {
  analysisId: string;
  sourceUrl: string;
  userId: string;
}

export interface AlertJobData {
  alertId: string;
}

// Initialisation paresseuse : BullMQ ouvre la connexion Redis dès la création
// de la Queue, ce qui polluerait le build Next.js (collecte des pages).
const globalForQueues = globalThis as unknown as {
  analyseQueue?: Queue<AnalyseJobData>;
  alertQueue?: Queue<AlertJobData>;
};

export function getAnalyseQueue(): Queue<AnalyseJobData> {
  if (!globalForQueues.analyseQueue) {
    globalForQueues.analyseQueue = new Queue(QUEUE_NAMES.ANALYSE, {
      connection: createQueueConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return globalForQueues.analyseQueue;
}

export function getAlertQueue(): Queue<AlertJobData> {
  if (!globalForQueues.alertQueue) {
    globalForQueues.alertQueue = new Queue(QUEUE_NAMES.ALERT, {
      connection: createQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return globalForQueues.alertQueue;
}
