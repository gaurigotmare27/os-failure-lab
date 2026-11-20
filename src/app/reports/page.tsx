"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  starterScenarios,
  raceConditionScenario,
  deadlockScenario,
  producerConsumerScenario,
} from "@/lib/simulation/scenarios";
import { createInitialSnapshot } from "@/lib/simulation/engine";
import { stepSimulation } from "@/lib/simulation/controller";
import {
  getSavedRuns,
  saveSimulationRun,
  deleteSavedRun,
  clearSavedRuns,
  type SavedSimulationRun,
} from "@/lib/simulation/history";
import {
  calculateSimulationMetrics,
  type SimulationMetrics,
} from "@/lib/simulation/metrics";
import {
  compareSimulationRuns,
  type SimulationComparison,
} from "@/lib/simulation/comparison";
import {
  generateSimulationReport,
  exportReportAsJson,
  exportMetricsAsCsv,
  downloadFile,
  type SimulationReport,
} from "@/lib/simulation/report";
import {
  ClockIcon,
  LayersIcon,
  LockIcon,
  SyncIcon,
  ThreadMonitorIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
  PlayCircleIcon,
} from "@/components/icons";

export default function ReportsPage() {
  const [savedRuns, setSavedRuns] = useState<SavedSimulationRun[]>(() => {
    if (typeof window !== "undefined") {
      return getSavedRuns();
    }
    return [];
  });

  const [selectedRunId, setSelectedRunId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const runs = getSavedRuns();
      return runs[0]?.runId ?? null;
    }
    return null;
  });

  const [compareRunId, setCompareRunId] = useState<string | null>(null);
  const [isInitializingBaselines, setIsInitializingBaselines] = useState<boolean>(false);

  // Execute authentic baseline runs if local history is empty
  const handleGenerateBaselines = () => {
    setIsInitializingBaselines(true);
    try {
      // 1. Race condition run
      let rSnap = createInitialSnapshot(raceConditionScenario);
      while (rSnap.status !== "COMPLETED" && rSnap.eventTrace.length < 20) {
        rSnap = stepSimulation(rSnap);
      }
      saveSimulationRun(rSnap, raceConditionScenario);

      // 2. Deadlock run
      let dSnap = createInitialSnapshot(deadlockScenario);
      for (let i = 0; i < 8; i++) {
        if (dSnap.status === "DEADLOCKED") break;
        dSnap = stepSimulation(dSnap);
      }
      saveSimulationRun(dSnap, deadlockScenario);

      // 3. Producer-consumer run
      let pSnap = createInitialSnapshot(producerConsumerScenario);
      while (pSnap.status !== "COMPLETED" && pSnap.eventTrace.length < 30) {
        pSnap = stepSimulation(pSnap);
      }
      saveSimulationRun(pSnap, producerConsumerScenario);

      const updated = getSavedRuns();
      setSavedRuns(updated);
      if (updated.length > 0) {
        setSelectedRunId(updated[0].runId);
      }
    } finally {
      setIsInitializingBaselines(false);
    }
  };

  // Identify active selected run
  const activeRun = useMemo(() => {
    return savedRuns.find((r) => r.runId === selectedRunId) ?? savedRuns[0] ?? null;
  }, [savedRuns, selectedRunId]);

  // Identify comparison target run
  const compareRun = useMemo(() => {
    if (!compareRunId) return null;
    return savedRuns.find((r) => r.runId === compareRunId) ?? null;
  }, [savedRuns, compareRunId]);

  // Find scenario metadata for active run
  const activeScenario = useMemo(() => {
    if (!activeRun) return raceConditionScenario;
    return (
      starterScenarios.find((s) => s.id === activeRun.scenarioId) ?? {
        id: activeRun.scenarioId,
        name: activeRun.scenarioName,
        description: "Custom user-configured simulation scenario.",
        schedulingPolicy: activeRun.snapshot.schedulingPolicy,
        timeQuantum: activeRun.snapshot.timeQuantum,
        threads: activeRun.snapshot.threads,
        locks: activeRun.snapshot.locks,
        resources: activeRun.snapshot.resources,
        sharedVariables: activeRun.snapshot.sharedVariables,
        semaphores: activeRun.snapshot.semaphores,
      }
    );
  }, [activeRun]);

  // Calculate live metrics for active run
  const activeMetrics: SimulationMetrics | null = useMemo(() => {
    if (!activeRun) return null;
    return calculateSimulationMetrics(activeRun.snapshot);
  }, [activeRun]);

  // Calculate live metrics for compare run
  const compareMetrics: SimulationMetrics | null = useMemo(() => {
    if (!compareRun) return null;
    return calculateSimulationMetrics(compareRun.snapshot);
  }, [compareRun]);

  // Run comparative analysis if comparison run is selected
  const comparisonResult: SimulationComparison | null = useMemo(() => {
    if (!activeMetrics || !compareMetrics || !activeRun || !compareRun) {
      return null;
    }
    return compareSimulationRuns(
      activeMetrics,
      compareMetrics,
      { id: activeRun.scenarioId, name: activeRun.scenarioName },
      { id: compareRun.scenarioId, name: compareRun.scenarioName }
    );
  }, [activeMetrics, compareMetrics, activeRun, compareRun]);

  // Generate structured report
  const activeReport: SimulationReport | null = useMemo(() => {
    if (!activeRun || !activeScenario) return null;
    return generateSimulationReport(activeRun.snapshot, activeScenario);
  }, [activeRun, activeScenario]);

  // Export Handlers
  const handleExportJson = () => {
    if (!activeReport) return;
    const json = exportReportAsJson(activeReport);
    downloadFile(
      json,
      `report-${activeReport.scenario.id}-${Date.now()}.json`,
      "application/json"
    );
  };

  const handleExportCsv = () => {
    if (!activeReport) return;
    const csv = exportMetricsAsCsv(activeReport);
    downloadFile(
      csv,
      `metrics-${activeReport.scenario.id}-${Date.now()}.csv`,
      "text/csv"
    );
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDeleteRun = (runId: string) => {
    deleteSavedRun(runId);
    const updated = getSavedRuns();
    setSavedRuns(updated);
    if (selectedRunId === runId) {
      setSelectedRunId(updated[0]?.runId ?? null);
    }
    if (compareRunId === runId) {
      setCompareRunId(null);
    }
  };

  const handleClearAll = () => {
    clearSavedRuns();
    setSavedRuns([]);
    setSelectedRunId(null);
    setCompareRunId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-5 no-print">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Reports & Analytics</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Simulation Reports & Analytics
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                Inspect deterministic performance metrics, verify synchronization correctness, and export audit reports.
              </p>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={!activeReport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download complete structured report as JSON"
              >
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!activeReport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download performance metrics as CSV"
              >
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!activeReport}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print or save as PDF via browser"
              >
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print Header (Only visible on paper / PDF) */}
        <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
          <div className="text-xl font-bold text-slate-900">
            OS Failure Lab — Formal Experiment Audit Report
          </div>
          <div className="text-sm text-slate-600 mt-1">
            Scenario: {activeReport?.scenario.name} | Status: {activeReport?.simulation.status} | Generated: {activeReport?.generatedAt}
          </div>
        </div>

        {/* History Selector Bar */}
        <div className="lab-card p-5 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* Active Run Select */}
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="run-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Active Simulation Run
                </label>
                {savedRuns.length > 0 ? (
                  <select
                    id="run-select"
                    value={selectedRunId ?? ""}
                    onChange={(e) => setSelectedRunId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                  >
                    {savedRuns.map((run) => (
                      <option key={run.runId} value={run.runId}>
                        {run.scenarioName} ({run.status}, T={run.logicalTime}, {new Date(run.savedAt).toLocaleTimeString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-400 italic py-1">
                    No runs recorded yet in local storage.
                  </div>
                )}
              </div>

              {/* Compare Run Select */}
              {savedRuns.length > 1 && (
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="compare-select"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Compare Against Run
                  </label>
                  <select
                    id="compare-select"
                    value={compareRunId ?? ""}
                    onChange={(e) => setCompareRunId(e.target.value || null)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                  >
                    <option value="">-- No Comparison Selected --</option>
                    {savedRuns
                      .filter((r) => r.runId !== selectedRunId)
                      .map((run) => (
                        <option key={run.runId} value={run.runId}>
                          {run.scenarioName} ({run.status}, T={run.logicalTime})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Run History Actions */}
            <div className="flex items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              {savedRuns.length === 0 ? (
                <button
                  type="button"
                  onClick={handleGenerateBaselines}
                  disabled={isInitializingBaselines}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
                >
                  <PlayCircleIcon size={16} className="text-white" />
                  <span>{isInitializingBaselines ? "Simulating..." : "Initialize Baseline Runs"}</span>
                </button>
              ) : (
                <>
                  {activeRun && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRun(activeRun.runId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 transition-all shadow-2xs"
                      title="Delete this run from history"
                    >
                      <span>Delete Run</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-rose-700 transition-all shadow-2xs"
                    title="Clear all saved run records"
                  >
                    <span>Clear All</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* If no runs exist, prompt user */}
        {savedRuns.length === 0 ? (
          <div className="lab-card p-12 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
              <ClockIcon size={24} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              No Simulation Runs Recorded Yet
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Simulations executed in the laboratory are saved when they complete or encounter a deadlock. You can also generate standard baseline scenario runs instantly below.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleGenerateBaselines}
                disabled={isInitializingBaselines}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-xs"
              >
                <PlayCircleIcon size={16} className="text-white" />
                <span>Initialize Baseline Benchmark Runs</span>
              </button>
              <Link
                href="/simulation"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all shadow-2xs"
              >
                <span>Go to Simulation Lab</span>
              </Link>
            </div>
          </div>
        ) : (
          activeRun &&
          activeMetrics && (
            <>
              {/* Scenario Context Banner */}
              <div className="lab-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-900">
                        {activeRun.scenarioName}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono ${
                          activeRun.status === "DEADLOCKED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : activeRun.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {activeRun.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                      {activeScenario.description}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-0.5">
                    <span className="text-xs text-slate-400 block font-mono">
                      Recorded: {new Date(activeRun.savedAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-600 font-mono font-medium">
                      Policy: {activeRun.snapshot.schedulingPolicy}
                      {activeRun.snapshot.timeQuantum
                        ? ` (Q=${activeRun.snapshot.timeQuantum})`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* PART 1: Executive Telemetry Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Logical Time */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Logical Time</div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    T = {activeMetrics.totalLogicalTime}
                  </div>
                  <div className="text-xs text-slate-500">Clock ticks</div>
                </div>

                {/* 2. Operations Completed */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Operations</div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {activeMetrics.totalOperationsCompleted}
                  </div>
                  <div className="text-xs text-slate-500">Instructions</div>
                </div>

                {/* 3. Context Switches */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Context Switches</div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {activeMetrics.totalContextSwitches}
                  </div>
                  <div className="text-xs text-slate-500">CPU dispatches</div>
                </div>

                {/* 4. CPU Utilization */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">CPU Utilization</div>
                  <div className="text-2xl font-bold font-mono text-blue-700">
                    {activeMetrics.cpuUtilizationPercentage}%
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeMetrics.totalRunningTime} active ticks
                  </div>
                </div>

                {/* 5. Total Blocked Time */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Blocked Time</div>
                  <div className="text-2xl font-bold font-mono text-amber-800">
                    {activeMetrics.totalBlockedTime}
                  </div>
                  <div className="text-xs text-slate-500">Contention ticks</div>
                </div>

                {/* 6. Deadlock State */}
                <div className="lab-card p-4 space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deadlock</div>
                  <div
                    className={`text-lg font-bold ${
                      activeMetrics.isDeadlocked ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {activeMetrics.isDeadlocked ? "DETECTED" : "CLEAN"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeMetrics.isDeadlocked ? "Circular Wait" : "No Cycle"}
                  </div>
                </div>
              </div>

              {/* PART 2: Run Comparison Section (When compare run is active) */}
              {comparisonResult && compareRun && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-xs space-y-5 no-print">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-200/80 pb-3.5">
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono">
                        Run Comparison Engine
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">
                        Comparative Analysis: {activeRun.scenarioName} vs. {compareRun.scenarioName}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompareRunId(null)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold self-start sm:self-auto underline"
                    >
                      Dismiss Comparison
                    </button>
                  </div>

                  {comparisonResult.scenarioMismatchWarning && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                      <ShieldAlertIcon size={18} className="text-amber-700 shrink-0 mt-0.5" />
                      <span className="font-medium">{comparisonResult.scenarioMismatchWarning}</span>
                    </div>
                  )}

                  {/* Comparative Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Logical Execution Time Delta */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                      <span className="text-slate-500 block font-semibold">Execution Time Delta</span>
                      <div className="font-mono font-bold text-slate-900 text-base">
                        {comparisonResult.metrics.logicalTime.delta > 0 ? "+" : ""}
                        {comparisonResult.metrics.logicalTime.delta} ticks
                      </div>
                      <span
                        className={`text-xs font-bold inline-block px-1.5 py-0.2 rounded ${
                          comparisonResult.metrics.logicalTime.direction === "improved"
                            ? "bg-emerald-50 text-emerald-700"
                            : comparisonResult.metrics.logicalTime.direction === "regressed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {comparisonResult.metrics.logicalTime.direction.toUpperCase()}
                      </span>
                    </div>

                    {/* Blocked Time Delta */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                      <span className="text-slate-500 block font-semibold">Blocked Time Delta</span>
                      <div className="font-mono font-bold text-slate-900 text-base">
                        {comparisonResult.metrics.totalBlockedTime.delta > 0 ? "+" : ""}
                        {comparisonResult.metrics.totalBlockedTime.delta} ticks
                      </div>
                      <span
                        className={`text-xs font-bold inline-block px-1.5 py-0.2 rounded ${
                          comparisonResult.metrics.totalBlockedTime.direction === "improved"
                            ? "bg-emerald-50 text-emerald-700"
                            : comparisonResult.metrics.totalBlockedTime.direction === "regressed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {comparisonResult.metrics.totalBlockedTime.direction.toUpperCase()}
                      </span>
                    </div>

                    {/* Operations Completed Delta */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                      <span className="text-slate-500 block font-semibold">Ops Throughput Delta</span>
                      <div className="font-mono font-bold text-slate-900 text-base">
                        {comparisonResult.metrics.operationsCompleted.delta > 0 ? "+" : ""}
                        {comparisonResult.metrics.operationsCompleted.delta} ops
                      </div>
                      <span
                        className={`text-xs font-bold inline-block px-1.5 py-0.2 rounded ${
                          comparisonResult.metrics.operationsCompleted.direction === "improved"
                            ? "bg-emerald-50 text-emerald-700"
                            : comparisonResult.metrics.operationsCompleted.direction === "regressed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {comparisonResult.metrics.operationsCompleted.direction.toUpperCase()}
                      </span>
                    </div>

                    {/* Deadlock State Delta */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs space-y-1">
                      <span className="text-slate-500 block font-semibold">Deadlock Resolution</span>
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {comparisonResult.deadlockComparison.resolutionStatus.replace("_", " ").toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-500 block truncate">
                        {comparisonResult.deadlockComparison.summary}
                      </span>
                    </div>
                  </div>

                  {/* Key Findings List */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-1.5">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
                      Key Comparative Findings:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                      {comparisonResult.keyFindings.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* PART 3: Thread-wise Performance Table (Zero Horizontal Scroll) */}
              <div className="lab-card overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ThreadMonitorIcon size={18} className="text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Thread-Wise Performance Breakdown
                    </h2>
                  </div>
                  <span className="text-xs text-slate-600 font-mono">
                    {activeReport?.threadSummary.length} Threads Evaluated
                  </span>
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block w-full">
                  <table className="w-full text-left text-sm border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/60 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Thread</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Final State</th>
                        <th className="py-3 px-4">Ops Completed</th>
                        <th className="py-3 px-4">Running Time</th>
                        <th className="py-3 px-4">Ready Waiting Time</th>
                        <th className="py-3 px-4">Blocked Time</th>
                        <th className="py-3 px-4">Completion T</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeReport?.threadSummary.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{t.id}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{t.priority}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                t.finalState === "RUNNING"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : t.finalState === "BLOCKED"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : t.finalState === "DONE"
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {t.finalState}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {t.operationsCompleted} / {t.totalOperations}
                          </td>
                          <td className="py-3 px-4 font-mono">{t.runningTime} ticks</td>
                          <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                            {t.readyWaitingTime} ticks
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-amber-800">
                            {t.blockedTime} ticks
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {t.completionTimestamp !== null ? `T = ${t.completionTimestamp}` : "Incomplete"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Stacked Cards (Zero Horizontal Scroll) */}
                <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                  {activeReport?.threadSummary.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{t.id}</div>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${
                            t.finalState === "RUNNING"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : t.finalState === "BLOCKED"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : t.finalState === "DONE"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {t.finalState}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 font-mono text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Ops Completed:</span>
                          <span className="font-bold text-slate-800">{t.operationsCompleted}/{t.totalOperations}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Running Time:</span>
                          <span className="font-bold text-slate-800">{t.runningTime} ticks</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Ready Wait:</span>
                          <span className="font-bold text-blue-700">{t.readyWaitingTime} ticks</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Blocked Time:</span>
                          <span className="font-bold text-amber-800">{t.blockedTime} ticks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PART 4: Diagnostics & Deadlock Assessment */}
              {activeReport?.deadlockDiagnostics && (
                <div
                  className={`rounded-xl border p-5 shadow-xs ${
                    activeReport.deadlockDiagnostics.isDeadlocked
                      ? "border-rose-300 bg-rose-50/70"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        activeReport.deadlockDiagnostics.isDeadlocked
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {activeReport.deadlockDiagnostics.isDeadlocked ? (
                        <ShieldAlertIcon size={24} />
                      ) : (
                        <CheckCircleIcon size={24} />
                      )}
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                          Diagnostics: {activeReport.deadlockDiagnostics.condition.replace("_", " ")}
                        </h3>
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
                          {activeReport.deadlockDiagnostics.summary}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {activeReport.deadlockDiagnostics.explanation}
                      </p>
                      <div className="text-xs text-slate-800 pt-2 border-t border-slate-100">
                        <strong className="font-bold text-slate-900">Recommended Protocol:</strong>{" "}
                        {activeReport.deadlockDiagnostics.mitigation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PART 5: Resource & Semaphore Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Shared Variables */}
                <div className="lab-card p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                    <LayersIcon size={16} className="text-blue-500" />
                    <span>Shared Variables</span>
                  </div>
                  {activeReport?.resources.sharedVariables.length ? (
                    <div className="space-y-2.5">
                      {activeReport.resources.sharedVariables.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{v.name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              Init: {String(v.initialValue)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                            {String(v.currentValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No shared memory variables
                    </div>
                  )}
                </div>

                {/* Mutex Locks */}
                <div className="lab-card p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                    <LockIcon size={16} className="text-amber-500" />
                    <span>Mutex Locks</span>
                  </div>
                  {activeReport?.resources.mutexLocks.length ? (
                    <div className="space-y-2.5">
                      {activeReport.resources.mutexLocks.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{l.name}</span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                l.ownerThreadId
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {l.ownerThreadId ? `Held by ${l.ownerThreadId}` : "FREE"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Waiters: [{l.waitingQueue.join(", ") || "None"}]
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No mutex locks configured
                    </div>
                  )}
                </div>

                {/* Semaphores */}
                <div className="lab-card p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                    <SyncIcon size={16} className="text-teal-500" />
                    <span>Semaphores</span>
                  </div>
                  {activeReport?.resources.semaphores.length ? (
                    <div className="space-y-2.5">
                      {activeReport.resources.semaphores.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{s.name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              Waiters: [{s.waitingQueue.join(", ") || "None"}]
                            </span>
                          </div>
                          <span className="font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                            S = {s.currentValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No semaphores configured
                    </div>
                  )}
                </div>
              </div>

              {/* Event Trace Summary Log */}
              <div className="lab-card overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ClockIcon size={18} className="text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Simulation Event Trace Log
                    </h2>
                  </div>
                  <span className="text-xs text-slate-600 font-mono">
                    {activeReport?.eventTrace.length} events logged
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {activeReport?.eventTrace.map((evt, idx) => (
                    <div
                      key={evt.id}
                      className="px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs text-slate-400 w-8 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                          T={evt.timestamp}
                        </span>
                        <span className="text-sm text-slate-800 truncate font-medium">
                          {evt.description}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-600 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {evt.threadId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
