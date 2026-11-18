import React from "react";
import type { SimulationSnapshot } from "@/lib/simulation/types";

export interface ResourceMonitorProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

export const ResourceMonitor: React.FC<ResourceMonitorProps> = ({ snapshot }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-600 shrink-0"
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
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Resource & Synchronization Monitor
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {snapshot.sharedVariables.length} Variables · {snapshot.locks.length} Locks ·{" "}
          {snapshot.semaphores.length} Semaphores
        </span>
      </div>

      {/* Grid of Resource Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Shared Memory Variables */}
        <div className="rounded-md border border-slate-200 bg-slate-50/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Shared Variables
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {snapshot.sharedVariables.length} Total
              </span>
            </div>

            {snapshot.sharedVariables.length > 0 ? (
              <div className="space-y-2">
                {snapshot.sharedVariables.map((v) => {
                  const isModified = v.currentValue !== v.initialValue;
                  return (
                    <div
                      key={v.id}
                      className="rounded border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{v.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Initial: {String(v.initialValue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs inline-block">
                            {String(v.currentValue)}
                          </span>
                        </div>
                      </div>
                      {isModified && (
                        <div className="text-[9.5px] text-blue-600 font-medium mt-1">
                          Value updated during simulation
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
        <div className="rounded-md border border-slate-200 bg-slate-50/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Mutex Locks
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {snapshot.locks.length} Total
              </span>
            </div>

            {snapshot.locks.length > 0 ? (
              <div className="space-y-2">
                {snapshot.locks.map((lock) => {
                  const isHeld = lock.ownerThreadId !== null;
                  return (
                    <div
                      key={lock.id}
                      className="rounded border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <div className="font-semibold text-slate-900">{lock.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{lock.id}</div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border shrink-0 ${
                            isHeld
                              ? "bg-amber-50 text-amber-800 border-amber-200 font-mono"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isHeld ? `Owner: ${lock.ownerThreadId}` : "FREE"}
                        </span>
                      </div>

                      {/* Lock Waiting Queue */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-500 font-medium">Waiting Queue:</span>
                        <span className="font-mono text-slate-700">
                          {lock.waitingQueue.length > 0
                            ? `[ ${lock.waitingQueue.join(", ")} ]`
                            : "[ Empty ]"}
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

        {/* 3. Counting & Binary Semaphores */}
        <div className="rounded-md border border-slate-200 bg-slate-50/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Semaphores
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {snapshot.semaphores.length} Total
              </span>
            </div>

            {snapshot.semaphores.length > 0 ? (
              <div className="space-y-2">
                {snapshot.semaphores.map((sem) => (
                  <div
                    key={sem.id}
                    className="rounded border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <div className="font-semibold text-slate-900">{sem.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Initial: {sem.initialValue}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shadow-2xs">
                        Count: {sem.currentValue}
                      </span>
                    </div>

                    {/* Semaphore Waiting Queue */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500 font-medium">Waiters:</span>
                      <span className="font-mono text-slate-700">
                        {sem.waitingQueue.length > 0
                          ? `[ ${sem.waitingQueue.join(", ")} ]`
                          : "[ None ]"}
                      </span>
                    </div>
                  </div>
                ))}
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
