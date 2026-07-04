import Anthropic from "@anthropic-ai/sdk";

// Client Anthropic — CÔTÉ SERVEUR UNIQUEMENT.
// ANTHROPIC_API_KEY ne doit jamais apparaître dans du code client ni en NEXT_PUBLIC_.
// Initialisation paresseuse : le constructeur rejette une clé absente/vide,
// ce qui casserait le démarrage des workers et des routes sans la variable.
const globalForClaude = globalThis as unknown as { anthropic?: Anthropic };

export function getAnthropic(): Anthropic {
  if (!globalForClaude.anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY manquante");
    }
    globalForClaude.anthropic = new Anthropic({ apiKey });
  }
  return globalForClaude.anthropic;
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";

// ------------------------------------------------------------
// Résumé d'analyse ImmoScore
// Coût maîtrisé : pas d'appel Claude si score < 30 (CLAUDE.md §12)
// ------------------------------------------------------------

export async function generateAnalysisSummary(input: {
  scoreGlobal: number;
  title: string;
  price: number;
  city: string;
  priceGapPercent: number | null;
  dpeGrade: string | null;
  riskCount: number;
}): Promise<string> {
  if (input.scoreGlobal < 30) {
    return "Ce bien présente un score très faible : prix nettement au-dessus du marché et/ou diagnostics défavorables. Nous recommandons la plus grande prudence avant toute visite.";
  }

  try {
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system:
        "Tu es un expert immobilier français. Rédige un résumé factuel et concis (4 phrases max) d'une analyse de bien, en français, pour un acheteur particulier. Pas de conseil juridique.",
      messages: [
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  } catch (error) {
    console.error("[api-clients/claude] generateAnalysisSummary failed:", error);
    return "";
  }
}

// ------------------------------------------------------------
// Estimation travaux RenovAI (Claude Vision)
// ------------------------------------------------------------

export interface RenovVisionItem {
  category: string;
  label: string;
  costMin: number;
  costMax: number;
  priority: number;
}

export interface RenovVisionResult {
  items: RenovVisionItem[];
  totalMin: number;
  totalMax: number;
  notes: string;
}

export async function analyzeRenovationPhotos(
  photoUrls: string[],
  surface?: number
): Promise<RenovVisionResult | null> {
  try {
    // Récupère les images côté serveur pour les passer en base64 à Vision
    const images = await Promise.all(
      photoUrls.slice(0, 5).map(async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Photo fetch HTTP ${res.status}`);
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const buffer = Buffer.from(await res.arrayBuffer());
        return { contentType, base64: buffer.toString("base64") };
      })
    );

    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: `Tu es un expert en estimation de travaux de rénovation en France (prix 2026).
Analyse les photos et retourne UNIQUEMENT un JSON valide de la forme :
{"items":[{"category":"ROOF|ELECTRICAL|PLUMBING|HEATING|INSULATION|WINDOWS|KITCHEN|BATHROOM|FLOORING|PAINTING|FACADE|OTHER","label":"...","costMin":0,"costMax":0,"priority":1}],"totalMin":0,"totalMax":0,"notes":"..."}
Les coûts sont en euros TTC, priority de 1 (urgent) à 5 (confort).`,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.contentType as "image/jpeg" | "image/png" | "image/webp",
                data: img.base64,
              },
            })),
            {
              type: "text" as const,
              text: `Estime les travaux visibles sur ces photos.${surface ? ` Surface du bien : ${surface} m².` : ""}`,
            },
          ],
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") return null;
    const jsonMatch = block.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as RenovVisionResult;
  } catch (error) {
    console.error("[api-clients/claude] analyzeRenovationPhotos failed:", error);
    return null;
  }
}
