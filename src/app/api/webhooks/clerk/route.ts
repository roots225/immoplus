import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db/prisma";

interface ClerkUserPayload {
  id: string;
  email_addresses: Array<{ id: string; email_address: string }>;
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

// POST /api/webhooks/clerk — sync users Clerk → PostgreSQL
// Vérification de signature Svix OBLIGATOIRE avant tout traitement.
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[/api/webhooks/clerk] CLERK_WEBHOOK_SECRET manquant");
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
    }

    const payload = await req.text();
    const headers = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    };

    let event: { type: string; data: ClerkUserPayload };
    try {
      event = new Webhook(secret).verify(payload, headers) as {
        type: string;
        data: ClerkUserPayload;
      };
    } catch {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const { type, data } = event;

    if (type === "user.created" || type === "user.updated") {
      const primaryEmail =
        data.email_addresses.find((e) => e.id === data.primary_email_address_id)
          ?.email_address ?? data.email_addresses[0]?.email_address;
      if (!primaryEmail) {
        return NextResponse.json({ error: "Email manquant" }, { status: 400 });
      }

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: {
          email: primaryEmail,
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
        },
        create: {
          clerkId: data.id,
          email: primaryEmail,
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
          subscription: { create: { plan: "FREE" } },
        },
      });
    }

    if (type === "user.deleted") {
      // RGPD : cascade Prisma supprime analyses, deals, votes, alertes…
      await prisma.user.deleteMany({ where: { clerkId: data.id } });
      await prisma.auditLog.create({
        data: { action: "user.delete", entity: "User", metadata: { clerkId: data.id } },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[/api/webhooks/clerk] POST:", error);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
