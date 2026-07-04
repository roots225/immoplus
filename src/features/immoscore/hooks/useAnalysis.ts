"use client";

import { useCallback, useRef, useState } from "react";

export interface AnalysisResult {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  title: string | null;
  price: number | null;
  surface: number | null;
  city: string | null;
  postalCode: string | null;
  scoreGlobal: number | null;
  scorePrice: number | null;
  scoreDpe: number | null;
  scoreRisks: number | null;
  scoreTransport: number | null;
  scoreDistrict: number | null;
  pricePerSqm: number | null;
  marketMedianSqm: number | null;
  priceGapPercent: number | null;
  negotiationMargin: number | null;
  aiSummary: string | null;
  errorMessage: string | null;
}

type Status = "idle" | "loading" | "done" | "error";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 40; // ~100 s

// Lance POST /api/analyse puis poll le statut jusqu'à complétion
export function useAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);

  const poll = useCallback(async (id: string) => {
    pollCount.current += 1;
    if (pollCount.current > MAX_POLLS) {
      setStatus("error");
      setError("L'analyse prend plus de temps que prévu — retrouvez-la dans votre tableau de bord.");
      return;
    }
    try {
      const res = await fetch(`/api/analyse?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      const a: AnalysisResult = data.analysis;
      if (a.status === "COMPLETED") {
        setAnalysis(a);
        setStatus("done");
      } else if (a.status === "FAILED") {
        setStatus("error");
        setError(a.errorMessage ?? "L'analyse a échoué");
      } else {
        setTimeout(() => poll(id), POLL_INTERVAL_MS);
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }, []);

  const start = useCallback(
    async (url: string) => {
      setStatus("loading");
      setError(null);
      setAnalysis(null);
      pollCount.current = 0;
      try {
        const res = await fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        if (data.cached && data.analysis.status === "COMPLETED") {
          setAnalysis(data.analysis);
          setStatus("done");
          return;
        }
        poll(data.analysis.id);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Erreur inattendue");
      }
    },
    [poll]
  );

  return { analysis, status, error, start };
}
