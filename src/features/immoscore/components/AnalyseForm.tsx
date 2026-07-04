"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAnalysis } from "@/features/immoscore/hooks/useAnalysis";
import { ScoreCard } from "@/features/immoscore/components/ScoreCard";

// Saisie URL + suivi du pipeline (polling GET /api/analyse?id= jusqu'à COMPLETED/FAILED)
export function AnalyseForm() {
  const [url, setUrl] = useState("");
  const { analysis, status, error, start } = useAnalysis();

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) start(url.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.seloger.com/annonces/…"
          required
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal focus:outline-none"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Analyse en cours…" : "Analyser"}
        </Button>
      </form>

      {status === "loading" && (
        <p className="rounded-lg bg-teal/10 p-4 text-sm text-teal-dark">
          Analyse en cours : parsing de l'annonce, croisement DVF / DPE / risques /
          transports… (moins de 30 secondes)
        </p>
      )}

      {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {status === "done" && analysis && <ScoreCard analysis={analysis} />}
    </div>
  );
}
