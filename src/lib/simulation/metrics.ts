/**
 * OS Failure Lab - Simulation Analytics & Metrics Engine
 *
 * Implements deterministic performance metric derivation from actual SimulationSnapshot
 * and discrete event trace data:
 * - Logical execution clock metrics
 * - Operation completion counts
 * - Context switch counts
 * - Per-thread state residency (RUNNING, READY waiting, BLOCKED durations)
 * - Deadlock and contention telemetry
 * - Synchronization and shared memory utilization
 *
 * All measurements are derived strictly from recorded timestamps and state transitions.
 */

import type {
  SimulationSnapshot,
  SimulationStatus,
  ThreadState,
  ThreadDefinition,
  TraceEvent,
} from "./types";
import { detectDeadlock } from "./diagnostics";

/**
 * Detailed performance and timing telemetry for an individual simulated thread.
 */
export interface ThreadMetrics {
  threadId: string;
  threadName: string;
  priority: number;
  finalState: ThreadState;
  operationsCompleted: number;
  totalOperations: number;
  /** Number of logical ticks actively executing instructions on the CPU */
  runningTime: number;
  /** Number of logical ticks waiting in the READY queue for scheduler dispatch */
  readyTime: number;
  /** Number of logical ticks blocked on mutex locks or semaphore permits */
  blockedTime: number;
  /** Timestamp when the thread transitioned to DONE, or null if incomplete */
  completionTimestamp: number | null;
}

/**
 * Aggregated telemetry for synchronization and memory resources.
 */
export interface ResourceUtilizationMetrics {
  totalMemoryReads: number;
  totalMemoryWrites: number;
  sharedVariablesCount: number;
  variablesModifiedCount: number;
  lockAcquisitions: number;
  lockContentionEvents: number;
  semaphoreWaitEvents: number;
  semaphoreSignalEvents: number;
}

/**
 * Comprehensive metrics report derived from a SimulationSnapshot.
 */
export interface SimulationMetrics {
  /** Total elapsed logical simulation clock ticks */
  totalLogicalTime: number;
  /** Total operations successfully completed across all threads */
  totalOperationsCompleted: number;
  /** Total context switches executed by CPU scheduler */
  totalContextSwitches: number;
  /** Total number of threads configured in the scenario */
  totalThreads: number;
  /** Number of threads that have reached the DONE state */
  completedThreads: number;
  /** Number of threads currently in the BLOCKED state */
  blockedThreads: number;
  /** Number of threads currently in the READY queue */
  readyThreads: number;
  /** Cumulative logical ticks spent in the READY state across all threads */
  totalReadyTime: number;
  /** Cumulative logical ticks spent in the BLOCKED state across all threads */
  totalBlockedTime: number;
  /** Cumulative logical ticks spent in the RUNNING state on the CPU */
  totalRunningTime: number;
  /** Percentage of logical execution time CPU was busy (0% to 100%) */
  cpuUtilizationPercentage: number;
  /** Engine lifecycle status */
  status: SimulationStatus;
  /** Whether the simulation is in a circular wait deadlock */
  isDeadlocked: boolean;
  /** IDs of threads participating in deadlock cycles */
  deadlockedThreadIds: string[];
  /** IDs of locks involved in deadlock cycles */
  deadlockedLockIds: string[];
  /** Per-thread performance breakdown mapped by thread ID */
  threadMetrics: Record<string, ThreadMetrics>;
  /** Resource access and synchronization utilization telemetry */
  resourceMetrics: ResourceUtilizationMetrics;
}

/**
 * Derives accurate state intervals for each thread across [0, maxTime].
 * Each logical tick is classified as RUNNING, BLOCKED, READY, or DONE.
 */
function calculateThreadStateDurations(
  thread: ThreadDefinition,
  maxTime: number,
  eventTrace: TraceEvent[],
  finalState: ThreadState
): {
  runningTime: number;
  readyTime: number;
  blockedTime: number;
  completionTimestamp: number | null;
} {
  if (maxTime === 0) {
    return {
      runningTime: 0,
      readyTime: 0,
      blockedTime: 0,
      completionTimestamp: null,
    };
  }

  // Filter events belonging to this thread
  const threadEvents = eventTrace.filter((e) => e.threadId === thread.id);

  // Group events by timestamp
  const eventsByTick = new Map<number, TraceEvent[]>();
  for (const evt of threadEvents) {
    const list = eventsByTick.get(evt.timestamp) ?? [];
    list.push(evt);
    eventsByTick.set(evt.timestamp, list);
  }

  let runningTime = 0;
  let readyTime = 0;
  let blockedTime = 0;
  let completionTimestamp: number | null = null;

  let currentState: ThreadState = "READY"; // All threads start in READY queue

  for (let t = 0; t < maxTime; t++) {
    const tickEvents = eventsByTick.get(t) ?? [];

    for (const evt of tickEvents) {
      if (evt.eventType === "STATE_CHANGE") {
        const desc = evt.description.toLowerCase();
        if (desc.includes("running")) {
          currentState = "RUNNING";
        } else if (desc.includes("ready")) {
          currentState = "READY";
        } else if (desc.includes("blocked")) {
          currentState = "BLOCKED";
        } else if (desc.includes("done")) {
          currentState = "DONE";
          if (completionTimestamp === null) {
            completionTimestamp = t;
          }
        }
      } else if (evt.eventType === "LOCK_BLOCKED" || evt.eventType === "SEMAPHORE_WAIT") {
        currentState = "BLOCKED";
      } else if (
        evt.eventType === "OPERATION_START" ||
        evt.eventType === "MEMORY_READ" ||
        evt.eventType === "MEMORY_WRITE" ||
        evt.eventType === "LOCK_ACQUIRED"
      ) {
        currentState = "RUNNING";
      }
    }

    // Accumulate duration for tick t
    switch (currentState) {
      case "RUNNING":
        runningTime += 1;
        break;
      case "BLOCKED":
        blockedTime += 1;
        break;
      case "READY":
        readyTime += 1;
        break;
      case "DONE":
      default:
        // Completed threads do not accumulate waiting or blocked time
        break;
    }
  }

  // Check if completion occurred at the final tick
  if (finalState === "DONE" && completionTimestamp === null) {
    const doneEvt = threadEvents.find(
      (e) => e.eventType === "STATE_CHANGE" && e.description.toLowerCase().includes("done")
    );
    completionTimestamp = doneEvt ? doneEvt.timestamp : maxTime;
  }

  return {
    runningTime,
    readyTime,
    blockedTime,
    completionTimestamp,
  };
}

