/**
 * OS Failure Lab - Run Comparison Engine
 *
 * Implements deterministic comparative analysis between two simulation runs:
 * - Delta calculation (absolute and percentage differences)
 * - Directional classification (improved, regressed, unchanged)
 * - Scenario identity validation (mismatch warning)
 * - Deadlock resolution or introduction tracking
 */

import type { SimulationStatus } from "./types";
import type { SimulationMetrics, ThreadMetrics } from "./metrics";

export type MetricDirection = "improved" | "regressed" | "unchanged";

/**
 * Comparative difference for a specific numeric metric.
 */
export interface MetricDelta {
  baseValue: number;
  compareValue: number;
  delta: number;
  percentChange: number | null;
  direction: MetricDirection;
}

/**
 * Per-thread comparative metrics.
 */
export interface ThreadComparison {
  threadId: string;
  threadName: string;
  operationsDelta: MetricDelta;
  readyTimeDelta: MetricDelta;
  blockedTimeDelta: MetricDelta;
  runningTimeDelta: MetricDelta;
}

/**
 * Complete comparison result between two simulation runs.
 */
export interface SimulationComparison {
  baseScenarioId: string;
  compareScenarioId: string;
  baseScenarioName: string;
  compareScenarioName: string;
  isSameScenario: boolean;
  scenarioMismatchWarning?: string;

  statusComparison: {
    baseStatus: SimulationStatus;
    compareStatus: SimulationStatus;
    hasStatusChanged: boolean;
  };

  deadlockComparison: {
    baseIsDeadlocked: boolean;
    compareIsDeadlocked: boolean;
    resolutionStatus:
      | "deadlock_resolved"
      | "deadlock_introduced"
      | "persistently_deadlocked"
      | "neither_deadlocked";
    summary: string;
  };

  metrics: {
    logicalTime: MetricDelta;
    operationsCompleted: MetricDelta;
    contextSwitches: MetricDelta;
    totalBlockedTime: MetricDelta;
    totalReadyTime: MetricDelta;
    cpuUtilization: MetricDelta;
  };

  threadComparisons: ThreadComparison[];
  keyFindings: string[];
}

/**
 * Calculates metric delta with directionality.
 *
 * @param base Baseline value (original run)
 * @param compare Comparison value (subsequent/alternate run)
 * @param lowerIsBetter Whether a smaller number represents an improvement (e.g. blocked time, latency)
 */
function computeDelta(
  base: number,
  compare: number,
  lowerIsBetter: boolean
): MetricDelta {
  const delta = compare - base;
  const percentChange =
    base !== 0 ? Math.round(((compare - base) / base) * 100) : null;

  let direction: MetricDirection = "unchanged";
  if (delta !== 0) {
    if (lowerIsBetter) {
      direction = delta < 0 ? "improved" : "regressed";
    } else {
      direction = delta > 0 ? "improved" : "regressed";
    }
  }

  return {
    baseValue: base,
    compareValue: compare,
    delta,
    percentChange,
    direction,
  };
}

/**
 * Compares two simulation metric sets and highlights improvements, regressions, and anomalies.
 */
