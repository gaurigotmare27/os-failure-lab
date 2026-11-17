import React from "react";

const threadStates = [
  {
    name: "NEW",
    desc: "Thread spawned; awaiting scheduler insertion",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "READY",
    desc: "In run queue waiting for CPU time slice",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    name: "RUNNING",
    desc: "Currently executing instructions on virtual core",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    name: "BLOCKED",
    desc: "Waiting for mutex lock, semaphore or condition",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    name: "TERMINATED",
    desc: "Execution finished; resources awaiting reap",
    color: "bg-slate-100 text-slate-500 border-slate-200",
  },
];

export function ThreadStateReference() {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
          Thread State Machine
        </h3>
        <p className="text-xs text-slate-500">
          OS lifecycle states tracked during simulation
        </p>
      </div>

      <div className="space-y-2">
        {threadStates.map((st) => (
          <div
            key={st.name}
            className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-50 transition-colors"
          >
            <span
              className={`inline-block w-20 text-center font-mono text-[10px] font-semibold py-0.5 rounded border shrink-0 ${st.color}`}
            >
              {st.name}
            </span>
            <span className="text-xs text-slate-600 leading-tight pt-0.5">
              {st.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
