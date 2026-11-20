import React from "react";
import type { SimulationSnapshot } from "@/lib/simulation/types";

export interface ResourceMonitorProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({ snapshot }) => {
  return (
    <div className="lab-card overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-4 h-4 text-slate-700 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Resource & Synchronization Monitor
          </h2>
        </div>
        <span className="text-xs text-slate-600 font-mono">
          {snapshot.sharedVariables.length} Variables · {snapshot.locks.length} Locks ·{" "}
          {snapshot.semaphores.length} Semaphores
        </span>
      </div>

      {/* Grid of Resource Cards */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Shared Memory Variables */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Shared Variables
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {snapshot.sharedVariables.length} Total
              </span>
            </div>

            {snapshot.sharedVariables.length > 0 ? (
              <div className="space-y-2.5">
                {snapshot.sharedVariables.map((v) => {
                  const isModified = v.currentValue !== v.initialValue;
                  return (
                    <div
                      key={v.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{v.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Initial: {String(v.initialValue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs inline-block">
                            {String(v.currentValue)}
                          </span>
                        </div>
                      </div>
                      {isModified && (
                        <div className="text-xs text-blue-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Value modified during execution
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-6 text-center">
                No shared memory variables configured.
              </div>
            )}
          </div>
        </div>

        {/* 2. Mutex Locks */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Mutex Locks
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {snapshot.locks.length} Total
              </span>
            </div>

            {snapshot.locks.length > 0 ? (
              <div className="space-y-2.5">
                {snapshot.locks.map((l) => {
                  const isOwned = l.ownerThreadId !== null;
                  const hasWaiters = l.waitingQueue.length > 0;
                  return (
                    <div
                      key={l.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{l.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            ID: {l.id}
                          </div>
                        </div>
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                            isOwned
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isOwned ? `Held by ${l.ownerThreadId}` : "FREE"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between font-mono">
                        <span className="text-slate-500">Waiters:</span>
                        <span className={hasWaiters ? "font-bold text-amber-800" : "text-slate-400"}>
                          {hasWaiters ? `[ ${l.waitingQueue.join(", ")} ]` : "[ None ]"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-6 text-center">
                No mutex locks configured.
              </div>
            )}
          </div>
        </div>

        {/* 3. Semaphores */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Semaphores
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {snapshot.semaphores.length} Total
              </span>
            </div>

            {snapshot.semaphores.length > 0 ? (
              <div className="space-y-2.5">
                {snapshot.semaphores.map((s) => {
                  const hasWaiters = s.waitingQueue.length > 0;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{s.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Initial: {s.initialValue}
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                          S = {s.currentValue}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between font-mono">
                        <span className="text-slate-500">Waiters:</span>
                        <span className={hasWaiters ? "font-bold text-teal-800" : "text-slate-400"}>
                          {hasWaiters ? `[ ${s.waitingQueue.join(", ")} ]` : "[ None ]"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-6 text-center">
                No semaphores configured.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
