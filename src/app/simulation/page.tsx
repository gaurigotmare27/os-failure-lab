"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  PlayIcon,
  PauseIcon,
  StepForwardIcon,
  RotateCcwIcon,
  ClockIcon,
  LayersIcon,
  ThreadMonitorIcon,
  SyncIcon,
  ShieldAlertIcon,
} from "@/components/icons";
import {
  starterScenarios,
  raceConditionScenario,
  deadlockScenario,
  producerConsumerScenario,
} from "@/lib/simulation/scenarios";
import { createInitialSnapshot } from "@/lib/simulation/engine";
import { stepSimulation } from "@/lib/simulation/controller";
import { analyzeSimulation } from "@/lib/simulation/diagnostics";
import type {
  Scenario,
  SimulationSnapshot,
} from "@/lib/simulation/types";
import {
  ThreadStateTable,
  ExecutionTimeline,
  WaitForGraph,
  ResourceMonitor,
  EventLog,
} from "@/components/simulation";
import { saveSimulationRun } from "@/lib/simulation/history";

/**
 * Normalizes query string parameter to a valid Scenario ID.
 */
function resolveScenarioId(param: string | null): string {
  if (!param) return raceConditionScenario.id;
  const normalized = param.toLowerCase().trim();
  if (
    normalized === "race-condition" ||
    normalized === "scenario-race-condition" ||
    normalized === "exp-shared-counter"
  ) {
    return raceConditionScenario.id;
  }
  if (
    normalized === "deadlock" ||
    normalized === "two-thread-deadlock" ||
    normalized === "scenario-two-thread-deadlock" ||
    normalized === "exp-two-thread-deadlock"
  ) {
    return deadlockScenario.id;
  }
  if (
    normalized === "producer-consumer" ||
    normalized === "scenario-producer-consumer" ||
    normalized === "exp-producer-consumer"
  ) {
    return producerConsumerScenario.id;
  }
  const match = starterScenarios.find((s) => s.id === param);
  return match ? match.id : raceConditionScenario.id;
}

