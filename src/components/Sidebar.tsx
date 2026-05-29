import { Link } from "@tanstack/react-router";
import { LayoutDashboard, MessageSquare, Map, Bell, Settings, Radio, List, ScatterChart, Activity, BarChart3 } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="sticky top-4 mr-2 hidden h-[calc(100vh-2rem)] w-[76px] shrink-0 flex-col items-center justify-between rounded-3xl bg-gradient-violet py-5 shadow-violet md:flex">
      <div className="flex flex-col items-center gap-2">
        <Link to="/" className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Radio className="h-5 w-5 text-white" />
        </Link>
        <Link to="/" activeOptions={{ exact: true }} className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Dashboard">
          <LayoutDashboard className="h-5 w-5" />
        </Link>
        <Link to="/events" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Events">
          <List className="h-5 w-5" />
        </Link>
        <Link to="/clusters" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Clusters">
          <ScatterChart className="h-5 w-5" />
        </Link>
        <Link to="/stability" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Stability">
          <Activity className="h-5 w-5" />
        </Link>
        <Link to="/analytics" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Analytics">
          <BarChart3 className="h-5 w-5" />
        </Link>
        <Link to="/map" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Map">
          <Map className="h-5 w-5" />
        </Link>
        <Link to="/chat" className="sidebar-icon [&.active]:bg-white/20 [&.active]:text-white" title="Chat">
          <MessageSquare className="h-5 w-5" />
        </Link>
        <button className="sidebar-icon" aria-label="Alerts"><Bell className="h-5 w-5" /></button>
        <button className="sidebar-icon" aria-label="Settings"><Settings className="h-5 w-5" /></button>
      </div>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15">
        NP
      </div>
    </aside>
  );
}