export function compareSimulationRuns(
  baseMetrics: SimulationMetrics,
  compareMetrics: SimulationMetrics,
  baseScenario: { id: string; name: string },
  compareScenario: { id: string; name: string }
): SimulationComparison {
  const isSameScenario = baseScenario.id === compareScenario.id;
  const scenarioMismatchWarning = !isSameScenario
    ? `Scenario mismatch: Comparing '${baseScenario.name}' against '${compareScenario.name}'. Structural parameters differ between these workloads.`
    : undefined;

  // Status & Deadlock comparison
  const hasStatusChanged = baseMetrics.status !== compareMetrics.status;
  let resolutionStatus: SimulationComparison["deadlockComparison"]["resolutionStatus"] =
    "neither_deadlocked";
  let deadlockSummary = "Neither simulation run encountered a circular wait deadlock.";

  if (baseMetrics.isDeadlocked && !compareMetrics.isDeadlocked) {
    resolutionStatus = "deadlock_resolved";
    deadlockSummary = "Deadlock successfully eliminated! The comparison run progressed without circular wait.";
  } else if (!baseMetrics.isDeadlocked && compareMetrics.isDeadlocked) {
    resolutionStatus = "deadlock_introduced";
    deadlockSummary = "Regression: Circular wait deadlock was introduced in the comparison run.";
  } else if (baseMetrics.isDeadlocked && compareMetrics.isDeadlocked) {
    resolutionStatus = "persistently_deadlocked";
    deadlockSummary = "Both simulation runs stalled in a circular wait deadlock.";
  }

  // Core metrics comparison
  // For logical execution time: lower is better if all operations completed
  const logicalTime = computeDelta(
    baseMetrics.totalLogicalTime,
    compareMetrics.totalLogicalTime,
    true
  );

  // Operations completed: higher is better
  const operationsCompleted = computeDelta(
    baseMetrics.totalOperationsCompleted,
    compareMetrics.totalOperationsCompleted,
    false
  );

  // Context switches: lower is better (less overhead)
  const contextSwitches = computeDelta(
    baseMetrics.totalContextSwitches,
    compareMetrics.totalContextSwitches,
    true
  );

  // Blocked time: lower is better
  const totalBlockedTime = computeDelta(
    baseMetrics.totalBlockedTime,
    compareMetrics.totalBlockedTime,
    true
  );

  // Ready time: lower is better (less waiting in queue)
  const totalReadyTime = computeDelta(
    baseMetrics.totalReadyTime,
    compareMetrics.totalReadyTime,
    true
  );

  // CPU utilization: higher is generally better (less idle time)
  const cpuUtilization = computeDelta(
    baseMetrics.cpuUtilizationPercentage,
    compareMetrics.cpuUtilizationPercentage,
    false
  );

  // Thread comparisons
  const threadComparisons: ThreadComparison[] = [];
  const allThreadIds = Array.from(
    new Set([
      ...Object.keys(baseMetrics.threadMetrics),
      ...Object.keys(compareMetrics.threadMetrics),
    ])
  );

  for (const tid of allThreadIds) {
    const baseThread: ThreadMetrics | undefined = baseMetrics.threadMetrics[tid];
    const compareThread: ThreadMetrics | undefined = compareMetrics.threadMetrics[tid];

    const threadName =
      compareThread?.threadName ?? baseThread?.threadName ?? tid;

    threadComparisons.push({
      threadId: tid,
      threadName,
      operationsDelta: computeDelta(
        baseThread?.operationsCompleted ?? 0,
        compareThread?.operationsCompleted ?? 0,
        false
      ),
      readyTimeDelta: computeDelta(
        baseThread?.readyTime ?? 0,
        compareThread?.readyTime ?? 0,
        true
      ),
      blockedTimeDelta: computeDelta(
        baseThread?.blockedTime ?? 0,
        compareThread?.blockedTime ?? 0,
        true
      ),
      runningTimeDelta: computeDelta(
        baseThread?.runningTime ?? 0,
        compareThread?.runningTime ?? 0,
        false
      ),
    });
  }

  // Key findings generation
  const keyFindings: string[] = [];

  if (resolutionStatus === "deadlock_resolved") {
    keyFindings.push("Major Improvement: Deadlock eliminated in comparison run.");
  } else if (resolutionStatus === "deadlock_introduced") {
    keyFindings.push("Critical Regression: Deadlock introduced in comparison run.");
  }

  if (totalBlockedTime.delta < 0) {
    keyFindings.push(
      `Contention Reduced: Thread blocked time decreased by ${Math.abs(
        totalBlockedTime.delta
      )} ticks (${Math.abs(totalBlockedTime.percentChange ?? 0)}%).`
    );
  } else if (totalBlockedTime.delta > 0) {
    keyFindings.push(
      `Contention Increased: Thread blocked time rose by ${totalBlockedTime.delta} ticks.`
    );
  }

  if (operationsCompleted.delta > 0) {
    keyFindings.push(
      `Throughput Gain: Completed ${operationsCompleted.delta} additional operations.`
    );
  }

  if (contextSwitches.delta < 0) {
    keyFindings.push(
      `Scheduling Efficiency: Context switches reduced by ${Math.abs(
        contextSwitches.delta
      )}.`
    );
  }

  if (keyFindings.length === 0) {
    keyFindings.push("No significant performance variances detected between runs.");
  }

  return {
    baseScenarioId: baseScenario.id,
    compareScenarioId: compareScenario.id,
    baseScenarioName: baseScenario.name,
    compareScenarioName: compareScenario.name,
    isSameScenario,
    scenarioMismatchWarning,
    statusComparison: {
      baseStatus: baseMetrics.status,
      compareStatus: compareMetrics.status,
      hasStatusChanged,
    },
    deadlockComparison: {
      baseIsDeadlocked: baseMetrics.isDeadlocked,
      compareIsDeadlocked: compareMetrics.isDeadlocked,
      resolutionStatus,
      summary: deadlockSummary,
    },
    metrics: {
      logicalTime,
      operationsCompleted,
      contextSwitches,
      totalBlockedTime,
      totalReadyTime,
      cpuUtilization,
    },
    threadComparisons,
    keyFindings,
  };
}
