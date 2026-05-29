import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getEventsPaged } from "@/lib/data.functions";
import { summarizeEvent, factCheckEvent, getFakeNewsAlerts } from "@/lib/ai.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, ExternalLink, Loader2, Sparkles, ShieldCheck, AlertTriangle, Bell, Siren } from "lucide-react";

export const Route = createFileRoute("/events")({ component: EventsPage });

const CONTEXTS = ["Crise/Conflit Négatif", "Événement Fortement Médiatisé", "Événement Neutre/Routinier"];
const CLUSTER_COLORS = ["bg-rose-500/15 text-rose-700", "bg-amber-500/15 text-amber-700", "bg-emerald-500/15 text-emerald-700", "bg-violet-500/15 text-violet-700"];

function EventsPage() {
  const fetchEvents = useServerFn(getEventsPaged);
  const fetchSummary = useServerFn(summarizeEvent);
  const fetchFactCheck = useServerFn(factCheckEvent);
  const fetchFakeAlerts = useServerFn(getFakeNewsAlerts);
  const [factCheckTriggered, setFactCheckTriggered] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const alertsQuery = useQuery({
    queryKey: ["fake-news-alerts"],
    queryFn: () => fetchFakeAlerts(),
    refetchInterval: 30_000,
  });
  const factQuery = useQuery({
    queryKey: ["event-fact", factCheckTriggered],
    queryFn: () => fetchFactCheck({ data: { eventId: factCheckTriggered! } }),
    enabled: !!factCheckTriggered,
    staleTime: Infinity,
    retry: false,
  });
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["event-summary", selectedId],
    queryFn: () => fetchSummary({ data: { eventId: selectedId!, lang: "fr" } }),
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });
  const [cluster, setCluster] = useState<number | null>(null);
  const [contextType, setContextType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const pageSize = 25;
  const { data, isLoading } = useQuery({
    queryKey: ["events", page, cluster, contextType, search],
    queryFn: () => fetchEvents({ data: { page, pageSize, cluster, contextType, search: search || null } }),
  });

  const totalPages = Math.ceil((data?.count ?? 0) / pageSize);

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar title="Événements" subtitle={`${data?.count ?? 0} événements monitorés (GDELT + démos)`} />

          {/* Alertes désinformation */}
          {(alertsQuery.data?.alerts?.length ?? 0) > 0 && (
            <div className="panel mb-4 overflow-hidden border-rose-200">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                className="flex w-full items-center justify-between gap-2 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2">
                  <Siren className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-bold text-rose-700">
                    Alertes de désinformation
                  </span>
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {alertsQuery.data!.alerts.length}
                  </span>
                </span>
                <Bell className="h-4 w-4 text-rose-600" />
              </button>
              {showAlerts && (
                <ul className="max-h-72 divide-y divide-rose-100 overflow-auto">
                  {alertsQuery.data!.alerts.map((a: any) => (
                    <li key={a.id} className="flex items-start gap-3 p-3 hover:bg-rose-50/50">
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.level === "critical" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold">{a.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="font-medium text-rose-700">📡 {a.domain}</span>
                          {a.location && <span>📍 {a.location}</span>}
                          <span>{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        {a.message && <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">{a.message}</p>}
                      </div>
                      {a.source_url && (
                        <a href={a.source_url} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-rose-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}


          <div className="panel mb-4 flex flex-wrap items-center gap-2 p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput); }}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher dans les titres…"
                className="w-56 bg-transparent text-sm outline-none"
              />
            </form>

            <select
              value={cluster ?? ""}
              onChange={(e) => { setPage(0); setCluster(e.target.value === "" ? null : Number(e.target.value)); }}
              className="rounded-full border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous clusters</option>
              <option value="0">Cluster 0</option>
              <option value="1">Cluster 1</option>
              <option value="2">Cluster 2</option>
              <option value="3">Cluster 3</option>
            </select>

            <select
              value={contextType ?? ""}
              onChange={(e) => { setPage(0); setContextType(e.target.value || null); }}
              className="rounded-full border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous contextes</option>
              {CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {(cluster !== null || contextType || search) && (
              <button
                onClick={() => { setCluster(null); setContextType(null); setSearch(""); setSearchInput(""); setPage(0); }}
                className="text-xs font-semibold text-violet-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="panel overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Chargement…</div>
            ) : (
              <div className="divide-y divide-border">
                {data?.rows.map((e: any) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { setSelectedRow(e); setSelectedId(e.id); }}
                    className="flex w-full items-start gap-3 p-4 text-left hover:bg-muted/30"
                  >
                    {e.cluster !== null && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${CLUSTER_COLORS[e.cluster] ?? "bg-muted"}`}>
                        C{e.cluster}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold">{e.title}</h3>
                        {e.source_url && (
                          <a href={e.source_url} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} className="shrink-0 text-muted-foreground hover:text-violet-600">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="font-medium">{e.source}</span>
                        <span>{new Date(e.published_at).toLocaleString()}</span>
                        {e.action_geo_fullname && <span>📍 {e.action_geo_fullname}</span>}
                        {e.context_type && <span className="font-medium text-foreground">{e.context_type}</span>}
                        {e.goldstein_scale != null && <span>Goldstein: {Number(e.goldstein_scale).toFixed(1)}</span>}
                        {e.avg_tone != null && <span>Tone: {Number(e.avg_tone).toFixed(1)}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border p-3">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} / {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-border bg-white p-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-border bg-white p-2 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <Dialog open={!!selectedId} onOpenChange={(o) => { if (!o) { setSelectedId(null); setSelectedRow(null); } }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="pr-6 text-base leading-snug">{selectedRow?.title}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {selectedRow?.source && <span className="font-medium text-foreground">{selectedRow.source}</span>}
                {selectedRow?.published_at && <span>{new Date(selectedRow.published_at).toLocaleString()}</span>}
                {selectedRow?.action_geo_fullname && <span>📍 {selectedRow.action_geo_fullname}</span>}
                {selectedRow?.context_type && <span>{selectedRow.context_type}</span>}
                {selectedRow?.goldstein_scale != null && <span>Goldstein: {Number(selectedRow.goldstein_scale).toFixed(1)}</span>}
                {selectedRow?.avg_tone != null && <span>Tone: {Number(selectedRow.avg_tone).toFixed(1)}</span>}
              </div>

              <div className="mt-2 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-violet-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  {summaryQuery.data?.hasArticle ? "Résumé IA (article complet)" : (summaryQuery.data?.cached ? "Résumé" : "Résumé IA")}
                </div>
                {summaryQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l'article…
                  </div>
                ) : summaryQuery.isError ? (
                  <p className="text-sm text-destructive">Impossible de charger l'article.</p>
                ) : (
                  <div className="max-h-[420px] overflow-auto pr-1">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {summaryQuery.data?.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Fact-check IA */}
              <div className="mt-3 rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-rose-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Vérification IA (Vrai / Faux)
                  </div>
                  {!factCheckTriggered || factCheckTriggered !== selectedId ? (
                    <button
                      onClick={() => setFactCheckTriggered(selectedId)}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Analyser
                    </button>
                  ) : null}
                </div>
                {!factCheckTriggered || factCheckTriggered !== selectedId ? (
                  <p className="text-xs text-muted-foreground">Cliquez pour estimer la probabilité que cette information soit fiable.</p>
                ) : factQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
                  </div>
                ) : factQuery.isError ? (
                  <p className="text-sm text-destructive">Erreur: {(factQuery.error as Error)?.message}</p>
                ) : factQuery.data ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                        factQuery.data.confidence >= 70 ? "bg-emerald-600 text-white"
                        : factQuery.data.confidence >= 40 ? "bg-amber-500 text-white"
                        : "bg-rose-600 text-white"
                      }`}>
                        {factQuery.data.verdict}
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {Math.round(Number(factQuery.data.confidence))}%
                      </div>
                      <div className="text-[11px] text-muted-foreground">probabilité d'être vrai</div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${factQuery.data.confidence >= 70 ? "bg-emerald-500" : factQuery.data.confidence >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${factQuery.data.confidence}%` }} />
                    </div>
                    <p className="text-sm leading-relaxed">{factQuery.data.reasoning}</p>
                    {Array.isArray(factQuery.data.red_flags) && factQuery.data.red_flags.length > 0 && (
                      <ul className="space-y-1">
                        {(factQuery.data.red_flags as unknown as string[]).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-rose-700">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {String(f)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              {selectedRow?.source_url && (
                <a
                  href={selectedRow.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline"
                >
                  Lire l'article original <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
