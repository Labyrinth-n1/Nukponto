import { ExternalLink } from "lucide-react";
import { useI18n, timeAgo } from "@/lib/i18n";

type Cat = "disinformation" | "propaganda" | "satire" | "reliable" | "unverified";
interface Event {
  id: string; title: string; summary: string | null; content: string | null;
  source: string; source_url: string | null; category: Cat;
  published_at: string; location_name: string | null; sentiment: number | null;
}

const catChip: Record<Cat, string> = {
  disinformation: "bg-destructive/10 text-destructive",
  propaganda: "bg-coral/10 text-coral",
  satire: "bg-amber-glow/20 text-foreground",
  reliable: "bg-stable/15 text-stable",
  unverified: "bg-muted text-muted-foreground",
};

export function EventFeed({ events }: { events: Event[] }) {
  const { t, lang } = useI18n();
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{t("feed.title")}</h3>
        <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-stable text-stable" />
      </div>
      <ul className="-mx-1 max-h-[520px] space-y-2 overflow-auto pr-1">
        {events.map((e) => (
          <li key={e.id} className="rounded-2xl border border-border/60 bg-white/70 p-3 transition hover:bg-white">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-violet text-[10px] font-bold text-white">
                {e.source.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${catChip[e.category]}`}>
                    {t(`categories.${e.category}` as const)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.source}</span>
                  <span className="text-[10px] text-muted-foreground">· {timeAgo(e.published_at, lang)}</span>
                  {e.location_name && <span className="text-[10px] text-muted-foreground">· {e.location_name}</span>}
                </div>
                <p className="text-sm font-medium leading-snug">{e.title}</p>
                {e.summary && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{e.summary}</p>}
              </div>
              {e.source_url && (
                <a href={e.source_url} target="_blank" rel="noreferrer" className="mt-1 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
