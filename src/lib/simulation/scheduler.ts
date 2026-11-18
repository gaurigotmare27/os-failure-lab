/**
 * OS Failure Lab - CPU Scheduler
 *
 * Implements deterministic CPU scheduling algorithms for thread selection:
 * 1. FCFS (First-Come, First-Served)
 * 2. ROUND_ROBIN (Time-sliced FIFO rotation)
 * 3. PRIORITY (Preemptive/Non-preemptive priority selection with stable tie-breaking)
 *
 * All policies guarantee:
 * - Never schedule BLOCKED, DONE, or NEW threads.
 * - Safely handle empty ready queues.
 * - Preserve stable ordering for equal priorities.
 */

import type { ThreadDefinition, SchedulingPolicy } from "./types";

/**
 * Creates a fast lookup Map of thread definitions by thread ID.
 */
function getThreadMap(threads: ThreadDefinition[]): Map<string, ThreadDefinition> {
  const map = new Map<string, ThreadDefinition>();
  for (const thread of threads) {
    map.set(thread.id, thread);
  }
  return map;
}

/**
 * 1. FCFS (First-Come, First-Served) Scheduling
 *
 * Selects the thread at the head of the ready queue based strictly on arrival order.
 * Scans from the front to find the first eligible thread in READY state.
 *
 * @param readyQueue Ordered FIFO queue of thread IDs
 * @param threads Current thread definitions in the simulation
 * @returns ID of the selected thread, or null if no eligible READY thread exists
 */
export function scheduleFCFS(
  readyQueue: string[],
  threads: ThreadDefinition[]
): string | null {
  if (!readyQueue || readyQueue.length === 0) {
    return null;
  }

  const threadMap = getThreadMap(threads);

  for (const threadId of readyQueue) {
    const thread = threadMap.get(threadId);
    if (thread && thread.state === "READY") {
      return thread.id;
    }
  }

  return null;
}

/**
 * 2. ROUND_ROBIN Scheduling
 *
 * Selects the thread at the front of the ready queue in FIFO order.
 *
 * Note on Quantum Rotation:
 * This scheduler preserves FIFO ready queue ordering during thread selection.
 * Time-quantum rotation, slice tracking, and returning expired threads to the
 * tail of the ready queue are handled by preemptThread() and the future
 * execution engine loop.
 *
 * @param readyQueue Ordered FIFO queue of thread IDs
 * @param threads Current thread definitions in the simulation
 * @returns ID of the selected thread, or null if no eligible READY thread exists
 */
export function scheduleRoundRobin(
  readyQueue: string[],
  threads: ThreadDefinition[]
): string | null {
  if (!readyQueue || readyQueue.length === 0) {
    return null;
  }

  const threadMap = getThreadMap(threads);

  for (const threadId of readyQueue) {
    const thread = threadMap.get(threadId);
    if (thread && thread.state === "READY") {
      return thread.id;
    }
  }

  return null;
}

/**
 * 3. PRIORITY Scheduling
 *
 * Selects the READY thread with the highest numerical priority value.
 * When multiple threads have equal highest priority, stable ordering is maintained
 * by selecting the one that appears earliest in the ready queue (earliest arrival / FIFO).
 *
 * Note on Preemption:
 * Priority selection evaluates eligible threads at dispatch time. Actual preemption
 * of a lower-priority running thread (for example, when a higher-priority thread
 * unblocks or enters the ready queue) must be handled separately by the execution engine
 * invoking preemptThread() before dispatching.
 *
 * @param readyQueue Ordered FIFO queue of thread IDs
 * @param threads Current thread definitions in the simulation
 * @returns ID of the selected highest-priority READY thread, or null if none
 */
export function schedulePriority(
  readyQueue: string[],
  threads: ThreadDefinition[]
): string | null {
  if (!readyQueue || readyQueue.length === 0) {
    return null;
  }

  const threadMap = getThreadMap(threads);

  let highestPriority = -Infinity;
  let selectedThreadId: string | null = null;

  for (const threadId of readyQueue) {
    const thread = threadMap.get(threadId);
    // Never schedule BLOCKED or DONE threads
    if (thread && thread.state === "READY") {
      if (thread.priority > highestPriority) {
        highestPriority = thread.priority;
        selectedThreadId = thread.id;
      }
      // If priorities are equal, we preserve the existing selectedThreadId,
      // guaranteeing stable FIFO tie-breaking based on readyQueue arrival order.
    }
  }

  return selectedThreadId;
}

/**
 * Main Scheduling Dispatcher
 *
 * Selects the next thread ID to execute based on the specified scheduling policy.
 *
 * @param policy The active scheduling policy ("FCFS" | "ROUND_ROBIN" | "PRIORITY")
 * @param readyQueue Ordered list of thread IDs
 * @param threads List of thread definitions
 * @returns The ID of the next thread to run, or null if no thread is ready
 */
export function schedule(
  policy: SchedulingPolicy,
  readyQueue: string[],
  threads: ThreadDefinition[]
): string | null {
  switch (policy) {
    case "FCFS":
      return scheduleFCFS(readyQueue, threads);
    case "ROUND_ROBIN":
      return scheduleRoundRobin(readyQueue, threads);
    case "PRIORITY":
      return schedulePriority(readyQueue, threads);
    default:
      return scheduleRoundRobin(readyQueue, threads);
  }
}
