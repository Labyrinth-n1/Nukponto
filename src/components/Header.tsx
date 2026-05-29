import { Link } from "@tanstack/react-router";
import { Activity, MessageSquare, Radio } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-md bg-gradient-ember shadow-ember">
            <Radio className="h-4 w-4 text-ember-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold tracking-tight">{t("app.name")}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground [&.active]:bg-surface-2 [&.active]:text-foreground"
          >
            <Activity className="h-3.5 w-3.5" /> {t("nav.dashboard")}
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground [&.active]:bg-surface-2 [&.active]:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" /> {t("nav.chat")}
          </Link>
          <div className="mx-2 h-5 w-px bg-border" />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
