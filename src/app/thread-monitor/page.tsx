"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  starterScenarios,
  raceConditionScenario,
} from "@/lib/simulation/scenarios";
import { createInitialSnapshot } from "@/lib/simulation/engine";
import { stepSimulation } from "@/lib/simulation/controller";
import type { Scenario, SimulationSnapshot } from "@/lib/simulation/types";
import {
  ThreadStateTable,
  ExecutionTimeline,
} from "@/components/simulation";
import {
  PlayCircleIcon,
  RotateCcwIcon,
  StepForwardIcon,
  ThreadMonitorIcon,
} from "@/components/icons";

export default function ThreadMonitorPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    raceConditionScenario.id
  );

  const activeScenario: Scenario =
    starterScenarios.find((s) => s.id === selectedScenarioId) ??
    raceConditionScenario;

  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() =>
    createInitialSnapshot(activeScenario)
  );

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const target = starterScenarios.find((s) => s.id === id) ?? raceConditionScenario;
    setSnapshot(createInitialSnapshot(target));
  };

  const handleStep = () => {
    if (
      snapshot.status === "COMPLETED" ||
      snapshot.status === "STEP_LIMIT_REACHED" ||
      snapshot.status === "DEADLOCKED"
    ) {
      return;
    }
    setSnapshot((prev) => stepSimulation(prev));
  };

  const handleReset = () => {
    setSnapshot(createInitialSnapshot(activeScenario));
  };

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
            <span className="font-semibold text-slate-800">Thread Monitor</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Thread Lifecycle & Timeline Monitor
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                Observe thread transitions across NEW, READY, RUNNING, BLOCKED, and DONE states and analyze CPU time slices in real time.
              </p>
            </div>
            <Link
              href="/simulation"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto shrink-0"
            >
              <PlayCircleIcon size={16} className="text-white" />
              <span>Full Simulation Lab</span>
            </Link>
          </div>
        </div>

        {/* Controls & Scenario Switcher */}
        <div className="lab-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="thread-scenario" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Scenario:
            </label>
            <select
              id="thread-scenario"
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
            >
              {starterScenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleStep}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-all shadow-2xs"
            >
              <StepForwardIcon size={14} className="text-slate-600" />
              <span>Step Execution</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-all shadow-2xs"
            >
              <RotateCcwIcon size={14} className="text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono text-slate-600">
            <span className="font-medium text-slate-500">Clock: <strong className="text-slate-900">T={snapshot.logicalTime}</strong></span>
            <span>Policy: <strong className="text-slate-900">{snapshot.schedulingPolicy}</strong></span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Active: {snapshot.activeThreadId ?? "Idle"}
            </span>
          </div>
        </div>

        {/* Live Thread State Monitor */}
        <section aria-labelledby="thread-state-table-section">
          <ThreadStateTable snapshot={snapshot} />
        </section>

        {/* Live Execution Timeline */}
        <section aria-labelledby="execution-timeline-section">
          <ExecutionTimeline snapshot={snapshot} />
        </section>

        {/* Thread State Guide */}
        <div className="lab-card p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <ThreadMonitorIcon size={18} className="text-blue-600" />
            <span>POSIX Thread State Machine Architecture</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1">
              <span className="font-bold text-slate-800 text-sm block">1. NEW</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thread created; virtual registers and execution stack frame initialized.
              </p>
            </div>
            <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/50 space-y-1">
              <span className="font-bold text-blue-900 text-sm block">2. READY</span>
              <p className="text-xs text-blue-800 leading-relaxed">
                Enqueued in CPU Ready Queue waiting for dispatcher quantum allocation.
              </p>
            </div>
            <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/50 space-y-1">
              <span className="font-bold text-emerald-900 text-sm block">3. RUNNING</span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Actively executing atomic instruction on virtual processor core.
              </p>
            </div>
            <div className="border border-amber-200 rounded-xl p-3.5 bg-amber-50/50 space-y-1">
              <span className="font-bold text-amber-900 text-sm block">4. BLOCKED</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Suspended awaiting contested mutex lock, semaphore permit, or I/O.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-100/70 space-y-1">
              <span className="font-bold text-slate-700 text-sm block">5. DONE</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Execution finalized; instructions depleted, awaiting resource reap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
