import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getGeoEvents } from "@/lib/data.functions";

export const Route = createFileRoute("/map")({ component: MapPage });

// Benin bbox approx: lat 6.1 → 12.5 ; lng 0.7 → 3.9
const LAT_MIN = 6.0, LAT_MAX = 12.6, LNG_MIN = 0.6, LNG_MAX = 4.0;
const W = 720, H = 900;

function project(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
  return { x, y };
}

function MapPage() {
  const fetchGeo = useServerFn(getGeoEvents);
  const { data, isLoading } = useQuery({ queryKey: ["geo-events"], queryFn: () => fetchGeo() });

  const points = useMemo(() => {
    const pts = (data?.points ?? []).map((p: any) => ({ ...p, ...project(Number(p.lat), Number(p.lng)) }));
    return pts.sort((a, b) => b.count - a.count);
  }, [data]);

  const maxCount = points[0]?.count ?? 1;

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar title="Carte du Bénin" subtitle={`${points.length} localités · ${(data?.points ?? []).reduce((s: number, p: any) => s + p.count, 0).toLocaleString()} événements géolocalisés`} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="panel p-4">
              {isLoading ? (
                <div className="grid h-[600px] place-items-center text-sm text-muted-foreground">Chargement…</div>
              ) : (
                <svg viewBox={`0 0 ${W} ${H}`} className="h-[700px] w-full">
                  <defs>
                    <radialGradient id="bg" cx="50%" cy="30%">
                      <stop offset="0%" stopColor="#ede9fe" />
                      <stop offset="100%" stopColor="#f5f3ff" />
                    </radialGradient>
                    <filter id="glow"><feGaussianBlur stdDeviation="4" /></filter>
                  </defs>
                  <rect width={W} height={H} fill="url(#bg)" rx="20" />
                  {/* Benin rough outline */}
                  <path
                    d="M 200 880 L 180 700 L 150 600 L 130 480 L 110 380 L 100 280 L 130 180 L 180 100 L 280 60 L 360 40 L 440 80 L 500 160 L 540 260 L 560 360 L 580 460 L 600 560 L 580 660 L 540 760 L 480 840 L 360 880 Z"
                    fill="#ffffff"
                    fillOpacity="0.7"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                  />
                  {points.map((p: any, i) => {
                    const r = 6 + (p.count / maxCount) * 22;
                    const negRatio = p.count ? p.negative / p.count : 0;
                    const color = negRatio > 0.4 ? "#ef4444" : negRatio > 0.2 ? "#f59e0b" : "#10b981";
                    return (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={r + 4} fill={color} fillOpacity={0.25} filter="url(#glow)" />
                        <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={0.7} stroke="white" strokeWidth={1.5}>
                          <title>{`${p.name}: ${p.count} événements (${p.negative} négatifs)`}</title>
                        </circle>
                        {r > 12 && (
                          <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
                            {p.count}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="panel max-h-[700px] overflow-y-auto p-4">
              <h2 className="mb-3 font-display text-lg font-bold">Top localités</h2>
              <ul className="space-y-2">
                {points.slice(0, 30).map((p: any, i) => {
                  const negRatio = p.count ? p.negative / p.count : 0;
                  const color = negRatio > 0.4 ? "bg-rose-500" : negRatio > 0.2 ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-white p-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.count} évén. · {p.negative} négatifs · Goldstein {p.avgGoldstein.toFixed(1)}
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{p.count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
