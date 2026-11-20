import React from "react";
import Link from "next/link";
import { QuickStartExperiment } from "@/types/dashboard";
import { PlayCircleIcon } from "./icons";

interface QuickStartCardProps {
  experiment: QuickStartExperiment;
  icon?: React.ReactNode;
}

export function QuickStartCard({ experiment, icon }: QuickStartCardProps) {
  const getScenarioQuery = (id: string) => {
    switch (id) {
      case "exp-shared-counter":
        return "scenario-race-condition";
      case "exp-two-thread-deadlock":
        return "scenario-two-thread-deadlock";
      case "exp-producer-consumer":
      default:
        return "scenario-producer-consumer";
    }
  };

  const targetUrl = `/simulation?scenario=${getScenarioQuery(experiment.id)}`;

  return (
    <div className="lab-card p-5 flex flex-col justify-between group hover:border-slate-300 hover:shadow-xs transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200/60">
            {experiment.category}
          </span>
          <span className="text-xs font-mono font-medium text-slate-500">
            {experiment.threads}
          </span>
        </div>

        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/70 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              {experiment.title}
            </h4>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              {experiment.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-end">
        <Link
          href={targetUrl}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all shadow-2xs"
        >
          <PlayCircleIcon size={14} className="text-blue-600" />
          <span>Launch Scenario</span>
        </Link>
      </div>
    </div>
  );
}