function SimulationLabContent() {
  const searchParams = useSearchParams();
  const scenarioParam = searchParams.get("scenario") || searchParams.get("scenarioId");
  const initialScenarioId = resolveScenarioId(scenarioParam);

  // Scenario Selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);

  const activeScenario: Scenario =
    starterScenarios.find((s) => s.id === selectedScenarioId) ??
    raceConditionScenario;

  // Single Source of Truth Simulation State
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() =>
    createInitialSnapshot(activeScenario)
  );

  // Playback Control State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear running timer safely
  const stopExecution = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Track previous query parameter to adjust state during render without effects
  const [prevScenarioParam, setPrevScenarioParam] = useState(scenarioParam);

  if (scenarioParam !== prevScenarioParam) {
    setPrevScenarioParam(scenarioParam);
    const resolved = resolveScenarioId(scenarioParam);
    if (resolved !== selectedScenarioId) {
      setSelectedScenarioId(resolved);
      const target =
        starterScenarios.find((s) => s.id === resolved) ??
        raceConditionScenario;
      setSnapshot(createInitialSnapshot(target));
      if (isRunning) {
        setIsRunning(false);
      }
    }
  }

  // Reset to initial scenario snapshot
  const handleReset = useCallback(() => {
    stopExecution();
    setSnapshot(createInitialSnapshot(activeScenario));
  }, [activeScenario, stopExecution]);

  // Handle Scenario Change via UI dropdown
  const handleScenarioChange = (scenarioId: string) => {
    stopExecution();
    setSelectedScenarioId(scenarioId);
    const target =
      starterScenarios.find((s) => s.id === scenarioId) ??
      raceConditionScenario;
    setSnapshot(createInitialSnapshot(target));

    // Keep URL parameter synchronized
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", scenarioId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Advance by single operation step
  const handleStep = useCallback(() => {
    setSnapshot((prev) => {
      // If terminal state, do not step further
      if (
        prev.status === "COMPLETED" ||
        prev.status === "STEP_LIMIT_REACHED" ||
        prev.status === "DEADLOCKED"
      ) {
        stopExecution();
        return prev;
      }

      const next = stepSimulation(prev);

      // If no progress possible (e.g. deadlocked or all threads blocked)
      if (
        next.activeThreadId === null &&
        next.readyQueue.length === 0 &&
        !next.threads.every((t) => t.state === "DONE")
      ) {
        stopExecution();
      }

      if (next.status === "COMPLETED" || next.status === "STEP_LIMIT_REACHED" || next.status === "DEADLOCKED") {
        stopExecution();
        saveSimulationRun(next, activeScenario);
      }

      return next;
    });
  }, [stopExecution, activeScenario]);

  // Manual save handler for student run archiving
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const handleSaveToReports = () => {
    saveSimulationRun(snapshot, activeScenario);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Start continuous execution
  const handleRun = () => {
    if (
      isRunning ||
      snapshot.status === "COMPLETED" ||
      snapshot.status === "STEP_LIMIT_REACHED" ||
      snapshot.status === "DEADLOCKED"
    ) {
      return;
    }

    setIsRunning(true);
  };

  // Pause execution
  const handlePause = () => {
    stopExecution();
  };

  // Continuous execution effect loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        handleStep();
      }, 750);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, handleStep]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Active Thread Helper
  const activeThread = snapshot.activeThreadId
    ? snapshot.threads.find((t) => t.id === snapshot.activeThreadId)
    : null;

  // Determine if simulation is in terminal state or blocked
  const isTerminated =
    snapshot.status === "COMPLETED" ||
    snapshot.status === "STEP_LIMIT_REACHED" ||
    snapshot.status === "DEADLOCKED";

  const isBlocked =
    !isTerminated &&
    snapshot.activeThreadId === null &&
    snapshot.readyQueue.length === 0 &&
    snapshot.threads.some((t) => t.state === "BLOCKED");

  // Concurrency diagnostics analysis derived strictly from current snapshot
  const diagnosticReport = analyzeSimulation(snapshot);

  // Helper for status badge styling
  const renderStatusBadge = (status: SimulationSnapshot["status"]) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            COMPLETED
          </span>
        );
      case "DEADLOCKED":
        return (
          <span className="inline-flex items-center rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            DEADLOCKED
          </span>
        );
      case "STEP_LIMIT_REACHED":
        return (
          <span className="inline-flex items-center rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            STEP LIMIT
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            PAUSED
          </span>
        );
      case "IDLE":
      default:
        return (
          <span className="inline-flex items-center rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
            IDLE
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>Overview</span>
            <span>/</span>
            <span className="font-medium text-slate-800">Simulation Lab</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Simulation Laboratory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute discrete-event concurrency scenarios, inspect thread state transitions, and analyze synchronization primitives.
              </p>
            </div>
            {snapshot.status === "DEADLOCKED" ? (
              <div className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Deadlock Confirmed (Circular Wait)
              </div>
            ) : isBlocked ? (
              <div className="inline-flex items-center gap-1.5 rounded bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                Execution Stalled (Unresolved Blocking)
              </div>
            ) : null}
          </div>
        </div>

        {/* Top Control Bar & Scenario Selector */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Scenario Selector */}
            <div className="flex-1">
              <label
                htmlFor="scenario-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Select Experiment Scenario
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  id="scenario-select"
                  value={selectedScenarioId}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value={raceConditionScenario.id}>
                    Shared Counter Race Condition (Lost Update)
                  </option>
                  <option value={deadlockScenario.id}>
                    Two-Thread Deadlock (Circular Wait)
                  </option>
                  <option value={producerConsumerScenario.id}>
                    Producer-Consumer Problem (Bounded Buffer)
                  </option>
                </select>
                <span className="text-[11px] text-slate-500">
                  {activeScenario.description}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
              {/* RUN */}
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning || isTerminated || isBlocked}
                className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium transition-colors shadow-2xs ${
                  isRunning || isTerminated || isBlocked
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title="Run continuously"
              >
                <PlayIcon size={12} className={isRunning ? "text-slate-400" : "text-white"} />
                <span>Run</span>
              </button>

              {/* PAUSE */}
              <button
                type="button"
                onClick={handlePause}
                disabled={!isRunning}
                className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
                  !isRunning
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
                title="Pause execution"
              >
                <PauseIcon size={12} className={!isRunning ? "text-slate-300" : "text-slate-700"} />
                <span>Pause</span>
              </button>

              {/* STEP */}
              <button
                type="button"
                onClick={handleStep}
                disabled={isRunning || isTerminated || isBlocked}
                className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
                  isRunning || isTerminated || isBlocked
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
                title="Execute single operation"
              >
                <StepForwardIcon size={12} className={isRunning || isTerminated || isBlocked ? "text-slate-300" : "text-slate-700"} />
                <span>Step</span>
              </button>

              {/* RESET */}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Reset scenario to time 0"
              >
                <RotateCcwIcon size={12} className="text-slate-600" />
                <span>Reset</span>
              </button>

              {/* SAVE RUN */}
              <button
                type="button"
                onClick={handleSaveToReports}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
                  saveToast
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
                title="Save snapshot to run history for reports"
              >
                <span>{saveToast ? "Saved!" : "Save Run"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Logical Clock */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Logical Clock</span>
              <ClockIcon size={14} className="text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              T = {snapshot.logicalTime}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Discrete clock ticks</div>
          </div>

          {/* Engine Status */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Engine Status</span>
              <LayersIcon size={14} className="text-slate-400" />
            </div>
            <div className="mt-0.5">{renderStatusBadge(snapshot.status)}</div>
            <div className="text-[11px] text-slate-400 mt-1">Lifecycle phase</div>
          </div>

          {/* Active CPU Thread */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active CPU Thread</span>
              <ThreadMonitorIcon size={14} className="text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-900 truncate">
              {activeThread ? activeThread.name : "None (Idle)"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {activeThread ? `ID: ${activeThread.id}` : "CPU yielded / idle"}
            </div>
          </div>

          {/* Scheduling Policy */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Scheduling Policy</span>
              <SyncIcon size={14} className="text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-900 truncate">
              {snapshot.schedulingPolicy}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {snapshot.timeQuantum ? `Quantum = ${snapshot.timeQuantum} tick` : "Non-preemptive"}
            </div>
          </div>
        </div>

        {/* Diagnostic Report Panel (Visible when Deadlock or Unresolved Blocking is active) */}
        {(snapshot.status === "DEADLOCKED" ||
          diagnosticReport.condition === "DEADLOCK" ||
          diagnosticReport.condition === "UNRESOLVED_BLOCKING") && (
          <div
            className={`rounded-lg border p-4 shadow-2xs ${
              diagnosticReport.isDeadlocked
                ? "border-rose-200 bg-rose-50/50"
                : "border-amber-200 bg-amber-50/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded shrink-0 ${
                  diagnosticReport.isDeadlocked
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <ShieldAlertIcon size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider ${
                      diagnosticReport.isDeadlocked
                        ? "text-rose-900"
                        : "text-amber-900"
                    }`}
                  >
                    Concurrency Diagnostics: {diagnosticReport.condition.replace("_", " ")}
                  </h3>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border self-start sm:self-auto ${
                      diagnosticReport.isDeadlocked
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {diagnosticReport.summary}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {diagnosticReport.explanation}
                </p>

                {/* Suggested Prevention / Recovery Technique */}
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide block mb-0.5">
                    Recommended Prevention / Recovery Technique:
                  </span>
                  <p className="text-xs text-slate-600">
                    {diagnosticReport.suggestedTechnique}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Thread State Monitor */}
        <section id="thread-state-section" aria-labelledby="thread-state-section">
          <ThreadStateTable snapshot={snapshot} />
        </section>

        {/* SECTION 2: Execution Timeline */}
        <section id="execution-timeline-section" aria-labelledby="execution-timeline-section">
          <ExecutionTimeline snapshot={snapshot} />
        </section>

        {/* SECTION 3: Wait-for Graph */}
        <section id="wait-for-graph-section" aria-labelledby="wait-for-graph-section">
          <WaitForGraph snapshot={snapshot} />
        </section>

        {/* SECTION 4: Resource & Synchronization Monitor */}
        <section id="resource-monitor-section" aria-labelledby="resource-monitor-section">
          <ResourceMonitor snapshot={snapshot} />
        </section>

        {/* SECTION 5: Execution Event Log */}
        <section id="event-log-section" aria-labelledby="event-log-section">
          <EventLog snapshot={snapshot} />
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function SimulationLabPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="p-8 text-center text-xs text-slate-500">
            Initializing simulation environment...
          </div>
        </DashboardLayout>
      }
    >
      <SimulationLabContent />
    </Suspense>
  );
}
