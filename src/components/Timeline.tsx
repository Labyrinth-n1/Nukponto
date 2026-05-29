import { useI18n, timeAgo } from "@/lib/i18n";

interface E { id: string; title: string; published_at: string; category: string }

export function Timeline({ events }: { events: E[] }) {
  const { lang } = useI18n();
  const sorted = [...events].sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at)).slice(0, 10);
  return (
    <div className="panel p-5">
      <h3 className="mb-3 text-sm font-bold">Timeline</h3>
      <ol className="relative ml-2 border-l-2 border-dashed border-border">
        {sorted.map((e) => (
          <li key={e.id} className="mb-3 ml-4">
            <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-gradient-violet ring-2 ring-white" />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{timeAgo(e.published_at, lang)}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{e.category}</span>
            </div>
            <p className="mt-0.5 text-sm leading-tight">{e.title}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
