import React from "react";
import { StatMetric } from "@/types/dashboard";

interface StatCardProps {
  stat: StatMetric;
  icon?: React.ReactNode;
}

export function StatCard({ stat, icon }: StatCardProps) {
  return (
    <div className="lab-card p-5 flex items-center justify-between group hover:border-slate-300 hover:shadow-xs transition-all">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {stat.label}
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
          {stat.value}
        </div>
        {stat.subtext && (
          <div className="text-xs text-slate-500 font-medium">
            {stat.subtext}
          </div>
        )}
      </div>

      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200/80 transition-colors shadow-2xs">
          {icon}
        </div>
      )}
    </div>
  );
}
