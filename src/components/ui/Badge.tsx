import type { HTMLAttributes } from "react";

type Tone = "teal" | "gold" | "green" | "amber" | "red" | "slate" | "ink";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  teal: "bg-primary-soft text-primary-dark",
  gold: "bg-gold/10 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  // Pilule sombre de la charte (façon horaire de match)
  ink: "bg-pill text-white",
};

export function Badge({ tone = "slate", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}

// Badge de score (vert ≥75, ambre 50–74, rouge <50)
export function ScoreBadge({ score }: { score: number }) {
  const tone: Tone = score >= 75 ? "green" : score >= 50 ? "amber" : "red";
  return <Badge tone={tone}>{score}/100</Badge>;
}
