import React from "react";
import {
  LogoIcon,
  OverviewIcon,
  ScenarioBuilderIcon,
  SimulationLabIcon,
  DeadlockAnalyzerIcon,
  ThreadMonitorIcon,
  ReportsIcon,
  SettingsIcon,
  CloseIcon,
} from "./icons";
import { NavItem } from "@/types/dashboard";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "#",
    icon: "overview",
    isActive: true,
  },
  {
    id: "experiments",
    label: "Experiments",
    href: "#",
    icon: "experiments",
  },
  {
    id: "simulation-lab",
    label: "Simulation Lab",
    href: "#",
    icon: "simulation-lab",
  },
  {
    id: "deadlock-analyzer",
    label: "Deadlock Analyzer",
    href: "#",
    icon: "deadlock-analyzer",
  },
  {
    id: "thread-monitor",
    label: "Thread Monitor",
    href: "#",
    icon: "thread-monitor",
  },
  {
    id: "reports",
    label: "Reports",
    href: "#",
    icon: "reports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "#",
    icon: "settings",
  },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconColor = isActive
      ? "text-blue-400"
      : "text-slate-400 group-hover:text-slate-200";

    switch (iconName) {
      case "overview":
        return <OverviewIcon size={18} className={iconColor} />;
      case "experiments":
        return <ScenarioBuilderIcon size={18} className={iconColor} />;
      case "simulation-lab":
        return <SimulationLabIcon size={18} className={iconColor} />;
      case "deadlock-analyzer":
        return <DeadlockAnalyzerIcon size={18} className={iconColor} />;
      case "thread-monitor":
        return <ThreadMonitorIcon size={18} className={iconColor} />;
      case "reports":
        return <ReportsIcon size={18} className={iconColor} />;
      case "settings":
        return <SettingsIcon size={18} className={iconColor} />;
      default:
        return <OverviewIcon size={18} className={iconColor} />;
    }
  };

  const content = (
    <div className="flex h-full w-60 flex-col justify-between bg-[#0f172a] text-slate-200 border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-blue-400 border border-slate-700/80">
              <LogoIcon size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">
                OS Failure Lab
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Concurrency Lab
              </div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden"
              aria-label="Close sidebar"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-4">
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Lab Modules
            </div>
            <nav className="space-y-0.5" aria-label="Core Navigation">
              {navItems.slice(0, 3).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                    item.isActive
                      ? "bg-slate-800 text-white font-medium border-l-2 border-blue-500 pl-2.5"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {renderIcon(item.icon, !!item.isActive)}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Analysis & Logs
            </div>
            <nav className="space-y-0.5" aria-label="Analysis Navigation">
              {navItems.slice(3, 6).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                    item.isActive
                      ? "bg-slate-800 text-white font-medium border-l-2 border-blue-500 pl-2.5"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {renderIcon(item.icon, !!item.isActive)}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              System
            </div>
            <nav className="space-y-0.5" aria-label="System Navigation">
              {navItems.slice(6).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                    item.isActive
                      ? "bg-slate-800 text-white font-medium border-l-2 border-blue-500 pl-2.5"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {renderIcon(item.icon, !!item.isActive)}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Lab Context */}
      <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-medium text-slate-300">POSIX Threading Model</div>
        <div className="text-slate-400 text-[10px] mt-0.5">
          Student Simulation Environment
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-60 max-w-[calc(100vw-3rem)] bg-[#0f172a] shadow-xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
