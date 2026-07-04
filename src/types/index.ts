// Types globaux + helpers partagés client/serveur

export type ScoreLabel = "Excellent" | "Bon" | "Moyen" | "Risqué";

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 50) return "Moyen";
  return "Risqué";
}

// Couleurs officielles (palette CLAUDE.md §9) selon le score
export function getScoreColor(score: number): string {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function getScoreTextClass(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  LAND: "Terrain",
  COMMERCIAL: "Local commercial",
  OTHER: "Autre",
};

export const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  PRO: "Pro",
  AGENCY: "Agence",
  ENTERPRISE: "Enterprise",
};

export const RENOV_CATEGORY_LABELS: Record<string, string> = {
  ROOF: "Toiture",
  ELECTRICAL: "Électricité",
  PLUMBING: "Plomberie",
  HEATING: "Chauffage",
  INSULATION: "Isolation",
  WINDOWS: "Menuiseries",
  KITCHEN: "Cuisine",
  BATHROOM: "Salle de bain",
  FLOORING: "Sols",
  PAINTING: "Peinture",
  FACADE: "Façade",
  OTHER: "Autre",
};
