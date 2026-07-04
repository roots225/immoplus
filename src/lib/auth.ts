import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

// Résout l'utilisateur BDD depuis la session Clerk.
// Retourne null si non authentifié — chaque route décide du 401.
//
// Provisionnement paresseux : en prod le webhook Clerk crée la ligne User,
// mais en local/Docker les serveurs Clerk ne joignent pas l'app. Si la
// session existe sans ligne BDD, on la crée ici depuis le profil Clerk.
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  try {
    const profile = await currentUser();
    if (!profile) return null;

    const primaryEmail =
      profile.emailAddresses.find((e) => e.id === profile.primaryEmailAddressId)
        ?.emailAddress ?? profile.emailAddresses[0]?.emailAddress;
    if (!primaryEmail) return null;

    return await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        email: primaryEmail,
        firstName: profile.firstName,
        lastName: profile.lastName,
        imageUrl: profile.imageUrl,
        subscription: { create: { plan: "FREE" } },
      },
    });
  } catch (error) {
    console.error("[lib/auth] provisionnement utilisateur échoué:", error);
    return null;
  }
}
