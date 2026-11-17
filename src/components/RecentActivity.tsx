import React from "react";
import { ClockIcon } from "./icons";

export function RecentActivity() {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
          Recent Activity
        </h3>
        <p className="text-xs text-slate-500">
          Simulation run history and failure detection logs
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50/50 py-7 px-4 text-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-2xs">
          <ClockIcon size={16} className="text-slate-500" />
        </div>
        <div className="mt-2 text-xs font-medium text-slate-800">
          No simulations run yet.
        </div>
        <p className="mt-0.5 text-xs text-slate-500 max-w-xs">
          Start your first experiment to see activity here.
        </p>
      </div>
    </div>
  );
}
