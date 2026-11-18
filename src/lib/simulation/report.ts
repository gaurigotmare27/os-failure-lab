/**
 * OS Failure Lab - Structured Report Generation & Export
 *
 * Implements formal simulation reporting:
 * - Structured JSON report generation
 * - Standard CSV metrics formatting
 * - Integration with browser print / PDF output
 */

import type {
  Scenario,
  SimulationSnapshot,
  SimulationStatus,
  TraceEvent,
} from "./types";
import { calculateSimulationMetrics, type SimulationMetrics } from "./metrics";
import { analyzeSimulation } from "./diagnostics";

/**
 * Structured report representation of a simulated concurrency scenario.
 */
export interface SimulationReport {
  projectName: "OS Failure Lab";
  version: "1.0.0";
  generatedAt: string;

  scenario: {
    id: string;
    name: string;
    description: string;
    schedulingPolicy: string;
    timeQuantum?: number;
  };

  simulation: {
    status: SimulationStatus;
    logicalExecutionTime: number;
    totalOperationsCompleted: number;
    totalContextSwitches: number;
    totalThreads: number;
    completedThreads: number;
    blockedThreads: number;
    totalReadyWaitingTime: number;
    totalBlockedTime: number;
    cpuUtilizationPercentage: number;
  };

  threadSummary: Array<{
    id: string;
    name: string;
    priority: number;
    finalState: string;
    operationsCompleted: number;
    totalOperations: number;
    runningTime: number;
    readyWaitingTime: number;
    blockedTime: number;
    completionTimestamp: number | null;
  }>;

  deadlockDiagnostics: {
    isDeadlocked: boolean;
    condition: string;
    summary: string;
    explanation: string;
    involvedThreads: string[];
    involvedLocks: string[];
    mitigation: string;
  };

  resources: {
    sharedVariables: Array<{
      id: string;
      name: string;
      initialValue: string | number | boolean;
      currentValue: string | number | boolean;
      isModified: boolean;
    }>;
    mutexLocks: Array<{
      id: string;
      name: string;
      ownerThreadId: string | null;
      waitingQueue: string[];
    }>;
    semaphores: Array<{
      id: string;
      name: string;
      initialValue: number;
      currentValue: number;
      waitingQueue: string[];
    }>;
  };

  eventTrace: TraceEvent[];
}

/**
 * Generates a complete, structured SimulationReport from a snapshot and scenario definition.
 */
export function generateSimulationReport(
  snapshot: SimulationSnapshot,
  scenario: Scenario
): SimulationReport {
  const metrics: SimulationMetrics = calculateSimulationMetrics(snapshot);
  const diagnostics = analyzeSimulation(snapshot);

  const threadSummary = snapshot.threads.map((thread) => {
    const tm = metrics.threadMetrics[thread.id];
    return {
      id: thread.id,
      name: thread.name,
      priority: thread.priority,
      finalState: thread.state,
      operationsCompleted: thread.currentOperationIndex,
      totalOperations: thread.operations.length,
      runningTime: tm?.runningTime ?? 0,
      readyWaitingTime: tm?.readyTime ?? 0,
      blockedTime: tm?.blockedTime ?? 0,
      completionTimestamp: tm?.completionTimestamp ?? null,
    };
  });

  const sharedVariables = snapshot.sharedVariables.map((v) => ({
    id: v.id,
    name: v.name,
    initialValue: v.initialValue,
    currentValue: v.currentValue,
    isModified: v.currentValue !== v.initialValue,
  }));

  const mutexLocks = snapshot.locks.map((l) => ({
    id: l.id,
    name: l.name,
    ownerThreadId: l.ownerThreadId,
    waitingQueue: [...l.waitingQueue],
  }));

  const semaphores = snapshot.semaphores.map((s) => ({
    id: s.id,
    name: s.name,
    initialValue: s.initialValue,
    currentValue: s.currentValue,
    waitingQueue: [...s.waitingQueue],
  }));

  return {
    projectName: "OS Failure Lab",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      schedulingPolicy: scenario.schedulingPolicy,
      timeQuantum: scenario.timeQuantum,
    },
    simulation: {
      status: snapshot.status,
      logicalExecutionTime: snapshot.logicalTime,
      totalOperationsCompleted: metrics.totalOperationsCompleted,
      totalContextSwitches: metrics.totalContextSwitches,
      totalThreads: metrics.totalThreads,
      completedThreads: metrics.completedThreads,
      blockedThreads: metrics.blockedThreads,
      totalReadyWaitingTime: metrics.totalReadyTime,
      totalBlockedTime: metrics.totalBlockedTime,
      cpuUtilizationPercentage: metrics.cpuUtilizationPercentage,
    },
    threadSummary,
    deadlockDiagnostics: {
      isDeadlocked: diagnostics.isDeadlocked,
      condition: diagnostics.condition,
      summary: diagnostics.summary,
      explanation: diagnostics.explanation,
      involvedThreads: diagnostics.involvedThreadIds,
      involvedLocks: diagnostics.involvedLockIds,
      mitigation: diagnostics.suggestedTechnique,
    },
    resources: {
      sharedVariables,
      mutexLocks,
      semaphores,
    },
    eventTrace: [...snapshot.eventTrace],
  };
}

