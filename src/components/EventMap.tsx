import { useI18n } from "@/lib/i18n";

type Cat = "disinformation" | "propaganda" | "satire" | "reliable" | "unverified";
interface E { id: string; title: string; lat: number | null; lng: number | null; location_name: string | null; category: Cat; stability_impact: number | null }

const MIN_LAT = 6.2, MAX_LAT = 12.5, MIN_LNG = 0.7, MAX_LNG = 3.85;

const catColor: Record<Cat, string> = {
  disinformation: "var(--crisis)",
  propaganda: "var(--coral)",
  satire: "var(--amber-glow)",
  reliable: "var(--stable)",
  unverified: "oklch(0.65 0.04 280)",
};

export function EventMap({ events }: { events: E[] }) {
  const { t } = useI18n();
  const pts = events.filter((e) => e.lat != null && e.lng != null);

  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{t("map.title")}</h3>
        <div className="flex gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {(["disinformation", "reliable"] as Cat[]).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: catColor[c] }} />
              {t(`categories.${c}` as const)}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-violet/5 to-coral/5 scanline">
        <svg viewBox="0 0 100 130" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor="oklch(0.62 0.20 290 / 0.18)" />
              <stop offset="1" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100" height="130" fill="url(#mapGlow)" />
          <path
            d="M40 5 L62 8 L70 22 L66 38 L72 55 L62 70 L60 90 L52 110 L46 122 L38 118 L40 95 L34 78 L40 60 L36 42 L42 24 Z"
            fill="oklch(0.96 0.012 270)"
            stroke="oklch(0.62 0.20 290 / 0.45)"
            strokeWidth="0.4"
          />
        </svg>

        {pts.map((e) => {
          const x = ((Number(e.lng) - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
          const y = (1 - (Number(e.lat) - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;
          const color = catColor[e.category];
          const size = 8 + Math.min(12, Math.abs(e.stability_impact ?? 0));
          return (
            <div key={e.id} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} title={e.title}>
              <span className="block rounded-full" style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size * 1.5}px ${color}` }} />
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground group-hover:block">
                {e.location_name ?? e.title.slice(0, 24)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
