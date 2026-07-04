"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Vote chaud/froid + formulaire de commentaire (POST /api/deals/[id]/vote et /comments)
export function DealActions({ dealId, hotScore }: { dealId: string; hotScore: number }) {
  const router = useRouter();
  const [score, setScore] = useState(hotScore);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote(type: "HOT" | "COLD") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Vote impossible");
      setScore(data.hotScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publication impossible");
      setComment("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-3">
        <Button variant="gold" disabled={busy} onClick={() => vote("HOT")}>
          <Flame aria-hidden className="h-4 w-4" /> Chaud
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => vote("COLD")}>
          <Snowflake aria-hidden className="h-4 w-4" /> Froid
        </Button>
        <span className="text-sm font-semibold text-slate-600">Score : {score}</span>
      </div>
      <form onSubmit={postComment} className="mt-4 flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal focus:outline-none"
        />
        <Button type="submit" disabled={busy || !comment.trim()}>
          Publier
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
