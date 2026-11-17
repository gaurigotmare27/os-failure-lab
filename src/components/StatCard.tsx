import React from "react";
import { StatMetric } from "@/types/dashboard";

interface StatCardProps {
  stat: StatMetric;
  icon?: React.ReactNode;
}

export function StatCard({ stat, icon }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-3 shadow-2xs hover:border-slate-300 transition-colors">
      <div>
        <div className="text-xs text-slate-500">{stat.label}</div>
        <div className="mt-0.5 text-xl font-bold text-slate-900 tracking-tight">
          {stat.value}
        </div>
        {stat.subtext && (
          <div className="text-[10px] text-slate-400 mt-0.5">{stat.subtext}</div>
        )}
      </div>
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-50 text-slate-600 border border-slate-100">
          {icon}
        </div>
      )}
    </div>
  );
}
