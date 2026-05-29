import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getClusterPoints } from "@/lib/data.functions";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/clusters")({ component: ClustersPage });

const COLORS: Record<string, string> = {
  "Crise/Conflit Négatif": "#ef4444",
  "Événement Fortement Médiatisé": "#f59e0b",
  "Événement Neutre/Routinier": "#10b981",
};

function ClustersPage() {
  const fetchPoints = useServerFn(getClusterPoints);
  const { data, isLoading } = useQuery({ queryKey: ["cluster-points"], queryFn: () => fetchPoints() });
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const p of data?.points ?? []) {
      const k = p.context_type ?? "Autre";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push({ x: Number(p.pca1), y: Number(p.pca2), z: 1, ...p });
    }
    return Array.from(m.entries());
  }, [data]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const [k, v] of grouped) t[k] = v.length;
    return t;
  }, [grouped]);

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar title="Clusters K-Means" subtitle="Projection PCA des 6 353 événements GDELT par contexte" />

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {Object.entries(totals).map(([name, count]) => (
              <button
                key={name}
                onClick={() => {
                  const n = new Set(hidden);
                  n.has(name) ? n.delete(name) : n.add(name);
                  setHidden(n);
                }}
                className={`panel flex items-center gap-3 p-4 text-left transition ${hidden.has(name) ? "opacity-40" : ""}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[name] ?? "#888" }} />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{name}</div>
                  <div className="font-display text-2xl font-bold">{count.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="panel p-4">
            <h2 className="mb-2 font-display text-lg font-bold">Scatter PCA1 × PCA2</h2>
            {isLoading ? (
              <div className="grid h-[500px] place-items-center text-sm text-muted-foreground">Chargement…</div>
            ) : (
              <div className="h-[560px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" name="PCA1" stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="number" dataKey="y" name="PCA2" stroke="hsl(var(--muted-foreground))" />
                    <ZAxis dataKey="z" range={[20, 40]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p: any = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-white p-3 text-xs shadow-lg">
                            <div className="line-clamp-2 max-w-xs font-semibold">{p.title}</div>
                            <div className="mt-1 text-muted-foreground">{p.action_geo_fullname}</div>
                            <div className="mt-1 flex gap-3">
                              <span>Goldstein: {Number(p.goldstein_scale ?? 0).toFixed(1)}</span>
                              <span>Tone: {Number(p.avg_tone ?? 0).toFixed(1)}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    {grouped.map(([name, pts]) =>
                      hidden.has(name) ? null : (
                        <Scatter key={name} name={name} data={pts} fill={COLORS[name] ?? "#888"} fillOpacity={0.6} />
                      ),
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
