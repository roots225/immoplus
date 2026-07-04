import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/db/redis";
import { uploadToR2 } from "@/lib/storage/r2";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// POST /api/upload — upload photo RenovAI vers Cloudflare R2 (multipart/form-data)
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

    const rate = await checkRateLimit("upload", user.id, 40);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop d'uploads, réessayez dans une heure" },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté (JPEG, PNG ou WebP uniquement)" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (8 Mo max)" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `renovai/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (error) {
    console.error("[/api/upload] POST:", error);
    return NextResponse.json({ error: "Upload impossible, réessayez" }, { status: 500 });
  }
}
