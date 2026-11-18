import React, { useState, useMemo } from "react";
import type { SimulationSnapshot, TraceEvent, TraceEventType } from "@/lib/simulation/types";

export interface EventLogProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

/**
 * Event type pill badge styling for discrete OS trace events.
 */
function EventTypeBadge({ type }: { type: TraceEventType }) {
  switch (type) {
    case "DEADLOCK_DETECTED":
      return (
        <span className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300">
          DEADLOCK
        </span>
      );
    case "LOCK_BLOCKED":
    case "SEMAPHORE_WAIT":
      return (
        <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
          BLOCKED
        </span>
      );
    case "LOCK_ACQUIRED":
      return (
        <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
          LOCK ACQ
        </span>
      );
    case "LOCK_RELEASED":
      return (
        <span className="inline-block rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200">
          LOCK REL
        </span>
      );
    case "SEMAPHORE_SIGNAL":
      return (
        <span className="inline-block rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200">
          SIGNAL
        </span>
      );
    case "CONTEXT_SWITCH":
      return (
        <span className="inline-block rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
          DISPATCH
        </span>
      );
    case "STATE_CHANGE":
      return (
        <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
          STATE CHG
        </span>
      );
    case "MEMORY_READ":
      return (
        <span className="inline-block rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 border border-cyan-200">
          READ
        </span>
      );
    case "MEMORY_WRITE":
      return (
        <span className="inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
          WRITE
        </span>
      );
    case "OPERATION_START":
    case "OPERATION_COMPLETE":
      return (
        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
          OP
        </span>
      );
    case "STEP_LIMIT":
    default:
      return (
        <span className="inline-block rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
          {type.replace("_", " ")}
        </span>
      );
  }
}

export const EventLog: React.FC<EventLogProps> = ({ snapshot }) => {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Thread ID to name resolver
  const threadMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of snapshot.threads) {
      map.set(t.id, t.name);
    }
    return map;
  }, [snapshot.threads]);

  // Indexed events with chronological sequence numbers
  const indexedEvents = useMemo(() => {
    return snapshot.eventTrace.map((evt: TraceEvent, index: number) => ({
      ...evt,
      sequenceNumber: index + 1,
      threadName:
        evt.threadId === "system"
          ? "System Kernel"
          : threadMap.get(evt.threadId) ?? evt.threadId,
    }));
  }, [snapshot.eventTrace, threadMap]);

  // Display ordering
  const displayedEvents = useMemo(() => {
    if (sortOrder === "newest") {
      return [...indexedEvents].reverse();
    }
    return indexedEvents;
  }, [indexedEvents, sortOrder]);

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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Execution Event Log
          </h2>
        </div>

        {/* Ordering and Count Controls */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-mono">
            {snapshot.eventTrace.length} events logged
          </span>
          <div className="flex items-center rounded border border-slate-200 bg-white p-0.5 text-[10.5px]">
            <button
              type="button"
              onClick={() => setSortOrder("newest")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sortOrder === "newest"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Newest First
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("oldest")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                sortOrder === "oldest"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Chronological
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
        {displayedEvents.length > 0 ? (
          displayedEvents.map((evt, idx) => {
            const isLatest = sortOrder === "newest" && idx === 0;

            return (
              <div
                key={evt.id}
                className={`px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 transition-colors ${
                  isLatest
                    ? "bg-blue-50/40"
                    : "hover:bg-slate-50/70"
                }`}
              >
                {/* Left section: sequence, timestamp, type, description */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="font-mono text-[10px] text-slate-400 shrink-0 w-8">
                    #{evt.sequenceNumber}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    T={evt.timestamp}
                  </span>
                  <span className="shrink-0">
                    <EventTypeBadge type={evt.eventType} />
                  </span>
                  <span className="text-slate-800 truncate font-normal">
                    {evt.description}
                  </span>
                </div>

                {/* Right section: Thread name and affected resource */}
                <div className="flex items-center gap-2 shrink-0 sm:text-right pl-10 sm:pl-0">
                  {evt.affectedResource && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {evt.affectedResource}
                    </span>
                  )}
                  <span className="text-[10.5px] font-semibold text-slate-700">
                    {evt.threadName}
                  </span>
                  {isLatest && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded">
                      Latest
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-10 text-center text-xs text-slate-400 italic">
            Execution trace is empty. Advance simulation steps to record events.
          </div>
        )}
      </div>
    </div>
  );
};