/**
 * Serializes a SimulationReport to a formatted JSON string.
 */
export function exportReportAsJson(report: SimulationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Converts report metrics into standard CSV text.
 */
export function exportMetricsAsCsv(report: SimulationReport): string {
  const rows: string[] = [];

  // Metadata
  rows.push("SECTION: METADATA");
  rows.push("Project,OS Failure Lab");
  rows.push(`Scenario Name,"${report.scenario.name.replace(/"/g, '""')}"`);
  rows.push(`Scenario ID,${report.scenario.id}`);
  rows.push(`Scheduling Policy,${report.scenario.schedulingPolicy}`);
  rows.push(`Time Quantum,${report.scenario.timeQuantum ?? "N/A"}`);
  rows.push(`Generated At,${report.generatedAt}`);
  rows.push(`Simulation Status,${report.simulation.status}`);
  rows.push(`Deadlock Detected,${report.deadlockDiagnostics.isDeadlocked ? "YES" : "NO"}`);
  rows.push("");

  // Executive Telemetry
  rows.push("SECTION: EXECUTIVE METRICS");
  rows.push("Metric,Value,Unit");
  rows.push(`Logical Execution Time,${report.simulation.logicalExecutionTime},clock ticks`);
  rows.push(`Operations Completed,${report.simulation.totalOperationsCompleted},operations`);
  rows.push(`Context Switches,${report.simulation.totalContextSwitches},switches`);
  rows.push(`Total Ready Waiting Time,${report.simulation.totalReadyWaitingTime},clock ticks`);
  rows.push(`Total Blocked Time,${report.simulation.totalBlockedTime},clock ticks`);
  rows.push(`CPU Utilization,${report.simulation.cpuUtilizationPercentage},%`);
  rows.push("");

  // Thread Performance Breakdown
  rows.push("SECTION: THREAD PERFORMANCE");
  rows.push(
    "Thread ID,Thread Name,Priority,Final State,Completed Ops,Total Ops,Running Time (ticks),Ready Time (ticks),Blocked Time (ticks),Completion Timestamp"
  );
  for (const t of report.threadSummary) {
    rows.push(
      `"${t.id}","${t.name}",${t.priority},${t.finalState},${t.operationsCompleted},${t.totalOperations},${t.runningTime},${t.readyWaitingTime},${t.blockedTime},${t.completionTimestamp ?? "Incomplete"}`
    );
  }
  rows.push("");

  // Synchronization & Memory Resources
  rows.push("SECTION: SYNCHRONIZATION AND MEMORY RESOURCES");
  rows.push("Resource Type,Resource ID,Name,Initial State,Current State,Contention / Waiters");
  for (const v of report.resources.sharedVariables) {
    rows.push(
      `Shared Variable,"${v.id}","${v.name}",${v.initialValue},${v.currentValue},${v.isModified ? "MODIFIED" : "UNCHANGED"}`
    );
  }
  for (const l of report.resources.mutexLocks) {
    rows.push(
      `Mutex Lock,"${l.id}","${l.name}",FREE,${l.ownerThreadId ? `Held by ${l.ownerThreadId}` : "FREE"},"[${l.waitingQueue.join("; ")}]"`
    );
  }
  for (const s of report.resources.semaphores) {
    rows.push(
      `Semaphore,"${s.id}","${s.name}",${s.initialValue},${s.currentValue},"[${s.waitingQueue.join("; ")}]"`
    );
  }

  return rows.join("\n");
}

/**
 * Triggers a browser download of a given string payload as a text file.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
