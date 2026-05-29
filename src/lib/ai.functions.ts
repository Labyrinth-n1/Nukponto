import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function embed(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-embedding-001", input: text }),
  });
  if (!res.ok) throw new Error(`embed failed ${res.status}`);
  const j = await res.json();
  return j.data[0].embedding as number[];
}

/** Chatbot RAG géopolitique : conversation multi-tours + contexte depuis events + articles. */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    question: z.string().min(2).max(1000),
    lang: z.enum(["fr", "en"]).default("fr"),
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000),
    })).max(20).optional(),
    intent: z.enum(["auto", "summarize_crisis", "explain_conflict", "verify_info", "historical_context", "citizen_qa"]).default("auto"),
  }))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    // 1. Tokenisation de la question (filtrage côté SQL pour couvrir TOUTE l'année de données)
    const stop = new Set(["le","la","les","un","une","des","de","du","et","ou","a","au","aux","en","dans","sur","pour","par","avec","sans","est","sont","que","qui","quoi","quel","quelle","quels","quelles","ce","cette","ces","mon","ton","son","the","and","or","of","to","in","on","for","with","is","are","what","who","how","why","when","where"]);
    const tokens = data.question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !stop.has(w));

    const cols = "id,title,summary,source,source_url,category,published_at,action_geo_fullname,actor1_name,actor2_name,event_type,goldstein_scale,avg_tone,num_sources,num_mentions";
    type Ev = { id: string; title: string; source_url: string | null; published_at: string; summary: string | null; action_geo_fullname: string | null; actor1_name: string | null; actor2_name: string | null; event_type: string | null; category: string | null; source: string | null; num_sources: number | null; num_mentions: number | null; goldstein_scale: number | null; avg_tone: number | null };

    // Si la question contient des mots-clés, on filtre la BDD ENTIÈRE (1 an) par OR ilike.
    let events: Ev[] = [];
    if (tokens.length) {
      const ors = tokens.flatMap((t) => {
        const safe = t.replace(/[,()*%]/g, "");
        return [`title.ilike.%${safe}%`, `summary.ilike.%${safe}%`, `action_geo_fullname.ilike.%${safe}%`, `actor1_name.ilike.%${safe}%`, `actor2_name.ilike.%${safe}%`];
      }).join(",");
      const { data: hits } = await supabaseAdmin.from("events").select(cols)
        .or(ors).order("published_at", { ascending: false }).limit(400);
      events = (hits ?? []) as Ev[];
    }
    // On injecte aussi un fond de 60 événements récents (questions type "que s'est-il passé récemment ?")
    const { data: latest } = await supabaseAdmin.from("events").select(cols)
      .order("published_at", { ascending: false }).limit(60);
    const seen = new Set(events.map((e) => e.id));
    for (const e of (latest ?? []) as Ev[]) if (!seen.has(e.id)) events.push(e);

    // 2. Scoring local pour choisir les 12 plus pertinents
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const scoreEvent = (e: Ev) => {
      const text = norm(`${e.title} ${e.summary ?? ""} ${e.action_geo_fullname ?? ""} ${e.actor1_name ?? ""} ${e.actor2_name ?? ""} ${e.event_type ?? ""} ${e.category ?? ""}`);
      let s = 0;
      for (const t of tokens) if (text.includes(t)) s += 1;
      s += Math.log10(1 + (e.num_sources ?? 0)) * 0.3;
      const ageDays = (Date.now() - new Date(e.published_at).getTime()) / 86400000;
      s += Math.max(0, 1 - ageDays / 365) * 0.4;
      return s;
    };
    const picked = (tokens.length ? [...events].sort((a, b) => scoreEvent(b) - scoreEvent(a)) : events).slice(0, 12);

    // 3. Charger extraits d'articles complets pour le top 5
    const urls = picked.slice(0, 5).map((e) => e.source_url).filter(Boolean) as string[];
    let articleMap = new Map<string, string>();
    if (urls.length) {
      const { data: arts } = await supabaseAdmin
        .from("event_articles").select("url,content").in("url", urls);
      articleMap = new Map((arts ?? []).map((a) => [a.url, a.content]));
    }

    const context = picked.map((e, i) => {
      const art = e.source_url ? articleMap.get(e.source_url) : undefined;
      const extract = art ? art.slice(0, 600) : (e.summary ?? "");
      return `[${i + 1}] ${e.published_at?.slice(0, 10)} · ${e.source} · ${e.action_geo_fullname ?? "—"}
Titre: ${e.title}
Acteurs: ${[e.actor1_name, e.actor2_name].filter(Boolean).join(" / ") || "—"} | Type: ${e.event_type ?? "—"} | Goldstein: ${e.goldstein_scale ?? "—"} | Tone: ${e.avg_tone ?? "—"} | Couverture: ${e.num_sources ?? 0} sources / ${e.num_mentions ?? 0} mentions
URL: ${e.source_url ?? "—"}
Extrait: ${extract}`;
    }).join("\n\n");

    // 4. Système : différencié par intention
    const intentBriefs: Record<string, string> = {
      auto: "Identifie d'abord l'intention de l'utilisateur (résumer crise / expliquer conflit / vérifier info / contexte historique / question citoyenne) puis réponds en conséquence.",
      summarize_crisis: "L'utilisateur veut un RÉSUMÉ DE CRISE : synthétise les événements récents pertinents, chronologie, acteurs clés, escalade/désescalade, enjeux.",
      explain_conflict: "L'utilisateur veut COMPRENDRE UN CONFLIT : explique acteurs, causes, dynamique, position des parties, risques régionaux.",
      verify_info: "L'utilisateur veut VÉRIFIER UNE INFO virale : confronte-la au corpus, indique sources concordantes/divergentes, signaux de désinformation (langage émotionnel, source unique, absence de citations), verdict prudent (vrai / probablement vrai / incertain / probablement faux / faux) avec justification.",
      historical_context: "L'utilisateur veut le CONTEXTE HISTORIQUE : rappelle précédents, dynamiques récurrentes, accords/conflits passés liés. Reste factuel.",
      citizen_qa: "L'utilisateur est un CITOYEN qui veut comprendre simplement. Réponds en langage accessible, sans jargon.",
    };

    const sysFr = `Tu es Nukponto, assistant IA géopolitique du Bénin et de l'Afrique de l'Ouest, expert en analyse de crises, en conflits régionaux et en détection de désinformation.

${intentBriefs[data.intent]}

RÈGLES STRICTES :
- Réponds EN FRANÇAIS, structuré en markdown (titres ##, listes, **gras**).
- Ancre TOUTES tes affirmations dans le CONTEXTE fourni : cite les sources entre crochets [1], [2], [3].
- Si l'information n'est PAS dans le contexte, dis-le clairement ("Je n'ai pas d'événement récent à ce sujet dans le corpus surveillé"). N'invente RIEN.
- Pour la vérification d'info : sois prudent, distingue ce qui est confirmé par plusieurs sources de ce qui vient d'une source isolée.
- Longueur : 6 à 15 lignes selon la question. Synthétique, factuel, neutre.
- Termine par une mini-section "## Sources" qui liste les [n] cités avec leur source.`;

    const sysEn = sysFr.replace("EN FRANÇAIS", "IN ENGLISH").replace("Je n'ai pas d'événement récent à ce sujet dans le corpus surveillé", "I have no recent event on this in the monitored corpus");

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: data.lang === "fr" ? sysFr : sysEn },
      { role: "system", content: `CORPUS NUKPONTO (${picked.length} événements pertinents, données réelles GDELT + articles) :\n\n${context}` },
      ...(data.history ?? []).slice(-10),
      { role: "user", content: data.question },
    ];

    const callModel = (model: string) => fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages }),
    });
    // Try a cascade of models with backoff to avoid rate-limit dead-ends.
    const models = [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-3.1-flash-lite-preview",
    ];
    let res: Response | null = null;
    for (let i = 0; i < models.length; i++) {
      res = await callModel(models[i]);
      if (res.status !== 429) break;
      await new Promise((r) => setTimeout(r, 600 + i * 500));
    }
    if (!res) throw new Error("no response");
    if (res.status === 429) return { answer: data.lang === "fr" ? "Trop de requêtes en ce moment. Réessaie dans une minute." : "Too many requests right now. Try again in a minute.", sources: [] };
    if (res.status === 402) return { answer: data.lang === "fr" ? "Crédits IA épuisés (réglages → workspace → usage)." : "AI credits exhausted.", sources: [] };
    if (!res.ok) throw new Error(`chat failed ${res.status}`);
    const j = await res.json();
    const answer = (j.choices?.[0]?.message?.content as string) ?? "";
    const sources = picked.map((e, i) => ({
      n: i + 1, title: e.title, source: e.source, url: e.source_url,
      date: e.published_at, location: e.action_geo_fullname,
    }));
    return { answer, sources };
  });

