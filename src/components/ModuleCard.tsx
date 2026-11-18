import React from "react";
import Link from "next/link";
import { LearningModule } from "@/types/dashboard";
import { ArrowRightIcon } from "./icons";

interface ModuleCardProps {
  module: LearningModule;
  icon?: React.ReactNode;
}

export function ModuleCard({ module, icon }: ModuleCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {module.code}
          </span>
          {icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-50 text-slate-600 border border-slate-100">
              {icon}
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-slate-900">
          {module.title}
        </h3>

        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          {module.description}
        </p>

        {module.concepts && module.concepts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {module.concepts.map((concept) => (
              <span
                key={concept}
                className="inline-block rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200/60"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
        <Link
          href={`/modules/${module.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>Explore Module</span>
          <ArrowRightIcon size={12} className="text-blue-600" />
        </Link>
      </div>
    </div>
  );
}
