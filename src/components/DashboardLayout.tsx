"use client";

import React from "react";
import { TopNav } from "./TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Redesigned Navigation Bar */}
      <TopNav />

      {/* Main Content Workspace Container */}
      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Modernized Academic Platform Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 no-print">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-800">
              OS Failure Lab
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Operating Systems Laboratory for Concurrency & Synchronization
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Discrete-Event Engine v1.0
            </span>
            <span className="text-slate-400 text-[11px]">
              POSIX Concurrency Model
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
