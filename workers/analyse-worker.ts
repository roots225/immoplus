import { Worker } from "bullmq";
import { QUEUE_NAMES, createQueueConnection, type AnalyseJobData } from "../src/lib/queue";
import { runAnalysisPipeline } from "../src/lib/scoring/pipeline";

// Worker analyse — consomme la queue "analyse" et exécute le pipeline ImmoScore
export function startAnalyseWorker(): Worker<AnalyseJobData> {
  const worker = new Worker<AnalyseJobData>(
    QUEUE_NAMES.ANALYSE,
    async (job) => {
      console.log(`[analyse-worker] job ${job.id} — analyse ${job.data.analysisId}`);
      await runAnalysisPipeline(job.data.analysisId);
    },
    {
      connection: createQueueConnection(),
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[analyse-worker] job ${job.id} terminé`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[analyse-worker] job ${job?.id} échoué :`, err.message);
  });

  console.log("[analyse-worker] démarré (concurrency 3)");
  return worker;
}

// Lancement direct : npm run worker:analyse
if (require.main === module) {
  startAnalyseWorker();
}
