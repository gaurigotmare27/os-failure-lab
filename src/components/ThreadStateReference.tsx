import React from "react";

const threadStates = [
  {
    name: "NEW",
    desc: "Thread spawned; awaiting scheduler insertion into ready queue",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
  {
    name: "READY",
    desc: "Enqueued in ready queue waiting for CPU time slice dispatch",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    name: "RUNNING",
    desc: "Currently executing instructions on virtual processor core",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500 animate-pulse",
  },
  {
    name: "BLOCKED",
    desc: "Suspended waiting for mutex lock, semaphore permit or resource",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    name: "TERMINATED",
    desc: "Execution finished; registers and thread resources awaiting reap",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
];

export function ThreadStateReference() {
  return (
    <div className="lab-card p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Thread State Machine
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          POSIX lifecycle states tracked across simulation runs
        </p>
      </div>

      <div className="space-y-2.5">
        {threadStates.map((st) => (
          <div
            key={st.name}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span
              className={`inline-flex items-center justify-center gap-1.5 w-24 text-center font-mono text-xs font-bold py-1 px-2 rounded-md border shrink-0 ${st.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.name}
            </span>
            <span className="text-xs text-slate-600 leading-relaxed pt-0.5">
              {st.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
