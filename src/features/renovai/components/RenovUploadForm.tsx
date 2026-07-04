"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils/format";
import { RENOV_CATEGORY_LABELS } from "@/types";

interface RenovItem {
  id: string;
  category: string;
  label: string;
  costMin: number;
  costMax: number;
  priority: number;
}

interface RenovEstimateResult {
  id: string;
  totalMin: number | null;
  totalMax: number | null;
  aiNotes: string | null;
  items: RenovItem[];
}

export function RenovUploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [surface, setSurface] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<RenovEstimateResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setEstimate(null);
    try {
      // 1. Upload des photos vers R2
      const photoUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload impossible");
        photoUrls.push(data.url);
      }

      // 2. Analyse Vision
      const res = await fetch("/api/renovai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls,
          surface: surface ? Number(surface) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Estimation impossible");
      setEstimate(data.estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-dark"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            placeholder="Surface en m² (optionnel)"
            className="w-56 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal focus:outline-none"
          />
          <Button type="submit" disabled={loading || files.length === 0}>
            {loading ? "Analyse en cours…" : `Estimer (${files.length} photo${files.length > 1 ? "s" : ""})`}
          </Button>
        </div>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {estimate && (
        <Card className="animate-score-pop">
          <CardTitle>Estimation travaux</CardTitle>
          <p className="mt-2 text-2xl font-bold text-gold">
            {estimate.totalMin !== null && estimate.totalMax !== null
              ? `${formatPrice(estimate.totalMin)} — ${formatPrice(estimate.totalMax)}`
              : "—"}
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {estimate.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-navy">
                    {RENOV_CATEGORY_LABELS[item.category] ?? item.category}
                    {item.priority <= 2 && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        Urgent
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
                <p className="shrink-0 font-semibold text-navy">
                  {formatPrice(item.costMin)} — {formatPrice(item.costMax)}
                </p>
              </li>
            ))}
          </ul>
          {estimate.aiNotes && (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              {estimate.aiNotes}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