/** Ingestion GDELT simplifiée : récupère articles "Benin" via GDELT DOC API,
 *  classe via LLM, insère en DB. */
export const ingestGdelt = createServerFn({ method: "POST" }).handler(async () => {
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=Benin&mode=ArtList&maxrecords=15&format=json&sort=DateDesc";
  const res = await fetch(url);
  if (!res.ok) return { inserted: 0, error: `GDELT ${res.status}` };
  const j = await res.json().catch(() => ({ articles: [] }));
  const arts: Array<{ url: string; title: string; seendate: string; domain: string; language?: string }> =
    j.articles ?? [];

  let inserted = 0;
  for (const a of arts.slice(0, 10)) {
    const pub = a.seendate
      ? new Date(`${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}T${a.seendate.slice(9, 11)}:${a.seendate.slice(11, 13)}:00Z`)
      : new Date();
    const { error } = await supabaseAdmin.from("events").insert({
      source: a.domain ?? "GDELT",
      source_url: a.url,
      title: a.title ?? a.url,
      lang: (a.language ?? "fr").toLowerCase().slice(0, 2),
      published_at: pub.toISOString(),
      category: "unverified",
      raw: a as never,
    });
    if (!error) inserted++;
  }
  return { inserted };
});

async function loadEventWithArticle(eventId: string) {
  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("id,title,summary,content,source,source_url,published_at,action_geo_fullname,context_type,goldstein_scale,avg_tone,actor1_name,actor2_name,num_sources,num_mentions,num_articles,raw")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) throw new Error("event not found");
  let article: string | null = ev.content ?? null;
  if ((!article || article.length < 200) && ev.source_url) {
    const { data: art } = await supabaseAdmin
      .from("event_articles")
      .select("content")
      .eq("url", ev.source_url)
      .maybeSingle();
    if (art?.content) article = art.content;
  }
  return { ev, article };
}

