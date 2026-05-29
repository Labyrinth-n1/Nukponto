import { AlertTriangle, Bell, ShieldAlert, Siren } from "lucide-react";
import { useI18n, timeAgo } from "@/lib/i18n";

type Level = "low" | "moderate" | "high" | "critical";
interface Alert { id: string; level: Level; title: string; message: string | null; created_at: string }

const styles: Record<Level, { color: string; icon: typeof Bell; chip: string }> = {
  critical: { color: "text-destructive", icon: Siren, chip: "bg-destructive/10 text-destructive" },
  high: { color: "text-coral", icon: ShieldAlert, chip: "bg-coral/10 text-coral" },
  moderate: { color: "text-amber-glow", icon: AlertTriangle, chip: "bg-amber-glow/15 text-foreground" },
  low: { color: "text-muted-foreground", icon: Bell, chip: "bg-muted text-muted-foreground" },
};

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const { t, lang } = useI18n();
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{t("alerts.title")}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("alerts.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 5).map((a) => {
            const s = styles[a.level];
            const Icon = s.icon;
            return (
              <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.chip}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
                      {t(`alerts.level.${a.level}` as const)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(a.created_at, lang)}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold leading-tight">{a.title}</p>
                  {a.message && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.message}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
