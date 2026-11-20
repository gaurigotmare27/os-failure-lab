import React, { useState, useMemo } from "react";
import type { SimulationSnapshot, ThreadState, TraceEvent } from "@/lib/simulation/types";

export interface ExecutionTimelineProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

interface TickSlice {
  tick: number;
  state: ThreadState;
  events: TraceEvent[];
  operationDescription?: string;
  operationType?: string;
}

/**
 * Reconstructs the historical state of a thread for each discrete tick in [0, maxTime]
 * strictly based on the snapshot and discrete event trace.
 */
function deriveThreadTimeline(
  threadId: string,
  maxTime: number,
  eventTrace: TraceEvent[],
  finalState: ThreadState
): TickSlice[] {
  const slices: TickSlice[] = [];

  // Group events by timestamp for this specific thread
  const eventsByTick = new Map<number, TraceEvent[]>();
  for (const evt of eventTrace) {
    if (evt.threadId === threadId) {
      const list = eventsByTick.get(evt.timestamp) ?? [];
      list.push(evt);
      eventsByTick.set(evt.timestamp, list);
    }
  }

  let currentState: ThreadState = "READY"; // All initial threads start READY

  for (let t = 0; t <= maxTime; t++) {
    const tickEvents = eventsByTick.get(t) ?? [];

    // Derive state transitions that occurred at tick t
    for (const evt of tickEvents) {
      if (evt.eventType === "STATE_CHANGE") {
        const desc = evt.description.toLowerCase();
        if (desc.includes("running")) {
          currentState = "RUNNING";
        } else if (desc.includes("ready")) {
          currentState = "READY";
        } else if (desc.includes("blocked")) {
          currentState = "BLOCKED";
        } else if (desc.includes("done")) {
          currentState = "DONE";
        }
      } else if (evt.eventType === "LOCK_BLOCKED" || evt.eventType === "SEMAPHORE_WAIT") {
        currentState = "BLOCKED";
      } else if (
        evt.eventType === "OPERATION_START" ||
        evt.eventType === "MEMORY_READ" ||
        evt.eventType === "MEMORY_WRITE" ||
        evt.eventType === "LOCK_ACQUIRED"
      ) {
        currentState = "RUNNING";
      }
    }

    // At the current terminal tick of the snapshot, use the authoritative snapshot state
    if (t === maxTime) {
      currentState = finalState;
    }

    // Find primary operation description at this tick
    let opDesc: string | undefined;
    let opType: string | undefined;

    const primaryOpEvt = tickEvents.find(
      (e) =>
        e.eventType === "MEMORY_READ" ||
        e.eventType === "MEMORY_WRITE" ||
        e.eventType === "LOCK_ACQUIRED" ||
        e.eventType === "LOCK_BLOCKED" ||
        e.eventType === "LOCK_RELEASED" ||
        e.eventType === "SEMAPHORE_WAIT" ||
        e.eventType === "SEMAPHORE_SIGNAL" ||
        e.eventType === "OPERATION_START" ||
        e.eventType === "OPERATION_COMPLETE"
    );

    if (primaryOpEvt) {
      opDesc = primaryOpEvt.description;
      opType = primaryOpEvt.eventType;
    }

    slices.push({
      tick: t,
      state: currentState,
      events: tickEvents,
      operationDescription: opDesc,
      operationType: opType,
    });
  }

  return slices;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ snapshot }) => {
  const maxTime = snapshot.logicalTime;
  const hasEvents = snapshot.eventTrace.length > 0;
  const [viewMode, setViewMode] = useState<"thread" | "step">("thread");

  // Generate ticks array [0..maxTime]
  const ticks = useMemo(() => {
    return Array.from({ length: maxTime + 1 }, (_, i) => i);
  }, [maxTime]);

  // Derive per-thread timeline for all threads
  const timelineData = useMemo(() => {
    return snapshot.threads.map((thread) => {
      const slices = deriveThreadTimeline(
        thread.id,
        maxTime,
        snapshot.eventTrace,
        thread.state
      );
      return { thread, slices };
    });
  }, [snapshot.threads, maxTime, snapshot.eventTrace]);

  const getStateBadgeStyle = (state: ThreadState) => {
    switch (state) {
      case "RUNNING":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
      case "READY":
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      case "BLOCKED":
        return "bg-amber-50 text-amber-900 border-amber-300 font-bold";
      case "DONE":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "NEW":
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="lab-card overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Execution Timeline (Gantt Trace)
            </h2>
          </div>
        </div>

        {/* View Toggle & State Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              RUNNING
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              READY
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              BLOCKED
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              DONE
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("thread")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "thread"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Thread Tracks
            </button>
            <button
              type="button"
              onClick={() => setViewMode("step")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "step"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Step Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasEvents && maxTime === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          <div className="mx-auto w-10 h-10 text-slate-300 mb-2">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          Execution timeline is currently at Clock T = 0. Click <strong>Step</strong> or{" "}
          <strong>Run</strong> to advance instructions and observe discrete time slices.
        </div>
      ) : viewMode === "thread" ? (
        /* THREAD TRACKS VIEW: Responsive wrapped timeline blocks without horizontal scroll */
        <div className="p-5 space-y-5">
          {timelineData.map(({ thread, slices }) => (
            <div
              key={thread.id}
              className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 space-y-3"
            >
              {/* Thread Row Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {thread.id}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {thread.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {slices.length} Time Slices Recorded
                </span>
              </div>

              {/* Wrapped Responsive Slices (Never overflows horizontally) */}
              <div className="flex flex-wrap gap-2">
                {slices.map((slice) => {
                  const isRunning = slice.state === "RUNNING";
                  return (
                    <div
                      key={slice.tick}
                      className={`min-w-[110px] sm:min-w-[125px] flex-1 max-w-[160px] rounded-lg p-2.5 border transition-all shadow-2xs flex flex-col justify-between ${getStateBadgeStyle(
                        slice.state
                      )}`}
                    >
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-black/10">
                        <span className="font-mono font-bold">T = {slice.tick}</span>
                        {isRunning && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <div className="text-xs font-bold uppercase tracking-wider">
                          {slice.state}
                        </div>
                        <div className="text-[11px] font-sans truncate" title={slice.operationDescription}>
                          {slice.operationDescription
                            ? slice.operationDescription.replace(/^Thread '.*?' /, "")
                            : slice.state === "READY"
                            ? "In ready queue"
                            : slice.state === "BLOCKED"
                            ? "Waiting resource"
                            : "Depleted"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* STEP GRID VIEW: Discrete Clock Ticks Grid */
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {ticks.map((t) => (
              <div
                key={t}
                className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Tick T = {t}
                  </span>
                  {t === maxTime && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Latest
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  {timelineData.map(({ thread, slices }) => {
                    const slice = slices[t];
                    if (!slice) return null;
                    return (
                      <div
                        key={thread.id}
                        className="flex items-center justify-between text-xs p-1 rounded bg-slate-50/60"
                      >
                        <span className="font-medium text-slate-800 truncate mr-1">
                          {thread.name}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStateBadgeStyle(
                            slice.state
                          )}`}
                        >
                          {slice.state}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