/**
 * Calculates complete, deterministic simulation metrics from an immutable SimulationSnapshot.
 *
 * @param snapshot The active SimulationSnapshot
 * @returns Fully populated SimulationMetrics structure
 */
export function calculateSimulationMetrics(
  snapshot: SimulationSnapshot
): SimulationMetrics {
  const maxTime = snapshot.logicalTime;
  const events = snapshot.eventTrace;

  // 1. Operation Completions
  const opsFromEvents = events.filter((e) => e.eventType === "OPERATION_COMPLETE").length;
  const opsFromThreads = snapshot.threads.reduce(
    (acc, t) => acc + t.currentOperationIndex,
    0
  );
  const totalOperationsCompleted = Math.max(opsFromEvents, opsFromThreads);

  // 2. Context Switches
  const totalContextSwitches = events.filter(
    (e) => e.eventType === "CONTEXT_SWITCH"
  ).length;

  // 3. Thread State Counts
  const totalThreads = snapshot.threads.length;
  const completedThreads = snapshot.threads.filter((t) => t.state === "DONE").length;
  const blockedThreads = snapshot.threads.filter((t) => t.state === "BLOCKED").length;
  const readyThreads = snapshot.readyQueue.length;

  // 4. Per-Thread Duration Accounting
  const threadMetrics: Record<string, ThreadMetrics> = {};
  let totalRunningTime = 0;
  let totalReadyTime = 0;
  let totalBlockedTime = 0;

  for (const thread of snapshot.threads) {
    const durations = calculateThreadStateDurations(
      thread,
      maxTime,
      events,
      thread.state
    );

    threadMetrics[thread.id] = {
      threadId: thread.id,
      threadName: thread.name,
      priority: thread.priority,
      finalState: thread.state,
      operationsCompleted: thread.currentOperationIndex,
      totalOperations: thread.operations.length,
      runningTime: durations.runningTime,
      readyTime: durations.readyTime,
      blockedTime: durations.blockedTime,
      completionTimestamp: durations.completionTimestamp,
    };

    totalRunningTime += durations.runningTime;
    totalReadyTime += durations.readyTime;
    totalBlockedTime += durations.blockedTime;
  }

  // 5. CPU Utilization Percentage (Single Virtual Core Model)
  // Max potential busy time is totalLogicalTime
  const cpuUtilizationPercentage =
    maxTime > 0
      ? Math.min(100, Math.round((totalRunningTime / maxTime) * 100))
      : 0;

  // 6. Deadlock Diagnostics
  const deadlockResult = detectDeadlock(snapshot);

  // 7. Resource Utilization Metrics
  const totalMemoryReads = events.filter((e) => e.eventType === "MEMORY_READ").length;
  const totalMemoryWrites = events.filter((e) => e.eventType === "MEMORY_WRITE").length;
  const lockAcquisitions = events.filter((e) => e.eventType === "LOCK_ACQUIRED").length;
  const lockContentionEvents = events.filter((e) => e.eventType === "LOCK_BLOCKED").length;
  const semaphoreWaitEvents = events.filter((e) => e.eventType === "SEMAPHORE_WAIT").length;
  const semaphoreSignalEvents = events.filter(
    (e) => e.eventType === "SEMAPHORE_SIGNAL"
  ).length;

  const sharedVariablesCount = snapshot.sharedVariables.length;
  const variablesModifiedCount = snapshot.sharedVariables.filter(
    (v) => v.currentValue !== v.initialValue
  ).length;

  const resourceMetrics: ResourceUtilizationMetrics = {
    totalMemoryReads,
    totalMemoryWrites,
    sharedVariablesCount,
    variablesModifiedCount,
    lockAcquisitions,
    lockContentionEvents,
    semaphoreWaitEvents,
    semaphoreSignalEvents,
  };

  return {
    totalLogicalTime: maxTime,
    totalOperationsCompleted,
    totalContextSwitches,
    totalThreads,
    completedThreads,
    blockedThreads,
    readyThreads,
    totalReadyTime,
    totalBlockedTime,
    totalRunningTime,
    cpuUtilizationPercentage,
    status: snapshot.status,
    isDeadlocked: deadlockResult.isDeadlocked || snapshot.status === "DEADLOCKED",
    deadlockedThreadIds: deadlockResult.deadlockedThreadIds,
    deadlockedLockIds: deadlockResult.deadlockedLockIds,
    threadMetrics,
    resourceMetrics,
  };
}
