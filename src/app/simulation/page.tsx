"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  PlayIcon,
  PauseIcon,
  StepForwardIcon,
  RotateCcwIcon,
  ClockIcon,
  LayersIcon,
  ThreadMonitorIcon,
  LockIcon,
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
  ThreadDefinition,
  TraceEvent,
} from "@/lib/simulation/types";

export default function SimulationLabPage() {
  // Scenario Selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    raceConditionScenario.id
  );

  const activeScenario: Scenario =
    starterScenarios.find((s) => s.id === selectedScenarioId) ??
    raceConditionScenario;

  // Simulation State
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

  // Reset to initial scenario snapshot
  const handleReset = useCallback(() => {
    stopExecution();
    setSnapshot(createInitialSnapshot(activeScenario));
  }, [activeScenario, stopExecution]);

  // Handle Scenario Change
  const handleScenarioChange = (scenarioId: string) => {
    stopExecution();
    setSelectedScenarioId(scenarioId);
    const target =
      starterScenarios.find((s) => s.id === scenarioId) ??
      raceConditionScenario;
    setSnapshot(createInitialSnapshot(target));
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

      if (next.status === "COMPLETED" || next.status === "STEP_LIMIT_REACHED") {
        stopExecution();
      }

      return next;
    });
  }, [stopExecution]);

  // Start continuous execution
  const handleRun = () => {
    if (
      isRunning ||
      snapshot.status === "COMPLETED" ||
      snapshot.status === "STEP_LIMIT_REACHED"
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

  // Concurrency diagnostics analysis
  const diagnosticReport = analyzeSimulation(snapshot);

  // Helper for thread state pill styling
  const renderStateBadge = (state: ThreadDefinition["state"]) => {
    switch (state) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            READY
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            BLOCKED
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
            DONE
          </span>
        );
      case "NEW":
      default:
        return (
          <span className="inline-flex items-center rounded bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
            NEW
          </span>
        );
    }
  };

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

  // Helper for event type badge in log
  const renderEventBadge = (type: TraceEvent["eventType"]) => {
    switch (type) {
      case "CONTEXT_SWITCH":
        return (
          <span className="inline-block rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
            CONTEXT SWITCH
          </span>
        );
      case "STATE_CHANGE":
        return (
          <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
            STATE CHANGE
          </span>
        );
      case "MEMORY_READ":
        return (
          <span className="inline-block rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 border border-cyan-200">
            MEMORY READ
          </span>
        );
      case "MEMORY_WRITE":
        return (
          <span className="inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
            MEMORY WRITE
          </span>
        );
      case "LOCK_ACQUIRED":
      case "LOCK_RELEASED":
      case "LOCK_BLOCKED":
        return (
          <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
            MUTEX
          </span>
        );
      case "SEMAPHORE_WAIT":
      case "SEMAPHORE_SIGNAL":
        return (
          <span className="inline-block rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 border border-teal-200">
            SEMAPHORE
          </span>
        );
      default:
        return (
          <span className="inline-block rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            {type.replace("_", " ")}
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
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
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
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors border shadow-2xs ${
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
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Reset scenario to time 0"
              >
                <RotateCcwIcon size={12} className="text-slate-600" />
                <span>Reset</span>
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

                {/* Wait-For Graph Edges */}
                {diagnosticReport.waitForGraph.edges.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-800 block mb-1">
                      Wait-For Graph Dependency Edges:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {diagnosticReport.waitForGraph.edges.map((edge, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded bg-white px-2 py-1 text-[11px] font-mono border border-slate-200 shadow-2xs text-slate-800"
                        >
                          <span className="font-semibold text-rose-700">
                            {edge.fromThreadId}
                          </span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-semibold text-slate-900">
                            {edge.toThreadId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            (waiting for{" "}
                            <strong className="text-amber-700">
                              {edge.lockName}
                            </strong>
                            )
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

        {/* Thread State Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThreadMonitorIcon size={16} className="text-slate-600" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Simulated Threads & Register State
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Ready Queue: [{snapshot.readyQueue.length > 0 ? snapshot.readyQueue.join(", ") : "Empty"}]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2 px-3">Thread</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Current Instruction</th>
                  <th className="py-2 px-3">Local Registers</th>
                  <th className="py-2 px-3">Held Locks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.threads.map((thread) => {
                  const currentOp = thread.operations[thread.currentOperationIndex];
                  const registers = snapshot.threadRegisters[thread.id] || {};
                  const regEntries = Object.entries(registers);

                  return (
                    <tr
                      key={thread.id}
                      className={
                        thread.id === snapshot.activeThreadId
                          ? "bg-blue-50/40"
                          : "hover:bg-slate-50/50"
                      }
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {thread.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {thread.id}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {thread.priority}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderStateBadge(thread.state)}
                        {thread.state === "BLOCKED" && thread.waitingReason && (
                          <div className="text-[10px] text-amber-700 mt-1 max-w-xs">
                            {thread.waitingReason}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        {currentOp ? (
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-blue-600 mr-1.5">
                              [{currentOp.type}]
                            </span>
                            <span className="text-slate-700">
                              {currentOp.description}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Step {thread.currentOperationIndex + 1} of {thread.operations.length}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Completed all instructions
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {regEntries.length > 0 ? (
                          <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                            {regEntries.map(([reg, val]) => (
                              <span
                                key={reg}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 border border-slate-200"
                              >
                                {reg} = {String(val)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {thread.heldLocks.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {thread.heldLocks.map((lockId) => (
                              <span
                                key={lockId}
                                className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200"
                              >
                                {lockId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shared Resource State Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Shared Variables */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2.5">
              <LayersIcon size={14} className="text-blue-500" />
              <span>Shared Variables</span>
            </div>
            {snapshot.sharedVariables.length > 0 ? (
              <div className="space-y-2">
                {snapshot.sharedVariables.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/60 p-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{v.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Initial: {String(v.initialValue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-white px-2 py-1 font-mono text-xs font-bold text-blue-700 border border-slate-200 shadow-2xs">
                        {String(v.currentValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                No shared memory variables in this scenario.
              </div>
            )}
          </div>

          {/* Mutex Locks */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2.5">
              <LockIcon size={14} className="text-amber-500" />
              <span>Mutex Locks</span>
            </div>
            {snapshot.locks.length > 0 ? (
              <div className="space-y-2">
                {snapshot.locks.map((lock) => (
                  <div
                    key={lock.id}
                    className="rounded border border-slate-100 bg-slate-50/60 p-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{lock.name}</span>
                      <span
                        className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${
                          lock.ownerThreadId
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {lock.ownerThreadId ? `Held by ${lock.ownerThreadId}` : "FREE"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Wait Queue:{" "}
                      {lock.waitingQueue.length > 0
                        ? `[${lock.waitingQueue.join(", ")}]`
                        : "Empty"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                No mutex locks configured in this scenario.
              </div>
            )}
          </div>

          {/* Semaphores */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2.5">
              <SyncIcon size={14} className="text-teal-500" />
              <span>Counting / Binary Semaphores</span>
            </div>
            {snapshot.semaphores.length > 0 ? (
              <div className="space-y-2">
                {snapshot.semaphores.map((sem) => (
                  <div
                    key={sem.id}
                    className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/60 p-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{sem.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Waiters: {sem.waitingQueue.length > 0 ? `[${sem.waitingQueue.join(", ")}]` : "None"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-white px-2 py-1 font-mono text-xs font-bold text-teal-700 border border-slate-200 shadow-2xs">
                        {sem.currentValue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                No semaphores configured in this scenario.
              </div>
            )}
          </div>
        </div>

        {/* Execution Event Log */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon size={16} className="text-slate-600" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Discrete Event Trace Log
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {snapshot.eventTrace.length} events logged
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 font-sans text-xs">
            {snapshot.eventTrace.length > 0 ? (
              [...snapshot.eventTrace].reverse().map((evt) => (
                <div
                  key={evt.id}
                  className="px-4 py-2 hover:bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      T={evt.timestamp}
                    </span>
                    <span className="shrink-0">{renderEventBadge(evt.eventType)}</span>
                    <span className="text-slate-700 truncate">
                      {evt.description}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 shrink-0 sm:text-right">
                    Thread: {evt.threadId}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-400 italic">
                Execution trace is empty. Click <strong>Step</strong> or <strong>Run</strong> to advance instructions.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
