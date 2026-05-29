import { Search, Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("app.name")}</div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm shadow-soft backdrop-blur lg:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search…" className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <button className="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-border bg-white/70 text-foreground shadow-soft backdrop-blur">
          <Bell className="h-4 w-4" />
        </button>
        <LanguageSwitcher />
        {actions}
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-violet text-xs font-bold text-white shadow-violet">NP</div>
      </div>
    </div>
  );
}

