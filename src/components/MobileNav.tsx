import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, MessageSquare, Map, Radio, List, ScatterChart, Activity, BarChart3, Menu, X } from "lucide-react";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const ITEMS: Item[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/events", label: "Events", icon: List },
  { to: "/clusters", label: "Clusters", icon: ScatterChart },
  { to: "/stability", label: "Stability", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/map", label: "Map", icon: Map },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white/70 text-foreground shadow-soft backdrop-blur md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-gradient-violet p-5 shadow-violet">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Radio className="h-4 w-4" />
                </div>
                <span className="font-display text-sm font-semibold">Nukponto</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {ITEMS.map((it) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to as "/"}
                    activeOptions={it.exact ? { exact: true } : undefined}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 [&.active]:bg-white/20 [&.active]:text-white"
                  >
                    <Icon className="h-4 w-4" /> {it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
