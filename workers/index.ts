// Point d'entrée unique des workers BullMQ — utilisé par Docker et `npm run workers`
import { startAnalyseWorker } from "./analyse-worker";
import { startAlertWorker } from "./alert-worker";

const workers = [startAnalyseWorker(), startAlertWorker()];

async function shutdown(signal: string) {
  console.log(`[workers] ${signal} reçu — arrêt propre…`);
  await Promise.allSettled(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("[workers] tous les workers sont démarrés");
