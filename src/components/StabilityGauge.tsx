import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Snapshot { score: number; state: "stable" | "tension" | "crisis"; computed_at: string; drivers?: Record<string, number> | null }

export function StabilityGauge({ snapshots }: { snapshots: Snapshot[] }) {
  const { t } = useI18n();
  const last = snapshots[snapshots.length - 1];
  const score = Number(last?.score ?? 0);
  const state = (last?.state ?? "stable") as Snapshot["state"];

  // sparkline curve
  const w = 520, h = 150;
  const ys = snapshots.length ? snapshots.map((s) => Number(s.score)) : [40, 60];
  const minY = Math.min(...ys) - 5;
  const maxY = Math.max(...ys) + 5;
  const range = Math.max(1, maxY - minY);
  const pts = snapshots.map((s, i) => {
    const x = (i / Math.max(1, snapshots.length - 1)) * w;
    const y = h - ((Number(s.score) - minY) / range) * h;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const lastPt = pts[pts.length - 1] ?? [w, h / 2];

  return (
    <div className="panel-violet relative overflow-hidden p-6">
      <div className="flex items-center justify-between text-white/80">
        <div>
          <h3 className="text-sm font-semibold text-white">{t("stability.title")}</h3>
          <p className="text-xs text-white/70">Bénin · {t("stability.last7")}</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15">
          Monthly <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-2 inline-flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold text-white">{Math.round(score)}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-white/80">{t(`stability.state.${state}` as const)}</span>
      </div>

      <div className="mt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[160px] w-full">
          <defs>
            <linearGradient id="gaugeArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.35" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#gaugeArea)" />
          <path d={path} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <g transform={`translate(${lastPt[0]},${lastPt[1]})`}>
            <circle r="14" fill="white" />
            <circle r="6" fill="oklch(0.74 0.18 18)" />
          </g>
          <g transform={`translate(${Math.min(w - 90, lastPt[0] + 10)}, ${Math.max(20, lastPt[1] - 28)})`}>
            <rect x="0" y="0" width="80" height="42" rx="12" fill="oklch(0.22 0.04 280)" />
            <text x="40" y="18" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">{Math.round(score)}</text>
            <text x="40" y="32" textAnchor="middle" fill="white" fontSize="9" opacity=".7" letterSpacing="2">SCORE</text>
          </g>
        </svg>
        <div className="mt-1 flex justify-between px-1 text-[10px] uppercase tracking-wider text-white/70">
          {["J-6", "J-5", "J-4", "J-3", "J-2", "J-1", "J"].map((d) => <span key={d}>{d}</span>)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { k: "stable", label: t("stability.state.stable") },
          { k: "tension", label: t("stability.state.tension") },
          { k: "crisis", label: t("stability.state.crisis") },
        ].map((s) => (
          <div key={s.k} className={`rounded-xl px-3 py-2 text-center text-xs ring-1 ring-white/15 ${state === s.k ? "bg-white/20 text-white" : "bg-white/8 text-white/70"}`}>
            <div className="text-[10px] uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