/** Résumé cohérent IA basé sur l'article (priorité dataset) ou métadonnées. */
export const summarizeEvent = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    eventId: z.string().uuid(),
    lang: z.enum(["fr", "en"]).default("fr"),
    force: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const { ev, article } = await loadEventWithArticle(data.eventId);
    const hasArticle = !!(article && article.length > 100);

    // Cache : résumé déjà généré
    if (!data.force && ev.summary && ev.summary.length > 80) {
      return { event: ev, summary: ev.summary, cached: true, isArticle: false, hasArticle };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      const fb = hasArticle ? article!.slice(0, 800) : ev.title;
      return { event: ev, summary: fb, cached: false, isArticle: hasArticle, hasArticle };
    }

    const sys = data.lang === "fr"
      ? `Tu es journaliste-analyste spécialisé Bénin & Afrique de l'Ouest. Rédige un résumé COHÉRENT, structuré et FACTUEL en français (5-7 phrases, ~120 mots). Structure: (1) Quoi & où, (2) Acteurs impliqués, (3) Contexte & date, (4) Enjeu / pourquoi c'est important, (5) Ton / fiabilité de la couverture. Style neutre, sans jargon, sans superlatifs. N'INVENTE AUCUN fait absent du texte source.`
      : `You are a journalist-analyst on Benin & West Africa. Write a COHERENT, structured, FACTUAL English summary (5-7 sentences, ~120 words): What & where, Who, Context & date, Why it matters, Coverage tone. Neutral, no invention.`;

    const meta = [
      `Titre: ${ev.title}`,
      ev.source ? `Source: ${ev.source}` : "",
      ev.published_at ? `Date: ${ev.published_at}` : "",
      ev.action_geo_fullname ? `Lieu: ${ev.action_geo_fullname}` : "",
      ev.context_type ? `Contexte GDELT: ${ev.context_type}` : "",
      ev.actor1_name || ev.actor2_name ? `Acteurs: ${[ev.actor1_name, ev.actor2_name].filter(Boolean).join(" / ")}` : "",
      ev.goldstein_scale != null ? `Goldstein: ${ev.goldstein_scale}` : "",
      ev.avg_tone != null ? `Tone: ${ev.avg_tone}` : "",
    ].filter(Boolean).join("\n");

    const userMsg = hasArticle
      ? `MÉTADONNÉES:\n${meta}\n\nARTICLE SOURCE (à résumer fidèlement):\n${article!.slice(0, 6000)}`
      : `MÉTADONNÉES GDELT (aucun article complet disponible) :\n${meta}`;

    try {
      const res = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        }),
      });
      if (!res.ok) {
        const fb = hasArticle ? article!.slice(0, 800) : ev.title;
        return { event: ev, summary: fb, cached: false, isArticle: hasArticle, hasArticle };
      }
      const j = await res.json();
      const summary = ((j.choices?.[0]?.message?.content as string) ?? ev.title).trim();
      await supabaseAdmin.from("events").update({ summary }).eq("id", ev.id);
      return { event: ev, summary, cached: false, isArticle: false, hasArticle };
    } catch {
      const fb = hasArticle ? article!.slice(0, 800) : ev.title;
      return { event: ev, summary: fb, cached: false, isArticle: hasArticle, hasArticle };
    }
  });

