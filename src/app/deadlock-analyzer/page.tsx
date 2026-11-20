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
      <div className="space-y-8">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Deadlock Analyzer</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Deadlock Analyzer & Graph Explorer
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                Inspect mutual exclusion contention, construct dynamic Wait-For Graphs, and verify Coffman conditions in real time.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Link
                href="/simulation?scenario=scenario-two-thread-deadlock"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <PlayCircleIcon size={16} className="text-white" />
                <span>Open in Simulation Lab</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="lab-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleStep}
              disabled={snapshot.status === "DEADLOCKED"}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs ${
                snapshot.status === "DEADLOCKED"
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <StepForwardIcon size={14} className={snapshot.status === "DEADLOCKED" ? "text-slate-300" : "text-slate-700"} />
              <span>Step Instruction</span>
            </button>

            <button
              type="button"
              onClick={handleFastForwardToDeadlock}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-2xs"
            >
              <span>Jump to Deadlock</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
            >
              <RotateCcwIcon size={14} className="text-slate-600" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-mono">
            <span className="text-slate-500 font-medium">Logical Clock:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              T = {snapshot.logicalTime}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md font-bold border ${
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
          <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-5 shadow-xs flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlertIcon size={24} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="text-sm font-bold uppercase tracking-wider text-rose-900">
                Formal Deadlock Identified: {diagnostics.summary}
              </div>
              <p className="text-sm text-rose-800 leading-relaxed">
                {diagnostics.explanation}
              </p>
              <div className="text-xs text-slate-800 pt-2 border-t border-rose-200/80 font-sans">
                <strong className="font-bold text-rose-900">Mitigation Strategy:</strong> {diagnostics.suggestedTechnique}
              </div>
            </div>
          </div>
        )}

        {/* Wait-For Graph Live Visualization */}
        <section aria-labelledby="graph-section">
          <WaitForGraph snapshot={snapshot} />
        </section>

        {/* Mutex Resources & Coffman Conditions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResourceMonitor snapshot={snapshot} />

          <div className="lab-card p-5 space-y-4">
            <div className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <CheckCircleIcon size={16} className="text-blue-600" />
              <span>Coffman Conditions Checklist</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-800">1. Mutual Exclusion (Non-shareable locks)</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SATISFIED
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-800">2. Hold and Wait (Holding while requesting)</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {snapshot.threads.some((t) => t.heldLocks.length > 0)
                    ? "SATISFIED"
                    : "PENDING"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-800">3. No Preemption (Locks held until voluntary release)</span>
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SATISFIED
                </span>
              </div>
              <div
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  diagnostics.isDeadlocked
                    ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                    : "bg-slate-50 border-slate-200/80 text-slate-600"
                }`}
              >
                <span className="font-medium">4. Circular Wait (Closed loop dependency)</span>
                <span className="font-mono font-bold">
                  {diagnostics.isDeadlocked ? (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300">
                      DETECTED (CYCLE)
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      NONE
                    </span>
                  )}
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
