import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getAnalytics, getEventTypes } from "@/lib/data.functions";
import { Activity, TrendingDown, Users, Newspaper } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Area, AreaChart,
} from "recharts";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const PIE_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6"];

function AnalyticsPage() {
  const fetchAnalytics = useServerFn(getAnalytics);
  const fetchTypes = useServerFn(getEventTypes);
  const [month, setMonth] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", month, eventType],
    queryFn: () => fetchAnalytics({ data: { month, eventType } }),
  });
  const { data: typesData } = useQuery({ queryKey: ["event-types"], queryFn: () => fetchTypes() });

  // 7-day moving average for stability proxy = goldstein-based
  const stability = (data?.daily ?? []).map((d, i, arr) => {
    const win = arr.slice(Math.max(0, i - 6), i + 1);
    const vals = win.map(w => w.goldstein).filter((v): v is number => v != null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { date: d.date, score: avg != null ? 50 + avg * 5 : null, raw: d.goldstein };
  });

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-4">
          <TopBar title="🇧🇯 Bénin Geo-Watch" subtitle="Radar Géopolitique et Sécuritaire — données GDELT 2025/2026" />

          {/* Filtres */}
          <div className="panel flex flex-wrap items-center gap-2 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtres</span>
            <select
              value={month ?? ""}
              onChange={(e) => setMonth(e.target.value || null)}
              className="rounded-full border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les mois</option>
              {(data?.monthly ?? []).map((m) => (
                <option key={m.name} value={m.name}>{m.name} ({m.value})</option>
              ))}
            </select>
            <select
              value={eventType ?? ""}
              onChange={(e) => setEventType(e.target.value || null)}
              className="rounded-full border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les types</option>
              {(typesData?.types ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {(month || eventType) && (
              <button onClick={() => { setMonth(null); setEventType(null); }} className="text-xs font-semibold text-violet-600 hover:underline">
                Réinitialiser
              </button>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Total d'événements" value={data?.kpi.total.toLocaleString() ?? "—"} icon={<Newspaper className="h-4 w-4" />} />
            <Kpi label="Goldstein Moyen" value={data?.kpi.avgGoldstein.toFixed(2) ?? "—"} icon={<Activity className="h-4 w-4" />} />
            <Kpi label="Tone Médiatique Moyen" value={data?.kpi.avgTone.toFixed(2) ?? "—"} icon={<TrendingDown className="h-4 w-4" />} />
            <Kpi label="Score de Stabilité" value={String(data?.kpi.stability ?? "—")} icon={<Activity className="h-4 w-4" />} accent />
          </div>

          {/* Événements et Tone Médiatique */}
          <ChartCard
            title="Événements et Tone Médiatique"
            subtitle="Croise le volume d'articles publiés (bruit médiatique) avec le sentiment général. Une chute du Tone = premier signal d'alerte."
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="count" fill="#a78bfa" name="Événements" />
                <Line yAxisId="right" type="monotone" dataKey="tone" stroke="#ef4444" dot={false} strokeWidth={2} name="Tone moyen" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Goldstein */}
          <ChartCard
            title="Intensité des Conflits (Goldstein Scale)"
            subtitle="Mesure le potentiel de déstabilisation. Plus la courbe plonge, plus la probabilité de violences est élevée."
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.daily ?? []}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 10 }} domain={[-10, 10]} />
                <Tooltip />
                <Area type="monotone" dataKey="goldstein" stroke="#7c3aed" fill="url(#gold)" strokeWidth={2} name="Goldstein" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Type distribution */}
            <ChartCard title="Distribution des Événements par Type" subtitle="Nuance l'analyse : crise n'exclut pas activité diplomatique en parallèle.">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data?.typeDist ?? []} dataKey="value" nameKey="name" outerRadius={90} label={(e) => `${e.name} (${e.value})`} labelLine={false} style={{ fontSize: 10 }}>
                    {(data?.typeDist ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Top actors */}
            <ChartCard title="Le Poids des Acteurs (Top 10 pays)" subtitle="Principaux acteurs d'interaction géopolitique du Bénin.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topActors ?? []} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Stability evolution */}
          <ChartCard
            title="Évolution de la Stabilité Globale"
            subtitle="Score agrégé quotidiennement. La courbe violette lisse la tendance sur 7 jours."
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Score lissé (7j)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top sources */}
          <ChartCard title="Top Sources Médiatiques" subtitle="Domaines qui couvrent le plus le Bénin.">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.topSources ?? []} layout="vertical" margin={{ left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Insights */}
          <div className="panel p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-700">Insights Clés & Analyse</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Insight title="Pic d'Instabilité" text="Le mois le plus chargé concentre près du double de la moyenne mensuelle — signal d'instabilité majeur qui a déclenché les alertes." />
              <Insight title="Dramatisation Médiatique" text="Les articles couvrant une crise affichent un ton fortement négatif comparé aux autres événements. La presse polarise l'actualité sécuritaire." />
              <Insight title="Résilience Diplomatique" text="Malgré un contexte sécuritaire tendu au Nord, la majorité des événements sont de type Coopération / Diplomatie. L'activité diplomatique du Bénin reste solide." />
              <Insight title="Le Poids du Nigeria" text="Le Nigeria s'affirme comme le premier acteur d'interaction géopolitique du Bénin, devant la France et les autres pays frontaliers." />
            </div>
          </div>

          {isLoading && <p className="text-center text-sm text-muted-foreground">Chargement des analyses…</p>}
        </main>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white" : ""}`}>
      <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${accent ? "text-white/80" : "text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-bold">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="text-xs font-bold text-violet-700">{title}</div>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
