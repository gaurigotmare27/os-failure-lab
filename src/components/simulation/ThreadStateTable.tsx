import React from "react";
import type { SimulationSnapshot, ThreadDefinition, ThreadState } from "@/lib/simulation/types";

export interface ThreadStateTableProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

/**
 * State badge rendering with clear visual indicators for all thread states:
 * RUNNING, READY, BLOCKED, DONE, and NEW.
 */
export function ThreadStateBadge({ state }: { state: ThreadState }) {
  switch (state) {
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          RUNNING
        </span>
      );
    case "READY":
      return (
        <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          READY
        </span>
      );
    case "BLOCKED":
      return (
        <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          BLOCKED
        </span>
      );
    case "DONE":
      return (
        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          DONE
        </span>
      );
    case "NEW":
    default:
      return (
        <span className="inline-flex items-center rounded bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
          NEW
        </span>
      );
  }
}

/**
 * ThreadStateTable Component
 *
 * Displays deterministic thread states, priorities, active instructions,
 * and lock ownership derived directly from the active simulation snapshot.
 */
export const ThreadStateTable: React.FC<ThreadStateTableProps> = ({ snapshot }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
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
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Thread State Monitor
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Ready Queue:</span>
          <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {snapshot.readyQueue.length > 0
              ? `[ ${snapshot.readyQueue.join(", ")} ]`
              : "[ Empty ]"}
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
              <th className="py-2.5 px-3">Thread ID</th>
              <th className="py-2.5 px-3">Thread Name</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Current Operation</th>
              <th className="py-2.5 px-3">Held Locks</th>
              <th className="py-2.5 px-3">Local Registers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {snapshot.threads.map((thread: ThreadDefinition) => {
              const isActive = thread.id === snapshot.activeThreadId;
              const currentOp = thread.operations[thread.currentOperationIndex];
              const registers = snapshot.threadRegisters[thread.id] || {};
              const regEntries = Object.entries(registers);

              return (
                <tr
                  key={thread.id}
                  className={`transition-colors ${
                    isActive ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Thread ID */}
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                    <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                      {thread.id}
                    </span>
                  </td>

                  {/* Thread Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{thread.name}</div>
                    {isActive && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        Active on CPU
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    <span className="inline-block rounded bg-slate-50 px-1.5 py-0.5 border border-slate-200">
                      {thread.priority}
                    </span>
                  </td>

                  {/* State */}
                  <td className="py-2.5 px-3">
                    <ThreadStateBadge state={thread.state} />
                    {thread.state === "BLOCKED" && thread.waitingReason && (
                      <div className="text-[10px] text-amber-800 mt-1 max-w-xs leading-tight">
                        {thread.waitingReason}
                      </div>
                    )}
                  </td>

                  {/* Current Operation */}
                  <td className="py-2.5 px-3 max-w-xs">
                    {currentOp ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-blue-600">
                            [{currentOp.type}]
                          </span>
                          <span className="text-slate-700 truncate font-medium">
                            {currentOp.description}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Instruction {thread.currentOperationIndex + 1} of{" "}
                          {thread.operations.length}
                          {currentOp.duration && currentOp.duration > 1 && (
                            <span className="ml-1 text-slate-500">
                              ({currentOp.duration} ticks)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Completed all instructions
                      </span>
                    )}
                  </td>

                  {/* Held Locks */}
                  <td className="py-2.5 px-3">
                    {thread.heldLocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {thread.heldLocks.map((lockId) => (
                          <span
                            key={lockId}
                            className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200"
                          >
                            {lockId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Local Registers */}
                  <td className="py-2.5 px-3">
                    {regEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                        {regEntries.map(([reg, val]) => (
                          <span
                            key={reg}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 border border-slate-200 text-[10px]"
                          >
                            {reg}={String(val)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
