import React from "react";
import { SearchIcon, BellIcon, MenuIcon, ChevronRightIcon } from "./icons";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open mobile menu"
        >
          <MenuIcon size={18} />
        </button>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 truncate"
        >
          <span className="text-slate-600 font-medium">OS Failure Lab</span>
          <ChevronRightIcon size={12} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900">Overview</span>
        </nav>
      </div>

      {/* Right: Search, Notification, Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Search Field */}
        <div className="relative hidden sm:block w-52 lg:w-64">
          <label htmlFor="dashboard-search" className="sr-only">
            Search
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <SearchIcon size={14} />
          </div>
          <input
            id="dashboard-search"
            type="search"
            placeholder="Search experiments, locks..."
            className="w-full rounded border border-slate-200 bg-slate-50 py-1 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-hidden"
          aria-label="Notifications"
        >
          <BellIcon size={16} />
        </button>

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-slate-200" aria-hidden="true" />

        {/* User Identity: Student Workspace */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 shrink-0">
            SW
          </div>
          <span className="text-xs font-medium text-slate-800">
            Student Workspace
          </span>
        </div>
      </div>
    </header>
  );
}
