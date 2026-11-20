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
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          RUNNING
        </span>
      );
    case "READY":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          READY
        </span>
      );
    case "BLOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          BLOCKED
        </span>
      );
    case "DONE":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          DONE
        </span>
      );
    case "NEW":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
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
 * Responsive: Desktop table view + Mobile stacked cards (Zero horizontal scroll).
 */
export const ThreadStateTable: React.FC<ThreadStateTableProps> = ({ snapshot }) => {
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
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Thread State Monitor
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <span className="font-semibold text-slate-500">Ready Queue:</span>
          <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            {snapshot.readyQueue.length > 0
              ? `[ ${snapshot.readyQueue.join(", ")} ]`
              : "[ Empty ]"}
          </span>
        </div>
      </div>

      {/* Desktop / Laptop Table Layout */}
      <div className="hidden md:block w-full">
        <table className="w-full text-left text-sm border-collapse table-auto">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Thread ID</th>
              <th className="py-3 px-4">Thread Name</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4">Current Operation</th>
              <th className="py-3 px-4">Held Locks</th>
              <th className="py-3 px-4">Local Registers</th>
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
                    isActive ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* Thread ID */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {thread.id}
                    </span>
                  </td>

                  {/* Thread Name */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{thread.name}</div>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                        Active on CPU
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold border border-slate-200">
                      {thread.priority}
                    </span>
                  </td>

                  {/* State */}
                  <td className="py-3 px-4">
                    <ThreadStateBadge state={thread.state} />
                    {thread.state === "BLOCKED" && thread.waitingReason && (
                      <div className="text-xs text-amber-800 mt-1 max-w-xs leading-normal font-medium">
                        {thread.waitingReason}
                      </div>
                    )}
                  </td>

                  {/* Current Operation */}
                  <td className="py-3 px-4 max-w-xs">
                    {currentOp ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            [{currentOp.type}]
                          </span>
                          <span className="text-slate-800 truncate font-medium text-xs">
                            {currentOp.description}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Op {thread.currentOperationIndex + 1} of{" "}
                          {thread.operations.length}
                          {currentOp.duration && currentOp.duration > 1 && (
                            <span className="ml-1 text-slate-600 font-medium">
                              ({currentOp.duration} ticks)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        Completed all instructions
                      </span>
                    )}
                  </td>

                  {/* Held Locks */}
                  <td className="py-3 px-4">
                    {thread.heldLocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {thread.heldLocks.map((lockId) => (
                          <span
                            key={lockId}
                            className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200"
                          >
                            {lockId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Local Registers */}
                  <td className="py-3 px-4">
                    {regEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                        {regEntries.map(([reg, val]) => (
                          <span
                            key={reg}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-800 border border-slate-200 font-semibold"
                          >
                            {reg}={String(val)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Stacked Cards (Zero Horizontal Overflow) */}
      <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
        {snapshot.threads.map((thread: ThreadDefinition) => {
          const isActive = thread.id === snapshot.activeThreadId;
          const currentOp = thread.operations[thread.currentOperationIndex];
          const registers = snapshot.threadRegisters[thread.id] || {};
          const regEntries = Object.entries(registers);

          return (
            <div
              key={thread.id}
              className={`p-3.5 rounded-lg border ${
                isActive
                  ? "bg-blue-50/50 border-blue-200"
                  : "bg-slate-50/50 border-slate-200"
              } space-y-2.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {thread.id}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {thread.name}
                  </span>
                </div>
                <ThreadStateBadge state={thread.state} />
              </div>

              {isActive && (
                <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Currently executing on CPU
                </div>
              )}

              {thread.state === "BLOCKED" && thread.waitingReason && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                  {thread.waitingReason}
                </div>
              )}

              <div className="text-xs space-y-1 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Priority:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {thread.priority}
                  </span>
                </div>

                <div className="text-slate-600">
                  <span className="font-medium text-slate-500 block mb-0.5">
                    Current Op:
                  </span>
                  {currentOp ? (
                    <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          [{currentOp.type}]
                        </span>
                        <span className="font-medium text-slate-800">
                          {currentOp.description}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Instruction {thread.currentOperationIndex + 1} of{" "}
                        {thread.operations.length}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span className="font-medium text-slate-500">Held Locks:</span>
                  <span>
                    {thread.heldLocks.length > 0 ? (
                      <span className="font-bold text-amber-800">
                        {thread.heldLocks.join(", ")}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span className="font-medium text-slate-500">Registers:</span>
                  <span>
                    {regEntries.length > 0 ? (
                      <span className="font-mono font-semibold text-slate-800">
                        {regEntries.map(([r, v]) => `${r}=${v}`).join(", ")}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
