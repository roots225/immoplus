"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

// Widget chatbot flottant — streaming depuis POST /api/chat
export function ChatWidget() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || streaming) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Le chatbot est indisponible");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setTurns((t) => {
          const copy = [...t];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch (err) {
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: "assistant",
          content: err instanceof Error ? err.message : "Erreur inattendue",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-navy px-4 py-3 text-sm font-semibold text-white">
            Assistant ImmoPlatform
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {turns.length === 0 && (
              <p className="text-slate-400">
                Posez une question sur un score, un DPE, une marge de négociation…
              </p>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${
                  t.role === "user"
                    ? "ml-auto bg-teal text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {t.content || "…"}
              </div>
            ))}
          </div>
          {isSignedIn ? (
            <form onSubmit={send} className="flex border-t border-slate-200">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Votre question…"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={streaming}
                className="px-4 text-sm font-semibold text-teal disabled:opacity-50"
              >
                Envoyer
              </button>
            </form>
          ) : (
            <div className="border-t border-slate-200 p-3 text-center text-sm">
              <Link href="/sign-in" className="font-semibold text-teal">
                Connectez-vous
              </Link>{" "}
              pour discuter avec l'assistant
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-2xl text-white shadow-lg hover:bg-teal-dark"
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {open ? (
          <X aria-hidden className="h-6 w-6" />
        ) : (
          <MessageCircle aria-hidden className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
