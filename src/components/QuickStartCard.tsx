import React from "react";
import { QuickStartExperiment } from "@/types/dashboard";
import { PlayCircleIcon } from "./icons";

interface QuickStartCardProps {
  experiment: QuickStartExperiment;
  icon?: React.ReactNode;
}

export function QuickStartCard({ experiment, icon }: QuickStartCardProps) {
  return (
    <div className="flex flex-col justify-between rounded border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
            {experiment.category}
          </span>
          <span className="text-[11px] text-slate-400">
            {experiment.threads}
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          {icon && (
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-50 text-slate-700">
              {icon}
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              {experiment.title}
            </h4>
            <p className="mt-1 text-xs text-slate-600 leading-normal">
              {experiment.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <PlayCircleIcon size={12} className="text-slate-600" />
          <span>Open Scenario</span>
        </button>
      </div>
    </div>
  );
}
