"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogoIcon,
  OverviewIcon,
  ScenarioBuilderIcon,
  SimulationLabIcon,
  DeadlockAnalyzerIcon,
  ThreadMonitorIcon,
  ReportsIcon,
  SettingsIcon,
  SearchIcon,
  BellIcon,
} from "./icons";
import { NavItem } from "@/types/dashboard";

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    icon: "overview",
  },
  {
    id: "experiments",
    label: "Experiments",
    href: "/experiments",
    icon: "experiments",
  },
  {
    id: "simulation-lab",
    label: "Simulation Lab",
    href: "/simulation",
    icon: "simulation-lab",
  },
  {
    id: "deadlock-analyzer",
    label: "Deadlock Analyzer",
    href: "/deadlock-analyzer",
    icon: "deadlock-analyzer",
  },
  {
    id: "thread-monitor",
    label: "Thread Monitor",
    href: "/thread-monitor",
    icon: "thread-monitor",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: "reports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: "settings",
  },
];

export function TopNav() {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    if (href !== "#") {
      return pathname.startsWith(href);
    }
    return false;
  };

  const renderIcon = (iconName: string, active: boolean) => {
    const iconColor = active
      ? "text-blue-400"
      : "text-slate-400 group-hover:text-slate-200";

    switch (iconName) {
      case "overview":
        return <OverviewIcon size={16} className={iconColor} />;
      case "experiments":
        return <ScenarioBuilderIcon size={16} className={iconColor} />;
      case "simulation-lab":
        return <SimulationLabIcon size={16} className={iconColor} />;
      case "deadlock-analyzer":
        return <DeadlockAnalyzerIcon size={16} className={iconColor} />;
      case "thread-monitor":
        return <ThreadMonitorIcon size={16} className={iconColor} />;
      case "reports":
        return <ReportsIcon size={16} className={iconColor} />;
      case "settings":
        return <SettingsIcon size={16} className={iconColor} />;
      default:
        return <OverviewIcon size={16} className={iconColor} />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f172a] text-slate-200 border-b border-slate-800 shadow-xs">
      {/* Top Bar: Brand, Search, User Workspace */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800 text-blue-400 border border-slate-700/80">
              <LogoIcon size={18} className="text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">
                OS Failure Lab
              </span>
              <span className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/60">
                CS Lab
              </span>
            </div>
          </div>

          {/* Right Actions: Search, Notification, Student Workspace */}
          <div className="flex items-center gap-3">
            {/* Search Field */}
            <div className="relative hidden md:block w-52 lg:w-64">
              <label htmlFor="top-search" className="sr-only">
                Search
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <SearchIcon size={14} />
              </div>
              <input
                id="top-search"
                type="search"
                placeholder="Search experiments..."
                className="w-full rounded border border-slate-700 bg-slate-800/80 py-1 pl-8 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Notification */}
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-hidden"
              aria-label="Notifications"
            >
              <BellIcon size={16} />
            </button>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-800" aria-hidden="true" />

            {/* Student Workspace Identity */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 shrink-0">
                SW
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-300">
                Student Workspace
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Horizontal Navigation Tabs */}
      <div className="border-t border-slate-800/80 bg-[#0b1329]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            className="flex space-x-1 overflow-x-auto scrollbar-none py-1"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    active
                      ? "bg-slate-800/90 text-white border-b-2 border-blue-400 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-b-2 border-transparent"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {renderIcon(item.icon, active)}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
