"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  deadlockScenario,
} from "@/lib/simulation/scenarios";
import { createInitialSnapshot } from "@/lib/simulation/engine";
import { stepSimulation } from "@/lib/simulation/controller";
import { analyzeSimulation } from "@/lib/simulation/diagnostics";
import {
  WaitForGraph,
  ResourceMonitor,
  ThreadStateTable,
} from "@/components/simulation";
import {
  PlayCircleIcon,
  RotateCcwIcon,
  StepForwardIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
} from "@/components/icons";

export default function DeadlockAnalyzerPage() {
  const [snapshot, setSnapshot] = useState(() =>
    createInitialSnapshot(deadlockScenario)
  );

  const handleStep = () => {
    if (snapshot.status === "DEADLOCKED" || snapshot.status === "COMPLETED") {
      return;
    }
    setSnapshot((prev) => stepSimulation(prev));
  };

  const handleFastForwardToDeadlock = () => {
    let current = createInitialSnapshot(deadlockScenario);
    for (let i = 0; i < 8; i++) {
      if (current.status === "DEADLOCKED") break;
      current = stepSimulation(current);
    }
    setSnapshot(current);
  };

  const handleReset = () => {
    setSnapshot(createInitialSnapshot(deadlockScenario));
  };

  const diagnostics = analyzeSimulation(snapshot);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-800">Deadlock Analyzer</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Deadlock Analyzer & Graph Explorer
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect mutual exclusion contention, construct dynamic Wait-For Graphs, and verify Coffman conditions in real time.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/simulation?scenario=scenario-two-thread-deadlock"
                className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <PlayCircleIcon size={14} className="text-white" />
                <span>Open in Simulation Lab</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStep}
              disabled={snapshot.status === "DEADLOCKED"}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
                snapshot.status === "DEADLOCKED"
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <StepForwardIcon size={12} className={snapshot.status === "DEADLOCKED" ? "text-slate-300" : "text-slate-700"} />
              <span>Step Instruction</span>
            </button>
            <button
              type="button"
              onClick={handleFastForwardToDeadlock}
              className="inline-flex items-center gap-1.5 rounded bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
            >
              <span>Jump to Deadlock</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RotateCcwIcon size={12} className="text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Logical Clock:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              T = {snapshot.logicalTime}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold border ${
                snapshot.status === "DEADLOCKED"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {snapshot.status}
            </span>
          </div>
        </div>

        {/* Deadlock Alert Banner */}
        {diagnostics.isDeadlocked && (
          <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlertIcon size={20} />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Formal Deadlock Identified: {diagnostics.summary}
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {diagnostics.explanation}
              </p>
              <div className="text-[11px] text-slate-700 pt-1 font-sans">
                <strong>Mitigation Strategy:</strong> {diagnostics.suggestedTechnique}
              </div>
            </div>
          </div>
        )}

        {/* Wait-For Graph Live Visualization */}
        <section aria-labelledby="graph-section">
          <WaitForGraph snapshot={snapshot} />
        </section>

        {/* Mutex Resources & Thread Contention State */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResourceMonitor snapshot={snapshot} />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircleIcon size={14} className="text-blue-600" />
              <span>Coffman Conditions Checklist</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span>1. Mutual Exclusion (Non-shareable locks)</span>
                <span className="font-mono text-emerald-700 font-bold">SATISFIED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span>2. Hold and Wait (Holding while requesting)</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {snapshot.threads.some((t) => t.heldLocks.length > 0)
                    ? "SATISFIED"
                    : "PENDING"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span>3. No Preemption (Locks held until release)</span>
                <span className="font-mono text-emerald-700 font-bold">SATISFIED</span>
              </div>
              <div
                className={`flex items-center justify-between p-2 rounded border ${
                  diagnostics.isDeadlocked
                    ? "bg-rose-50 border-rose-200 text-rose-900 font-bold"
                    : "bg-slate-50 border-slate-100 text-slate-600"
                }`}
              >
                <span>4. Circular Wait (Closed loop dependency)</span>
                <span className="font-mono">
                  {diagnostics.isDeadlocked ? "DETECTED (CYCLE)" : "NONE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thread State Monitor */}
        <section aria-labelledby="thread-state-section">
          <ThreadStateTable snapshot={snapshot} />
        </section>
      </div>
    </DashboardLayout>
  );
}
