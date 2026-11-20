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
    <div className="lab-card p-5 flex flex-col justify-between group hover:border-slate-300 hover:shadow-xs transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-blue-700 border border-blue-200/80">
            {module.code}
          </span>
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200/80 transition-colors">
              {icon}
            </div>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
          {module.title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {module.description}
        </p>

        {module.concepts && module.concepts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {module.concepts.map((concept) => (
              <span
                key={concept}
                className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/80"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
        <Link
          href={`/modules/${module.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
        >
          <span>Explore Module</span>
          <ArrowRightIcon size={14} className="text-blue-600" />
        </Link>
      </div>
    </div>
  );
}
