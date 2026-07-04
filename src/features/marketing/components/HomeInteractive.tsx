"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------
// Formulaire hero : colle une URL d'annonce → redirige vers ImmoScore
// ------------------------------------------------------------

export function HeroAnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const target = url.trim()
      ? `/immoscore?url=${encodeURIComponent(url.trim())}`
      : "/immoscore";
    router.push(target);
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-9 flex max-w-[560px] gap-2.5">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.leboncoin.fr/annonce…"
        className="min-w-0 flex-1 rounded-[10px] border border-slate-300 bg-white px-[18px] py-[15px] text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 dark:border-slate-400/25 dark:bg-night-card dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-sky-400"
      />
      <button
        type="submit"
        className="shrink-0 rounded-[10px] bg-sky-500 px-[26px] py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-sky-600 dark:bg-sky-400 dark:text-night-deepest dark:hover:bg-sky-300"
      >
        Analyser
      </button>
    </form>
  );
}

// ------------------------------------------------------------
// Compteur animé d'analyses (ease-out cubic, ~1,4 s)
// ------------------------------------------------------------

export function AnalysesCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className="mt-[18px] font-mono text-sm text-sky-600 dark:text-sky-300">
      {count.toLocaleString("fr-FR")} annonces analysées ce mois
    </div>
  );
}

// ------------------------------------------------------------
// Onglets personas : problème / réponse selon le profil
// ------------------------------------------------------------

export interface Persona {
  label: string;
  problem: string;
  solution: string;
}

export function PersonaTabs({ personas }: { personas: Persona[] }) {
  const [active, setActive] = useState(0);
  const persona = personas[active];

  return (
    <>
      <div className="mb-9 flex flex-wrap justify-center gap-2">
        {personas.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={`rounded-full border px-[22px] py-2.5 text-sm font-semibold transition-colors ${
              i === active
                ? "border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-night-deepest"
                : "border-slate-300 bg-transparent text-slate-600 hover:text-slate-900 dark:border-slate-400/30 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-400/15 dark:bg-night dark:shadow-none">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-red-500 dark:text-red-400">
              Le problème
            </div>
            <p className="mt-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {persona.problem}
            </p>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Notre réponse
            </div>
            <p className="mt-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {persona.solution}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
