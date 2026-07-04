import { Card, CardTitle } from "@/components/ui/Card";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import { getScoreLabel, getScoreTextClass } from "@/types";
import type { AnalysisResult } from "@/features/immoscore/hooks/useAnalysis";

const SUB_SCORES: Array<{ key: keyof AnalysisResult; label: string; weight: string }> = [
  { key: "scorePrice", label: "Prix vs marché", weight: "30%" },
  { key: "scoreDpe", label: "DPE", weight: "20%" },
  { key: "scoreRisks", label: "Risques naturels", weight: "20%" },
  { key: "scoreTransport", label: "Transports", weight: "15%" },
  { key: "scoreDistrict", label: "Quartier", weight: "15%" },
];

function barColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreCard({ analysis }: { analysis: AnalysisResult }) {
  const score = analysis.scoreGlobal ?? 0;

  return (
    <Card className="animate-score-pop">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>{analysis.title ?? "Analyse"}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {analysis.city} ({analysis.postalCode}) ·{" "}
            {analysis.price ? formatPrice(analysis.price) : "—"}
            {analysis.surface ? ` · ${analysis.surface} m²` : ""}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-4xl font-bold ${getScoreTextClass(score)}`}>{score}</p>
          <p className="text-xs font-medium text-slate-500">/100 · {getScoreLabel(score)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {SUB_SCORES.map(({ key, label, weight }) => {
          const value = analysis[key] as number | null;
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-navy">
                  {label} <span className="text-slate-400">({weight})</span>
                </span>
                <span className="text-slate-500">{value ?? "—"}/100</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                {value !== null && (
                  <div
                    className={`h-2 rounded-full ${barColor(value)}`}
                    style={{ width: `${value}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Prix affiché</p>
          <p className="font-semibold text-navy">
            {analysis.pricePerSqm ? `${formatPrice(Math.round(analysis.pricePerSqm))}/m²` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Médiane du secteur (DVF)</p>
          <p className="font-semibold text-navy">
            {analysis.marketMedianSqm
              ? `${formatPrice(Math.round(analysis.marketMedianSqm))}/m²`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Marge de négociation</p>
          <p className="font-semibold text-gold">
            {analysis.negotiationMargin !== null ? `~${analysis.negotiationMargin} %` : "—"}
            {analysis.priceGapPercent !== null &&
              ` (écart marché ${formatPercent(analysis.priceGapPercent)})`}
          </p>
        </div>
      </div>

      {analysis.aiSummary && (
        <p className="mt-4 rounded-lg border-l-4 border-teal bg-teal/5 p-4 text-sm text-slate-700">
          {analysis.aiSummary}
        </p>
      )}
    </Card>
  );
}
