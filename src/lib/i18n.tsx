import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

const dict = {
  fr: {
    "app.name": "Nukponto",
    "app.tagline": "Veille IA & analyse géopolitique du Bénin",
    "nav.dashboard": "Tableau de bord",
    "nav.chat": "Assistant IA",
    "stability.title": "Score de stabilité",
    "stability.state.stable": "Stable",
    "stability.state.tension": "Tension",
    "stability.state.crisis": "Crise",
    "stability.last7": "7 derniers jours",
    "alerts.title": "Alertes critiques",
    "alerts.empty": "Aucune alerte active.",
    "alerts.level.low": "faible",
    "alerts.level.moderate": "modérée",
    "alerts.level.high": "élevée",
    "alerts.level.critical": "critique",
    "feed.title": "Flux en temps réel",
    "feed.source": "Source",
    "narratives.title": "Narratifs détectés",
    "narratives.events": "événements",
    "narratives.suspicion": "Suspicion",
    "map.title": "Carte des événements",
    "categories.disinformation": "Désinformation",
    "categories.propaganda": "Propagande",
    "categories.satire": "Satire",
    "categories.reliable": "Fiable",
    "categories.unverified": "Non vérifié",
    "chat.title": "Assistant Nukponto",
    "chat.subtitle": "Posez vos questions sur la situation au Bénin. Réponses basées sur le corpus surveillé.",
    "chat.placeholder": "Ex : Quelles désinformations ont circulé cette semaine ?",
    "chat.send": "Envoyer",
    "chat.thinking": "Analyse en cours…",
    "chat.empty": "Démarrez la conversation.",
    "common.refresh": "Actualiser",
    "common.viewAll": "Tout voir",
    "common.ago": "il y a",
    "common.minute": "min",
    "common.hour": "h",
    "common.day": "j",
    "ingest.btn": "Ingérer GDELT",
    "ingest.running": "Ingestion…",
    "ingest.done": "Ingestion terminée",
  },
  en: {
    "app.name": "Nukponto",
    "app.tagline": "AI watch & geopolitical analysis for Benin",
    "nav.dashboard": "Dashboard",
    "nav.chat": "AI Assistant",
    "stability.title": "Stability score",
    "stability.state.stable": "Stable",
    "stability.state.tension": "Tension",
    "stability.state.crisis": "Crisis",
    "stability.last7": "Last 7 days",
    "alerts.title": "Critical alerts",
    "alerts.empty": "No active alerts.",
    "alerts.level.low": "low",
    "alerts.level.moderate": "moderate",
    "alerts.level.high": "high",
    "alerts.level.critical": "critical",
    "feed.title": "Live feed",
    "feed.source": "Source",
    "narratives.title": "Detected narratives",
    "narratives.events": "events",
    "narratives.suspicion": "Suspicion",
    "map.title": "Event map",
    "categories.disinformation": "Disinformation",
    "categories.propaganda": "Propaganda",
    "categories.satire": "Satire",
    "categories.reliable": "Reliable",
    "categories.unverified": "Unverified",
    "chat.title": "Nukponto assistant",
    "chat.subtitle": "Ask about the situation in Benin. Answers grounded in the monitored corpus.",
    "chat.placeholder": "e.g. What disinformation circulated this week?",
    "chat.send": "Send",
    "chat.thinking": "Analyzing…",
    "chat.empty": "Start the conversation.",
    "common.refresh": "Refresh",
    "common.viewAll": "View all",
    "common.ago": "",
    "common.minute": "m ago",
    "common.hour": "h ago",
    "common.day": "d ago",
    "ingest.btn": "Ingest GDELT",
    "ingest.running": "Ingesting…",
    "ingest.done": "Ingestion complete",
  },
} as const;

type Key = keyof typeof dict.fr;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "fr",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("nukponto.lang") as Lang | null) : null;
    if (stored === "fr" || stored === "en") setLang(stored);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("nukponto.lang", lang);
  }, [lang]);
  const t = (k: Key) => dict[lang][k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export function timeAgo(date: string | Date, lang: Lang) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 60) return lang === "fr" ? `il y a ${min} min` : `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return lang === "fr" ? `il y a ${h} h` : `${h}h ago`;
  const days = Math.floor(h / 24);
  return lang === "fr" ? `il y a ${days} j` : `${days}d ago`;
}
