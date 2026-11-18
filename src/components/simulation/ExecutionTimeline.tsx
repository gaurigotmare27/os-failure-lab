import React, { useMemo } from "react";
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

  // Compute timeline slices per thread
  const timelineData = useMemo(() => {
    return snapshot.threads.map((thread) => {
      const slices = deriveThreadTimeline(
        thread.id,
        maxTime,
        snapshot.eventTrace,
        thread.state
      );
      return {
        thread,
        slices,
      };
    });
  }, [snapshot.threads, maxTime, snapshot.eventTrace]);

  // Generate array of time ticks: [0, 1, ..., maxTime]
  const ticks = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i <= maxTime; i++) {
      list.push(i);
    }
    return list;
  }, [maxTime]);

  const getStateStyles = (state: ThreadState) => {
    switch (state) {
      case "RUNNING":
        return "bg-emerald-500 text-white border-emerald-600 shadow-2xs";
      case "READY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "BLOCKED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DONE":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "NEW":
      default:
        return "bg-slate-50 text-slate-400 border-slate-200";
    }
  };

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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Execution Timeline (Gantt Trace)
          </h2>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-2xs bg-emerald-500 border border-emerald-600" />
            <span>RUNNING</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-2xs bg-blue-100 border border-blue-200" />
            <span>READY</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-2xs bg-amber-200 border border-amber-300" />
            <span>BLOCKED</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-2xs bg-slate-200 border border-slate-300" />
            <span>DONE</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasEvents && maxTime === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-slate-400 italic">
          <div className="mx-auto w-8 h-8 text-slate-300 mb-2">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          Execution timeline is empty. Click <strong>Step</strong> or{" "}
          <strong>Run</strong> to advance instructions along the logical time axis.
        </div>
      ) : (
        <div className="overflow-x-auto p-4">
          <div className="min-w-fit space-y-3">
            {/* Horizontal Logical Time Header Axis */}
            <div className="flex items-center">
              <div className="w-32 shrink-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Logical Clock
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                {ticks.map((t) => (
                  <div
                    key={t}
                    className={`w-28 shrink-0 text-center py-1 rounded text-[11px] font-mono border ${
                      t === maxTime
                        ? "bg-blue-50 text-blue-700 font-bold border-blue-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    T = {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Thread Rows */}
            {timelineData.map(({ thread, slices }) => (
              <div key={thread.id} className="flex items-center">
                {/* Thread Identifier Cell */}
                <div className="w-32 shrink-0 pr-3">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {thread.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {thread.id}
                  </div>
                </div>

                {/* Horizontal Timeline Track */}
                <div className="flex items-center gap-1.5 flex-1">
                  {slices.map((slice) => {
                    const isRunning = slice.state === "RUNNING";
                    return (
                      <div
                        key={slice.tick}
                        title={`T=${slice.tick} | ${thread.name} [${slice.state}]${
                          slice.operationDescription
                            ? `\nOperation: ${slice.operationDescription}`
                            : ""
                        }`}
                        className={`w-28 shrink-0 h-14 rounded p-1.5 border flex flex-col justify-between transition-all ${getStateStyles(
                          slice.state
                        )}`}
                      >
                        {/* Upper tag: State label */}
                        <div className="flex items-center justify-between text-[10px] font-bold tracking-tight">
                          <span>{slice.state}</span>
                          {isRunning && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </div>

                        {/* Lower tag: Operation summary or state info */}
                        <div className="text-[10px] truncate leading-tight">
                          {slice.operationDescription ? (
                            <span className="truncate font-sans font-medium" title={slice.operationDescription}>
                              {slice.operationDescription.replace(/^Thread '.*?' /, "")}
                            </span>
                          ) : slice.state === "READY" ? (
                            <span className="text-[9px] text-blue-600 italic">In ready queue</span>
                          ) : slice.state === "BLOCKED" ? (
                            <span className="text-[9px] text-amber-800 italic">Waiting</span>
                          ) : slice.state === "DONE" ? (
                            <span className="text-[9px] text-slate-400 italic">Halted</span>
                          ) : null}
                        </div>
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
