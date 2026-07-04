import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, redis, TTL } from "@/lib/db/redis";
import { ChatMessageSchema } from "@/lib/validators";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/api-clients/claude";

const SYSTEM_PROMPT = `Tu es l'assistant ImmoPlatform, expert de l'immobilier français.
Tu aides les utilisateurs à comprendre leurs analyses ImmoScore (prix vs marché DVF, DPE,
risques Géorisques, transports, quartier), les estimations RenovAI et le fonctionnement
de la plateforme. Réponds en français, de façon concise et factuelle.
Ne donne jamais de conseil juridique ou fiscal personnalisé — recommande un notaire ou un
conseiller pour ces questions.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// POST /api/chat — chatbot Claude en streaming (historique en session Redis 24h)
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
    const parsed = ChatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message invalide" }, { status: 400 });
    }

    const rate = await checkRateLimit("chat", user.id, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de messages, réessayez dans une heure" },
        { status: 429 }
      );
    }

    // Historique de session (10 derniers tours)
    const sessionKey = `chat:session:${user.id}`;
    const rawHistory = await redis.get(sessionKey);
    const history: ChatTurn[] = rawHistory ? JSON.parse(rawHistory) : [];
    const messages: ChatTurn[] = [...history.slice(-10), { role: "user", content: parsed.data.message }];

    const stream = getAnthropic().messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let assistantText = "";
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              assistantText += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          // Persiste l'échange complet en session Redis
          const updated: ChatTurn[] = [
            ...messages,
            { role: "assistant", content: assistantText },
          ];
          await redis.set(sessionKey, JSON.stringify(updated.slice(-12)), "EX", TTL.DAY);
        } catch (error) {
          console.error("[/api/chat] stream:", error);
          controller.enqueue(encoder.encode("\n[Erreur : réponse interrompue]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[/api/chat] POST:", error);
    return NextResponse.json({ error: "Le chatbot est indisponible" }, { status: 500 });
  }
}
