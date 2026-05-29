import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const [events, alerts, narratives, snapshots] = await Promise.all([
    supabaseAdmin.from("events").select("*").order("published_at", { ascending: false }).limit(50),
    supabaseAdmin.from("alerts").select("*").order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("narratives").select("*").order("suspicion_score", { ascending: false }).limit(10),
    supabaseAdmin.from("stability_snapshots").select("*").order("computed_at", { ascending: true }).limit(30),
  ]);
  return {
    events: events.data ?? [],
    alerts: alerts.data ?? [],
    narratives: narratives.data ?? [],
    snapshots: snapshots.data ?? [],
  };
});

export const getEventsPaged = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      page: z.number().min(0).default(0),
      pageSize: z.number().min(1).max(100).default(25),
      cluster: z.number().int().nullable().optional(),
      contextType: z.string().nullable().optional(),
      search: z.string().nullable().optional(),
      minGoldstein: z.number().nullable().optional(),
      maxGoldstein: z.number().nullable().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("events").select("*", { count: "exact" });
    if (data.cluster !== null && data.cluster !== undefined) q = q.eq("cluster", data.cluster);
    if (data.contextType) q = q.eq("context_type", data.contextType);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.minGoldstein !== null && data.minGoldstein !== undefined) q = q.gte("goldstein_scale", data.minGoldstein);
    if (data.maxGoldstein !== null && data.maxGoldstein !== undefined) q = q.lte("goldstein_scale", data.maxGoldstein);
    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count } = await q.order("published_at", { ascending: false }).range(from, to);
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const getClusterPoints = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("events")
    .select("id,title,cluster,context_type,pca1,pca2,goldstein_scale,avg_tone,published_at,action_geo_fullname")
    .not("pca1", "is", null)
    .not("pca2", "is", null)
    .limit(3000);
  return { points: data ?? [] };
});

export const getStabilitySeries = createServerFn({ method: "GET" }).handler(async () => {
  const [hist, fc] = await Promise.all([
    supabaseAdmin.from("daily_scores").select("date,stability_score,score,goldstein_scale,status").order("date", { ascending: true }),
    supabaseAdmin.from("stability_forecasts").select("date,predicted_stability_score").order("date", { ascending: true }),
  ]);
  return { history: hist.data ?? [], forecast: fc.data ?? [] };
});

// Approximate centroids for Benin localities (degrees). Fallback: country centroid.
const GEO: Record<string, [number, number]> = {
  "Benin": [9.3077, 2.3158],
  "Cotonou": [6.3703, 2.3912],
  "Porto-Novo": [6.4969, 2.6289],
  "Parakou": [9.3370, 2.6303],
  "Abomey": [7.1826, 1.9912],
  "Ouidah": [6.3622, 2.0852],
  "Kandi": [11.1342, 2.9386],
  "Natitingou": [10.3045, 1.3795],
  "Djougou": [9.7081, 1.6664],
  "Bohicon": [7.1782, 2.0667],
  "Lokossa": [6.6386, 1.7167],
  "Malanville": [11.8676, 3.3866],
  "Tanguieta": [10.6167, 1.2667],
  "Karimama": [12.0667, 3.1833],
  "Savalou": [7.9281, 1.9759],
  "Tchaourou": [8.8867, 2.5994],
  "Allada": [6.6653, 2.1511],
  "Porga": [11.0500, 0.9833],
  "Pobe": [6.9800, 2.6700],
  "Kalale": [10.2867, 3.3833],
  "Couffo": [7.0167, 1.7500],
  "Ganvie": [6.4667, 2.4167],
  "Alibori": [11.3000, 2.9000],
  "Koudou": [11.9667, 2.0833],
  "Atakora": [10.5000, 1.4000],
};

export const getGeoEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("events")
    .select("action_geo_fullname,context_type,goldstein_scale,avg_tone")
    .not("action_geo_fullname", "is", null);

  const agg = new Map<string, { name: string; lat: number; lng: number; count: number; negative: number; goldstein: number }>();
  for (const r of data ?? []) {
    const full = r.action_geo_fullname as string;
    const city = full.split(",")[0].trim();
    const coord = GEO[city] ?? GEO["Benin"];
    const key = city;
    const cur = agg.get(key) ?? { name: city, lat: coord[0], lng: coord[1], count: 0, negative: 0, goldstein: 0 };
    cur.count += 1;
    if (r.context_type === "Crise/Conflit Négatif") cur.negative += 1;
    cur.goldstein += Number(r.goldstein_scale ?? 0);
    agg.set(key, cur);
  }
  const points = Array.from(agg.values()).map((p) => ({
    ...p,
    avgGoldstein: p.count ? p.goldstein / p.count : 0,
  }));
  return { points };
});