/** Fact-check IA : score de fiabilité 0-100 avec justification. */
export const factCheckEvent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    // Cache
    const { data: cached } = await supabaseAdmin
      .from("event_factchecks").select("*").eq("event_id", data.eventId).maybeSingle();
    if (cached) return { ...cached, cached: true };

    const { ev, article } = await loadEventWithArticle(data.eventId);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const sys = `Tu es un expert en vérification d'information et détection de désinformation (fact-checker). Analyse l'article fourni et évalue sa probabilité d'être vrai/fiable, en français.

Critères à considérer:
- Crédibilité de la source (domaine connu, média établi, blog, agrégateur, site obscur)
- Cohérence interne du texte
- Signaux de sensationnalisme, langage émotionnel, biais
- Présence ou absence d'attribution, citations, faits vérifiables
- Cohérence avec les métadonnées GDELT (acteurs, lieux, codes événement)
- Couverture médiatique (nombre de sources distinctes, mentions)

Réponds STRICTEMENT en JSON valide avec ce schéma:
{
 "verdict": "TRÈS PROBABLEMENT VRAI" | "PROBABLEMENT VRAI" | "INCERTAIN" | "PROBABLEMENT FAUX" | "TRÈS PROBABLEMENT FAUX",
 "confidence": <nombre 0-100, probabilité que l'info soit vraie>,
 "reasoning": "<3-5 phrases en français>",
 "red_flags": ["<drapeau 1>", "<drapeau 2>", ...]
}`;

    const userMsg = [
      `Titre: ${ev.title}`,
      `Source: ${ev.source} (${ev.source_url ?? "?"})`,
      `Date: ${ev.published_at}`,
      `Lieu: ${ev.action_geo_fullname ?? "?"}`,
      `Acteurs: ${[ev.actor1_name, ev.actor2_name].filter(Boolean).join(" / ") || "?"}`,
      `Goldstein: ${ev.goldstein_scale ?? "?"} | Tone: ${ev.avg_tone ?? "?"}`,
      `Couverture: ${ev.num_sources ?? "?"} sources, ${ev.num_mentions ?? "?"} mentions, ${ev.num_articles ?? "?"} articles`,
      article ? `\nContenu:\n${article.slice(0, 4000)}` : "(aucun contenu disponible)",
    ].join("\n");

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("Rate limit atteint, réessaie dans un instant.");
    if (res.status === 402) throw new Error("Crédits IA épuisés.");
    if (!res.ok) throw new Error(`fact-check failed ${res.status}`);
    const j = await res.json();
    const raw = (j.choices?.[0]?.message?.content as string) ?? "{}";
    let parsed: { verdict: string; confidence: number; reasoning: string; red_flags?: string[] };
    try { parsed = JSON.parse(raw); } catch { parsed = { verdict: "INCERTAIN", confidence: 50, reasoning: raw, red_flags: [] }; }
    const row = {
      event_id: data.eventId,
      verdict: String(parsed.verdict ?? "INCERTAIN"),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 50))),
      reasoning: String(parsed.reasoning ?? ""),
      red_flags: parsed.red_flags ?? [],
    };
    await supabaseAdmin.from("event_factchecks").upsert(row);

    // Auto-alerte désinformation si fiabilité faible
    if (row.confidence < 50) {
      const domain = (() => {
        try { return ev.source_url ? new URL(ev.source_url).hostname.replace(/^www\./, "") : (ev.source ?? "source inconnue"); }
        catch { return ev.source ?? "source inconnue"; }
      })();
      const level = row.confidence < 25 ? "critical" : "high";
      const msg = `Source : ${domain}${ev.action_geo_fullname ? ` · ${ev.action_geo_fullname}` : ""}\nVerdict IA : ${row.verdict} (${Math.round(row.confidence)}% de fiabilité)\n${row.reasoning.slice(0, 280)}`;
      const { data: existing } = await supabaseAdmin
        .from("alerts").select("id").eq("event_id", data.eventId).maybeSingle();
      if (!existing) {
        await supabaseAdmin.from("alerts").insert({
          event_id: data.eventId,
          level,
          title: `Possible désinformation — ${ev.title.slice(0, 90)}`,
          message: msg,
        });
      }
    }

    return { ...row, cached: false };
  });

/** Liste les alertes de désinformation avec source/domaine. */
export const getFakeNewsAlerts = createServerFn({ method: "GET" }).handler(async () => {
  const { data: alerts } = await supabaseAdmin
    .from("alerts")
    .select("id,level,title,message,created_at,event_id")
    .order("created_at", { ascending: false })
    .limit(30);
  const ids = (alerts ?? []).map((a) => a.event_id).filter(Boolean) as string[];
  let evMap = new Map<string, { source: string | null; source_url: string | null; action_geo_fullname: string | null }>();
  if (ids.length) {
    const { data: evs } = await supabaseAdmin
      .from("events").select("id,source,source_url,action_geo_fullname").in("id", ids);
    evMap = new Map((evs ?? []).map((e) => [e.id, e]));
  }
  return {
    alerts: (alerts ?? []).map((a) => {
      const ev = a.event_id ? evMap.get(a.event_id) : undefined;
      let domain: string = ev?.source ?? "—";
      try { if (ev?.source_url) domain = new URL(ev.source_url).hostname.replace(/^www\./, ""); } catch { /* */ }
      return { ...a, domain, location: ev?.action_geo_fullname ?? null, source_url: ev?.source_url ?? null };
    }),
  };
});

