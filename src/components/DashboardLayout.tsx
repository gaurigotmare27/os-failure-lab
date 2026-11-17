"use client";

import React from "react";
import { TopNav } from "./TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Redesigned Navigation Bar */}
      <TopNav />

      {/* Main Workspace Area (Natural centered container) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-7">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OS Failure Lab — Operating Systems Laboratory</span>
          <span className="text-slate-400 text-[11px]">
            Concurrency Failure Detection & Recovery
          </span>
        </div>
      </footer>
    </div>
  );
}
