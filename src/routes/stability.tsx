import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getStabilitySeries } from "@/lib/data.functions";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

export const Route = createFileRoute("/stability")({ component: StabilityPage });

function StabilityPage() {
  const fetchSeries = useServerFn(getStabilitySeries);
  const { data, isLoading } = useQuery({ queryKey: ["stability-series"], queryFn: () => fetchSeries() });

  const series = useMemo(() => {
    const map = new Map<string, any>();
    for (const h of data?.history ?? []) {
      map.set(h.date, { date: h.date, stability: Number(h.stability_score), goldstein: Number(h.goldstein_scale) });
    }
    for (const f of data?.forecast ?? []) {
      map.set(f.date, { ...(map.get(f.date) ?? { date: f.date }), forecast: Number(f.predicted_stability_score) });
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const cutoff = data?.history?.length ? data.history[data.history.length - 1].date : null;

  const last = series[series.length - (data?.forecast?.length ?? 0) - 1];

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar title="Courbe de stabilité" subtitle="Historique 2025 (348 jours) + prévision 7 jours 2026" />

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Jours historiques" value={(data?.history?.length ?? 0).toString()} />
            <Stat label="Jours de prévision" value={(data?.forecast?.length ?? 0).toString()} />
            <Stat label="Dernier score" value={last?.stability != null ? last.stability.toFixed(2) : "—"} />
            <Stat label="Prévision moyenne" value={data?.forecast?.length ? (data.forecast.reduce((s: number, f: any) => s + Number(f.predicted_stability_score), 0) / data.forecast.length).toFixed(2) : "—"} />
          </div>

          <div className="panel p-4">
            <h2 className="mb-2 font-display text-lg font-bold">Score de stabilité quotidien</h2>
            {isLoading ? (
              <div className="grid h-[500px] place-items-center text-sm text-muted-foreground">Chargement…</div>
            ) : (
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} interval={Math.floor(series.length / 12)} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "white" }}
                    />
                    <Legend />
                    {cutoff && <ReferenceLine x={cutoff} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "Prévision →", position: "insideTopRight", fill: "#f43f5e", fontSize: 11 }} />}
                    <Area type="monotone" dataKey="stability" stroke="#7c3aed" fill="url(#g1)" name="Stabilité (historique)" />
                    <Line type="monotone" dataKey="forecast" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} name="Prévision 2026" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
