import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PdfReportSchema } from "@/lib/validators";
import { uploadToR2 } from "@/lib/storage/r2";
import { formatPrice } from "@/lib/utils/format";
import { getScoreLabel } from "@/types";

const NAVY = rgb(0.043, 0.11, 0.24);
const TEAL = rgb(0.051, 0.58, 0.533);

// POST /api/pdf — génère le rapport PDF d'une analyse (white-label pour plan AGENCY)
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PdfReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!subscription || subscription.plan === "FREE") {
      return NextResponse.json(
        { error: "La génération PDF est réservée aux plans payants" },
        { status: 402 }
      );
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id: parsed.data.analysisId, userId: user.id, status: "COMPLETED" },
    });
    if (!analysis) {
      return NextResponse.json({ error: "Analyse introuvable ou incomplète" }, { status: 404 });
    }

    // White-label uniquement pour les plans AGENCY/ENTERPRISE avec agence
    const membership =
      parsed.data.whiteLabel && ["AGENCY", "ENTERPRISE"].includes(subscription.plan)
        ? await prisma.agencyMember.findFirst({
            where: { userId: user.id },
            include: { agency: true },
          })
        : null;

    // Génération du PDF (une page synthèse)
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const brand = membership?.agency.name ?? "ImmoPlatform · Astra Wave";
    page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: NAVY });
    page.drawText(brand, { x: 40, y: 805, size: 18, font: fontBold, color: rgb(1, 1, 1) });

    let y = 730;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: 40, y, size: 11, font: fontBold, color: NAVY });
      page.drawText(value, { x: 220, y, size: 11, font, color: NAVY });
      y -= 22;
    };

    page.drawText("Rapport d'analyse ImmoScore", {
      x: 40, y, size: 16, font: fontBold, color: TEAL,
    });
    y -= 36;

    line("Bien analysé", analysis.title ?? analysis.sourceUrl.slice(0, 70));
    line("Localisation", `${analysis.city ?? "—"} (${analysis.postalCode ?? "—"})`);
    line("Prix affiché", analysis.price ? formatPrice(analysis.price) : "—");
    line(
      "Score global",
      analysis.scoreGlobal !== null
        ? `${analysis.scoreGlobal}/100 — ${getScoreLabel(analysis.scoreGlobal)}`
        : "—"
    );
    line("Prix vs marché", `${analysis.scorePrice ?? "—"}/100`);
    line("DPE", `${analysis.scoreDpe ?? "—"}/100`);
    line("Risques naturels", `${analysis.scoreRisks ?? "—"}/100`);
    line("Transports", `${analysis.scoreTransport ?? "—"}/100`);
    line("Quartier", `${analysis.scoreDistrict ?? "—"}/100`);
    line(
      "Marge de négociation",
      analysis.negotiationMargin !== null ? `${analysis.negotiationMargin} %` : "—"
    );

    if (analysis.aiSummary) {
      y -= 10;
      page.drawText("Synthèse", { x: 40, y, size: 12, font: fontBold, color: TEAL });
      y -= 20;
      // Découpe naïve du résumé en lignes de ~90 caractères
      const words = analysis.aiSummary.split(" ");
      let current = "";
      for (const word of words) {
        if ((current + " " + word).length > 90) {
          page.drawText(current, { x: 40, y, size: 10, font, color: NAVY });
          y -= 16;
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      if (current) page.drawText(current, { x: 40, y, size: 10, font, color: NAVY });
    }

    const pdfBytes = await doc.save();
    const key = `reports/${user.id}/${analysis.id}-${Date.now()}.pdf`;
    const url = await uploadToR2(key, Buffer.from(pdfBytes), "application/pdf");

    const report = await prisma.report.create({
      data: {
        analysisId: analysis.id,
        agencyId: membership?.agencyId,
        pdfUrl: url,
        whiteLabel: Boolean(membership),
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[/api/pdf] POST:", error);
    return NextResponse.json({ error: "Génération PDF impossible" }, { status: 500 });
  }
}
