import { useI18n, type Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const opts: Lang[] = ["fr", "en"];
  return (
    <div className="inline-flex rounded-full border border-border bg-white/70 p-0.5 text-xs font-semibold shadow-soft backdrop-blur">
      {opts.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1.5 uppercase tracking-wider transition ${
            lang === l ? "bg-gradient-violet text-white shadow-violet" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
