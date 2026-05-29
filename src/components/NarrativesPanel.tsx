import { Flame, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Narrative {
  id: string; label: string; summary: string | null;
  keywords: string[] | null; event_count: number | null; suspicion_score: number | null;
}

export function NarrativesPanel({ narratives }: { narratives: Narrative[] }) {
  const { t } = useI18n();
  const top = narratives[0];
  const rest = narratives.slice(1, 4);
  const topSus = Number(top?.suspicion_score ?? 0);

  return (
    <div className="space-y-4">
      {top && (
        <div className="panel-coral relative overflow-hidden p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
                <Flame className="h-3 w-3" /> {t("narratives.title")}
              </div>
              <h3 className="mt-3 text-lg font-bold leading-tight">{top.label}</h3>
              {top.summary && <p className="mt-1 text-xs text-white/85 line-clamp-2">{top.summary}</p>}
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/20 ring-1 ring-white/25">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/70">{t("narratives.suspicion")}</div>
              <div className="font-mono text-3xl font-bold">{topSus.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/70">{t("narratives.events")}</div>
              <div className="font-mono text-2xl font-bold">{top.event_count ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="panel p-4">
          <ul className="space-y-2">
            {rest.map((n) => {
              const sus = Number(n.suspicion_score ?? 0);
              return (
                <li key={n.id} className="rounded-xl border border-border/60 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold">{n.label}</p>
                    <span className="font-mono text-sm font-bold text-coral">{sus.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-coral" style={{ width: `${Math.min(100, sus * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
