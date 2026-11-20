import React from "react";
import { ClockIcon } from "./icons";

export function RecentActivity() {
  return (
    <div className="lab-card p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Recent Activity
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulation run traces and concurrency anomaly logs
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-8 px-4 text-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-2xs mb-2.5">
          <ClockIcon size={18} className="text-slate-500" />
        </div>
        <div className="text-sm font-semibold text-slate-800">
          No simulations run yet
        </div>
        <p className="mt-1 text-xs text-slate-500 max-w-xs leading-normal">
          Execute a lab scenario to view real-time traces and state snapshots.
        </p>
      </div>
    </div>
  );
}
