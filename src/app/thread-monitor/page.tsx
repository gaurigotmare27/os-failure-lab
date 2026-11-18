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
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-800">Thread Monitor</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Thread Lifecycle & Timeline Monitor
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Observe thread transitions across NEW, READY, RUNNING, BLOCKED, and DONE states and analyze CPU time slices.
              </p>
            </div>
            <Link
              href="/simulation"
              className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <PlayCircleIcon size={14} className="text-white" />
              <span>Full Simulation Lab</span>
            </Link>
          </div>
        </div>

        {/* Controls & Scenario Switcher */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label htmlFor="thread-scenario" className="text-xs font-semibold text-slate-700">
              Scenario:
            </label>
            <select
              id="thread-scenario"
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
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
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            >
              <StepForwardIcon size={12} className="text-slate-600" />
              <span>Step Execution</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors shadow-2xs"
            >
              <RotateCcwIcon size={12} className="text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
            <span>Clock: T={snapshot.logicalTime}</span>
            <span>Policy: {snapshot.schedulingPolicy}</span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ThreadMonitorIcon size={16} className="text-slate-600" />
            <span>POSIX Thread State Machine Architecture</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div className="border border-slate-100 rounded p-2.5 bg-slate-50/50">
              <span className="font-bold text-slate-800">1. NEW</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Thread created; registers and stack frame initialized.
              </p>
            </div>
            <div className="border border-blue-200 rounded p-2.5 bg-blue-50/40">
              <span className="font-bold text-blue-800">2. READY</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Enqueued in the CPU Ready Queue; waiting for scheduler dispatch.
              </p>
            </div>
            <div className="border border-emerald-200 rounded p-2.5 bg-emerald-50/40">
              <span className="font-bold text-emerald-800">3. RUNNING</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Actively executing instruction on the virtual processor.
              </p>
            </div>
            <div className="border border-amber-200 rounded p-2.5 bg-amber-50/40">
              <span className="font-bold text-amber-800">4. BLOCKED</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Suspended awaiting contested lock, semaphore permit, or I/O.
              </p>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-100/70">
              <span className="font-bold text-slate-700">5. DONE</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Execution finalized; instructions depleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
