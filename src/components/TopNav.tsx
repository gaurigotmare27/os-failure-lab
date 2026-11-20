"use client";

import React, { useState } from "react";
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
  MenuIcon,
  CloseIcon,
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
    label: "Reports & Analytics",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      : "text-slate-400 group-hover:text-slate-200 transition-colors";

    switch (iconName) {
      case "overview":
        return <OverviewIcon size={17} className={iconColor} />;
      case "experiments":
        return <ScenarioBuilderIcon size={17} className={iconColor} />;
      case "simulation-lab":
        return <SimulationLabIcon size={17} className={iconColor} />;
      case "deadlock-analyzer":
        return <DeadlockAnalyzerIcon size={17} className={iconColor} />;
      case "thread-monitor":
        return <ThreadMonitorIcon size={17} className={iconColor} />;
      case "reports":
        return <ReportsIcon size={17} className={iconColor} />;
      case "settings":
        return <SettingsIcon size={17} className={iconColor} />;
      default:
        return <OverviewIcon size={17} className={iconColor} />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#090d16] text-slate-200 border-b border-slate-800 shadow-md">
      {/* Upper Navigation Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-hidden"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-600/30 group-hover:border-blue-500/50 transition-all shadow-inner">
                <LogoIcon size={20} className="text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tracking-tight">
                    OS Failure Lab
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-slate-800/90 px-2 py-0.5 text-xs font-semibold text-blue-300 border border-slate-700/80">
                    CS Lab
                  </span>
                </div>
                <span className="hidden md:block text-[11px] text-slate-400 font-normal tracking-wide">
                  Concurrency Failure & Recovery Simulator
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header Elements: Search, Notifications, User Workspace, Mobile Menu Button */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Search Input (Desktop) */}
            <div className="relative hidden md:block w-56 lg:w-72">
              <label htmlFor="top-search" className="sr-only">
                Search experiments
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <SearchIcon size={15} />
              </div>
              <input
                id="top-search"
                type="search"
                placeholder="Search experiments, locks..."
                className="w-full rounded-lg border border-slate-700/80 bg-slate-800/70 py-1.5 pl-9 pr-12 text-xs font-medium text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <kbd className="hidden lg:inline-flex rounded border border-slate-700 bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-hidden"
              aria-label="View notifications"
            >
              <BellIcon size={18} />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-800 hidden sm:block" aria-hidden="true" />

            {/* Student Workspace Identity */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-xs font-bold text-slate-200 border border-slate-600 shadow-xs shrink-0">
                SW
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  Student Workspace
                </span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Engine Ready
                </span>
              </div>
            </div>

            {/* Mobile Navigation Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Navigation Links */}
      <div className="border-t border-slate-800/90 bg-[#070b14] hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center space-x-1 py-1.5"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium rounded-md transition-all ${
                    active
                      ? "bg-slate-800 text-white font-semibold shadow-xs border-b-2 border-blue-400"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-b-2 border-transparent"
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

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#070b14] px-4 py-4 space-y-3">
          {/* Mobile Search */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon size={15} />
            </div>
            <input
              type="search"
              placeholder="Search experiments, locks..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-3 text-xs font-medium text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Navigation Links List */}
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "bg-slate-800 text-white font-semibold border-l-3 border-blue-400"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {renderIcon(item.icon, active)}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Workspace Identifier */}
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-200 border border-slate-700">
                SW
              </div>
              <span className="font-medium text-slate-300">Student Workspace</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">Engine Ready</span>
          </div>
        </div>
      )}
    </header>
  );
}