export const getAnalytics = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    month: z.string().nullable().optional(),
    eventType: z.string().nullable().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("events").select("published_at,goldstein_scale,avg_tone,num_articles,num_mentions,context_type,event_type,actor1_country,actor2_country,actor1_name,actor2_name,source,cluster,action_geo_country,action_geo_fullname,lat,lng").limit(10000);
    if (data.month) {
      const [y, m] = data.month.split("-").map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const to = new Date(Date.UTC(y, m, 1)).toISOString();
      q = q.gte("published_at", from).lt("published_at", to);
    }
    if (data.eventType) q = q.eq("event_type", data.eventType);
    const { data: rows } = await q;
    const evs = rows ?? [];

    // Daily aggregates
    const byDay = new Map<string, { date: string; count: number; tone: number; goldstein: number; toneN: number; gN: number }>();
    for (const e of evs) {
      const d = (e.published_at as string).slice(0, 10);
      const cur = byDay.get(d) ?? { date: d, count: 0, tone: 0, goldstein: 0, toneN: 0, gN: 0 };
      cur.count += 1;
      if (e.avg_tone != null) { cur.tone += Number(e.avg_tone); cur.toneN++; }
      if (e.goldstein_scale != null) { cur.goldstein += Number(e.goldstein_scale); cur.gN++; }
      byDay.set(d, cur);
    }
    const daily = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      date: d.date, count: d.count,
      tone: d.toneN ? d.tone / d.toneN : null,
      goldstein: d.gN ? d.goldstein / d.gN : null,
    }));

    // Distribution by event_type
    const types = new Map<string, number>();
    for (const e of evs) {
      const t = (e.event_type as string) ?? "Inconnu";
      types.set(t, (types.get(t) ?? 0) + 1);
    }
    const typeDist = Array.from(types.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Distribution by context_type
    const ctx = new Map<string, number>();
    for (const e of evs) {
      const t = (e.context_type as string) ?? "Inconnu";
      ctx.set(t, (ctx.get(t) ?? 0) + 1);
    }
    const ctxDist = Array.from(ctx.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Top actors (countries)
    const actors = new Map<string, number>();
    for (const e of evs) {
      for (const code of [e.actor1_country, e.actor2_country]) {
        if (!code || (code as string).toLowerCase() === "ben" || (code as string).toLowerCase() === "unknown") continue;
        actors.set(code as string, (actors.get(code as string) ?? 0) + 1);
      }
    }
    const topActors = Array.from(actors.entries()).map(([name, value]) => ({ name: (name as string).toUpperCase(), value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Top sources
    const srcs = new Map<string, number>();
    for (const e of evs) {
      const s = (e.source as string) ?? "Inconnu";
      srcs.set(s, (srcs.get(s) ?? 0) + 1);
    }
    const topSources = Array.from(srcs.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Monthly counts (for filter dropdown)
    const months = new Map<string, number>();
    for (const e of evs) {
      const m = (e.published_at as string).slice(0, 7);
      months.set(m, (months.get(m) ?? 0) + 1);
    }
    const monthly = Array.from(months.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

    // KPIs
    const total = evs.length;
    const toneVals = evs.map(e => Number(e.avg_tone)).filter(n => !isNaN(n));
    const gVals = evs.map(e => Number(e.goldstein_scale)).filter(n => !isNaN(n));
    const avgTone = toneVals.length ? toneVals.reduce((a, b) => a + b, 0) / toneVals.length : 0;
    const avgGoldstein = gVals.length ? gVals.reduce((a, b) => a + b, 0) / gVals.length : 0;
    const stability = Math.round(50 + avgGoldstein * 5 + avgTone * 1.5);

    return { daily, typeDist, ctxDist, topActors, topSources, monthly, kpi: { total, avgTone, avgGoldstein, stability } };
  });

export const getEventTypes = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("events").select("event_type").not("event_type", "is", null).limit(10000);
  const set = new Set<string>();
  for (const r of data ?? []) if (r.event_type) set.add(r.event_type as string);
  return { types: Array.from(set).sort() };
});
