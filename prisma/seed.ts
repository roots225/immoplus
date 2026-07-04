import { PrismaClient, Plan, PropertyType, VoteType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed ImmoPlatform — données de démonstration");

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@astrawave.fr" },
    update: {},
    create: {
      clerkId: "user_demo_seed",
      email: "demo@astrawave.fr",
      firstName: "Demo",
      lastName: "Astra",
      subscription: {
        create: { plan: Plan.PRO },
      },
    },
  });

  const agencyUser = await prisma.user.upsert({
    where: { email: "agence@astrawave.fr" },
    update: {},
    create: {
      clerkId: "user_agency_seed",
      email: "agence@astrawave.fr",
      firstName: "Marie",
      lastName: "Dupont",
      subscription: {
        create: { plan: Plan.AGENCY },
      },
    },
  });

  const agency = await prisma.agency.create({
    data: {
      name: "Agence Horizon Immobilier",
      brandColor: "#0D9488",
      website: "https://horizon-immo.example.fr",
      members: {
        create: { userId: agencyUser.id, role: "OWNER" },
      },
      buyers: {
        create: [
          {
            firstName: "Paul",
            lastName: "Martin",
            email: "paul.martin@example.fr",
            status: "ACTIVE",
            budgetMin: 200_000,
            budgetMax: 320_000,
            cities: ["Nantes", "Rezé"],
            propertyType: PropertyType.APARTMENT,
          },
          {
            firstName: "Sophie",
            lastName: "Bernard",
            email: "sophie.bernard@example.fr",
            status: "PROSPECT",
            budgetMin: 350_000,
            budgetMax: 500_000,
            cities: ["Bordeaux"],
            propertyType: PropertyType.HOUSE,
          },
        ],
      },
    },
  });

  const analysis = await prisma.analysis.create({
    data: {
      userId: demoUser.id,
      status: "COMPLETED",
      sourceUrl: "https://www.example-annonce.fr/appartement-nantes-t3",
      title: "Appartement T3 65m² — Nantes centre",
      price: 289_000,
      surface: 65,
      rooms: 3,
      propertyType: PropertyType.APARTMENT,
      address: "12 rue de Strasbourg",
      city: "Nantes",
      postalCode: "44000",
      latitude: 47.2172,
      longitude: -1.5534,
      scoreGlobal: 78,
      scorePrice: 80,
      scoreDpe: 70,
      scoreRisks: 85,
      scoreTransport: 75,
      scoreDistrict: 72,
      pricePerSqm: 4446,
      marketMedianSqm: 4680,
      priceGapPercent: -5,
      negotiationMargin: 3,
      aiSummary:
        "Bien correctement positionné, 5% sous la médiane du quartier. DPE C correct, aucun risque naturel majeur, très bonne desserte tramway.",
    },
  });

  const deal = await prisma.deal.create({
    data: {
      userId: demoUser.id,
      title: "T2 45m² sous le marché — Rennes Sainte-Thérèse",
      description:
        "Vendeur pressé (mutation). Prix affiché 12% sous la médiane DVF du secteur. Travaux de rafraîchissement uniquement.",
      price: 178_000,
      surface: 45,
      city: "Rennes",
      postalCode: "35000",
      propertyType: PropertyType.APARTMENT,
      hotScore: 1,
      votes: {
        create: { userId: agencyUser.id, type: VoteType.HOT },
      },
      comments: {
        create: {
          userId: agencyUser.id,
          content: "Secteur très demandé, bonne trouvaille. Vérifier les charges de copro.",
        },
      },
    },
  });

  await prisma.userAlert.create({
    data: {
      userId: demoUser.id,
      name: "T3 Nantes < 300k",
      city: "Nantes",
      postalCodes: ["44000", "44100"],
      budgetMax: 300_000,
      propertyType: PropertyType.APARTMENT,
      frequency: "DAILY",
    },
  });

  console.log("✅ Seed terminé :", {
    users: 2,
    agency: agency.name,
    analysis: analysis.id,
    deal: deal.id,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
