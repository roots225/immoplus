"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface MarketStat {
  medianPricePerSqm: number;
  count: number;
}

interface BarometreData {
  apartments: MarketStat | null;
  houses: MarketStat | null;
  radius: number;
}

// Recherche d'adresse via BAN (API publique, appelable côté client) puis
// interrogation de /api/barometre pour les médianes DVF.
export function BarometreExplorer() {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [data, setData] = useState<BarometreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const banRes = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`
      );
      const ban = await banRes.json();
      const feature = ban.features?.[0];
      if (!feature) {
        setError("Adresse introuvable");
        return;
      }
      const [lng, lat] = feature.geometry.coordinates;
      setLabel(feature.properties.label);

      const res = await fetch(`/api/barometre?lat=${lat}&lng=${lng}&radius=500`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur inconnue");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Données indisponibles");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="mt-10">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adresse ou ville, ex. : 12 rue de Strasbourg Nantes"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal focus:outline-none"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Recherche…" : "Rechercher"}
        </Button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-8">
          {label && <p className="mb-4 text-sm text-slate-500">Autour de : {label}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="text-sm text-slate-500">Appartements</p>
              <p className="mt-1 text-2xl font-bold text-navy">
                {data.apartments ? `${fmt(data.apartments.medianPricePerSqm)}/m²` : "Pas assez de données"}
              </p>
              {data.apartments && (
                <p className="mt-1 text-xs text-slate-400">
                  {data.apartments.count} transactions dans un rayon de {data.radius} m
                </p>
              )}
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Maisons</p>
              <p className="mt-1 text-2xl font-bold text-navy">
                {data.houses ? `${fmt(data.houses.medianPricePerSqm)}/m²` : "Pas assez de données"}
              </p>
              {data.houses && (
                <p className="mt-1 text-xs text-slate-400">
                  {data.houses.count} transactions dans un rayon de {data.radius} m
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
