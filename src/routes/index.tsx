import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { StabilityGauge } from "@/components/StabilityGauge";
import { AlertsPanel } from "@/components/AlertsPanel";
import { EventFeed } from "@/components/EventFeed";
import { EventMap } from "@/components/EventMap";
import { NarrativesPanel } from "@/components/NarrativesPanel";
import { Timeline } from "@/components/Timeline";
import { getDashboardData } from "@/lib/data.functions";
import { ingestGdelt } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { t } = useI18n();
  const fetchData = useServerFn(getDashboardData);
  const ingest = useServerFn(ingestGdelt);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchData() });
  const [msg, setMsg] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => ingest(),
    onSuccess: (r) => { setMsg(`${t("ingest.done")} (+${r.inserted})`); refetch(); },
  });

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar
            title="Bénin · Live Operations"
            subtitle="Surveillance des médias, détection de désinformation et alertes précoces."
            actions={
              <>
                {msg && <span className="hidden text-xs text-muted-foreground md:inline">{msg}</span>}
                <button
                  onClick={() => mut.mutate()}
                  disabled={mut.isPending}
                  className="hidden items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-xs font-semibold shadow-soft backdrop-blur hover:bg-white disabled:opacity-50 md:inline-flex"
                >
                  <Download className="h-3.5 w-3.5" />
                  {mut.isPending ? t("ingest.running") : t("ingest.btn")}
                </button>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-coral px-4 py-2 text-xs font-semibold text-white shadow-coral"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh")}
                </button>
              </>
            }
          />

          {isLoading || !data ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">…</div>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <StabilityGauge snapshots={data.snapshots as never} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EventMap events={data.events as never} />
                  <Timeline events={data.events as never} />
                </div>
                <EventFeed events={data.events as never} />
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <NarrativesPanel narratives={data.narratives as never} />
                <AlertsPanel alerts={data.alerts as never} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
