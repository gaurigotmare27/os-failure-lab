"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

  // Sync snapshot when user switches scenario selector
  const handleScenarioChange = (scenarioId: string) => {
    stopExecution();
    setSelectedScenarioId(scenarioId);
    const targetScenario =
      starterScenarios.find((s) => s.id === scenarioId) ?? raceConditionScenario;
    setSnapshot(createInitialSnapshot(targetScenario));
  };

  // Sync query parameter change if navigated externally
  useEffect(() => {
    if (scenarioParam) {
      const resolved = resolveScenarioId(scenarioParam);
      if (resolved !== selectedScenarioId) {
        stopExecution();
        setSelectedScenarioId(resolved);
        const targetScenario =
          starterScenarios.find((s) => s.id === resolved) ?? raceConditionScenario;
        setSnapshot(createInitialSnapshot(targetScenario));
      }
    }
  }, [scenarioParam, selectedScenarioId, stopExecution]);

  // Handle single discrete simulation step
  const handleStep = useCallback(() => {
    setSnapshot((prevSnapshot) => {
      if (
        prevSnapshot.status === "COMPLETED" ||
        prevSnapshot.status === "STEP_LIMIT_REACHED" ||
        prevSnapshot.status === "DEADLOCKED"
      ) {
        stopExecution();
        return prevSnapshot;
      }

      // Check if stalled on blocking condition without runnable threads
      const isBlocked =
        prevSnapshot.activeThreadId === null &&
        prevSnapshot.readyQueue.length === 0 &&
        prevSnapshot.threads.some((t) => t.state === "BLOCKED");

      if (isBlocked) {
        stopExecution();
        return prevSnapshot;
      }

      const nextSnapshot = stepSimulation(prevSnapshot);

      // Auto-stop if terminal state reached
      if (
        nextSnapshot.status === "COMPLETED" ||
        nextSnapshot.status === "STEP_LIMIT_REACHED" ||
        nextSnapshot.status === "DEADLOCKED"
      ) {
        stopExecution();
      }

      return nextSnapshot;
    });
  }, [stopExecution]);

  // Handle run continuous playback
  const handleRun = () => {
    if (
      snapshot.status === "COMPLETED" ||
      snapshot.status === "STEP_LIMIT_REACHED" ||
      snapshot.status === "DEADLOCKED"
    ) {
      return;
    }
    setIsRunning(true);
  };

  // Handle pause continuous playback
  const handlePause = () => {
    stopExecution();
  };

  // Handle reset to initial state
  const handleReset = () => {
    stopExecution();
    setSnapshot(createInitialSnapshot(activeScenario));
  };

  // Save run snapshot to localStorage history
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const handleSaveToReports = () => {
    saveSimulationRun(snapshot, activeScenario);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
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
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            COMPLETED
          </span>
        );
      case "DEADLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            DEADLOCKED
          </span>
        );
      case "STEP_LIMIT_REACHED":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            STEP LIMIT
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            PAUSED
          </span>
        );
      case "IDLE":
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
            IDLE
          </span>
        );
    }
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
            <span className="font-semibold text-slate-800">Simulation Lab</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Simulation Laboratory
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                Execute discrete-event concurrency scenarios, inspect thread state transitions, and analyze synchronization primitives in real time.
              </p>
            </div>

            {snapshot.status === "DEADLOCKED" ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 border border-rose-300 shadow-2xs shrink-0 self-start sm:self-auto">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                Deadlock Confirmed (Circular Wait)
              </div>
            ) : isBlocked ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 border border-amber-300 shadow-2xs shrink-0 self-start sm:self-auto">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                Execution Stalled (Unresolved Blocking)
              </div>
            ) : null}
          </div>
        </div>

        {/* Top Control Bar & Scenario Selector */}
        <div className="lab-card p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Scenario Selector */}
            <div className="flex-1 space-y-2">
              <label
                htmlFor="scenario-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Select Experiment Scenario
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  id="scenario-select"
                  value={selectedScenarioId}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
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
                <span className="text-xs text-slate-500 leading-normal max-w-lg">
                  {activeScenario.description}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              {/* RUN */}
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning || isTerminated || isBlocked}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                  isRunning || isTerminated || isBlocked
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm"
                }`}
                title="Run continuously"
              >
                <PlayIcon size={14} className={isRunning ? "text-slate-400" : "text-white"} />
                <span>Run</span>
              </button>

              {/* PAUSE */}
              <button
                type="button"
                onClick={handlePause}
                disabled={!isRunning}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs ${
                  !isRunning
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                }`}
                title="Pause execution"
              >
                <PauseIcon size={14} className={!isRunning ? "text-slate-300" : "text-slate-700"} />
                <span>Pause</span>
              </button>

              {/* STEP */}
              <button
                type="button"
                onClick={handleStep}
                disabled={isRunning || isTerminated || isBlocked}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs ${
                  isRunning || isTerminated || isBlocked
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                }`}
                title="Execute single discrete operation"
              >
                <StepForwardIcon size={14} className={isRunning || isTerminated || isBlocked ? "text-slate-300" : "text-slate-700"} />
                <span>Step</span>
              </button>

              {/* RESET */}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
                title="Reset scenario to clock T = 0"
              >
                <RotateCcwIcon size={14} className="text-slate-600" />
                <span>Reset</span>
              </button>

              {/* SAVE RUN */}
              <button
                type="button"
                onClick={handleSaveToReports}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all border shadow-2xs ${
                  saveToast
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                }`}
                title="Save snapshot to run history for reports"
              >
                <span>{saveToast ? "Saved to Reports!" : "Save Run"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Logical Clock */}
          <div className="lab-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Logical Clock</span>
              <ClockIcon size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              T = {snapshot.logicalTime}
            </div>
            <div className="text-xs text-slate-500 font-medium">Discrete clock ticks</div>
          </div>

          {/* Engine Status */}
          <div className="lab-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Engine Status</span>
              <LayersIcon size={16} className="text-emerald-500" />
            </div>
            <div className="pt-1">{renderStatusBadge(snapshot.status)}</div>
            <div className="text-xs text-slate-500 font-medium pt-1">Lifecycle phase</div>
          </div>

          {/* Active CPU Thread */}
          <div className="lab-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Active CPU Thread</span>
              <ThreadMonitorIcon size={16} className="text-purple-500" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {activeThread ? activeThread.name : "None (Idle)"}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {activeThread ? `ID: ${activeThread.id}` : "CPU yielded / idle"}
            </div>
          </div>

          {/* Scheduling Policy */}
          <div className="lab-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Scheduling Policy</span>
              <SyncIcon size={16} className="text-amber-500" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {snapshot.schedulingPolicy}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {snapshot.timeQuantum ? `Quantum = ${snapshot.timeQuantum} tick` : "Non-preemptive"}
            </div>
          </div>
        </div>

        {/* Diagnostic Report Panel (Visible when Deadlock or Unresolved Blocking is active) */}
        {(snapshot.status === "DEADLOCKED" ||
          diagnosticReport.condition === "DEADLOCK" ||
          diagnosticReport.condition === "UNRESOLVED_BLOCKING") && (
          <div
            className={`rounded-xl border p-5 shadow-xs ${
              diagnosticReport.isDeadlocked
                ? "border-rose-300 bg-rose-50/70"
                : "border-amber-300 bg-amber-50/70"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  diagnosticReport.isDeadlocked
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <ShieldAlertIcon size={24} />
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider ${
                      diagnosticReport.isDeadlocked
                        ? "text-rose-900"
                        : "text-amber-900"
                    }`}
                  >
                    Concurrency Diagnostics: {diagnosticReport.condition.replace("_", " ")}
                  </h3>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-md border self-start sm:self-auto ${
                      diagnosticReport.isDeadlocked
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {diagnosticReport.summary}
                  </span>
                </div>

                <p className="text-sm text-slate-800 leading-relaxed">
                  {diagnosticReport.explanation}
                </p>

                {/* Suggested Prevention / Recovery Technique */}
                <div className="pt-2.5 border-t border-slate-200/80">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
                    Recommended Prevention / Recovery Technique:
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
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
          <div className="p-12 text-center text-sm text-slate-500">
            Initializing simulation environment...
          </div>
        </DashboardLayout>
      }
    >
      <SimulationLabContent />
    </Suspense>
  );
}
