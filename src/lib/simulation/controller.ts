/**
 * OS Failure Lab - Simulation Controller
 *
 * Deterministic simulation orchestration engine that coordinates thread selection,
 * dispatching, operation execution, time quantum tracking, and state progression.
 *
 * Invariants:
 * - Deterministic, discrete-event execution.
 * - Deep snapshot immutability.
 * - Round Robin time-slice quantum rotation.
 * - Graceful handling of blocked and terminal states.
 */

import type { SimulationSnapshot } from "./types";
import {
  selectNextThread,
  dispatchThread,
  preemptThread,
  executeNextOperation,
} from "./engine";
import { detectDeadlock } from "./diagnostics";

export interface ControllerOptions {
  /** Maximum number of trace events before terminating with STEP_LIMIT_REACHED (defaults to 1000) */
  maxSteps?: number;
}

/**
 * Advances the simulation by exactly one operation or lifecycle step.
 *
 * Orchestration Flow:
 * 1. Verify terminal states (COMPLETED, STEP_LIMIT_REACHED, DEADLOCKED).
 * 2. If no thread is currently active (activeThreadId is null):
 *    - Select the next eligible READY thread via configured scheduling policy.
 *    - If no thread is READY (e.g. all remaining threads are BLOCKED), do not complete; return snapshot.
 *    - Dispatch the selected thread to RUNNING.
 * 3. Execute the next pending operation for the active thread.
 * 4. In Round Robin scheduling, track time quantum consumption.
 *    - If the thread is still RUNNING and its quantum is consumed, preempt it back to the READY queue.
 *    - If the thread blocked or finished, preemption is bypassed.
 * 5. Update terminal states when all threads finish execution.
 *
 * @param snapshot The current immutable simulation snapshot
 * @param options Configuration options for execution boundaries
 * @returns A new immutable SimulationSnapshot after the step
 */
export function stepSimulation(
  snapshot: SimulationSnapshot,
  options?: ControllerOptions
): SimulationSnapshot {
  // 1. Guard against stepping on terminal states
  if (
    snapshot.status === "COMPLETED" ||
    snapshot.status === "STEP_LIMIT_REACHED" ||
    snapshot.status === "DEADLOCKED"
  ) {
    return snapshot;
  }

  // Check if all threads are already finished
  if (
    snapshot.threads.length > 0 &&
    snapshot.threads.every((t) => t.state === "DONE")
  ) {
    const completedSnapshot = structuredClone(snapshot);
    completedSnapshot.status = "COMPLETED";
    completedSnapshot.activeThreadId = null;
    return completedSnapshot;
  }

  // 2. Guard against infinite loop runaway (step limit)
  const maxSteps = options?.maxSteps ?? 1000;
  if (snapshot.eventTrace.length >= maxSteps) {
    const limitedSnapshot = structuredClone(snapshot);
    limitedSnapshot.status = "STEP_LIMIT_REACHED";
    limitedSnapshot.activeThreadId = null;
    limitedSnapshot.eventTrace.push({
      id: `evt-${limitedSnapshot.eventTrace.length + 1}`,
      timestamp: limitedSnapshot.logicalTime,
      threadId: "system",
      eventType: "STEP_LIMIT",
      description: `Execution safety limit of ${maxSteps} events reached. Simulation halted.`,
      affectedResource: null,
    });
    return limitedSnapshot;
  }

  let currentSnapshot: SimulationSnapshot = snapshot;

  // 3. If no thread is currently active on the CPU, select and dispatch the next eligible READY thread
  if (currentSnapshot.activeThreadId === null) {
    const nextThread = selectNextThread(currentSnapshot);

    // If no READY thread is available:
    if (!nextThread) {
      // Check if the stalled execution is caused by a circular wait deadlock
      const deadlockResult = detectDeadlock(currentSnapshot);
      if (deadlockResult.isDeadlocked) {
        const deadlockedSnapshot = structuredClone(currentSnapshot);
        deadlockedSnapshot.status = "DEADLOCKED";
        deadlockedSnapshot.activeThreadId = null;

        const cycleDescs = deadlockResult.cycles
          .map((c) => c.threadIds.join(" -> "))
          .join("; ");

        deadlockedSnapshot.eventTrace.push({
          id: `evt-${deadlockedSnapshot.eventTrace.length + 1}`,
          timestamp: deadlockedSnapshot.logicalTime,
          threadId: deadlockResult.deadlockedThreadIds[0] ?? "system",
          eventType: "DEADLOCK_DETECTED",
          description: `Deadlock detected: Circular wait cycle [${cycleDescs}] on locks [${deadlockResult.deadlockedLockIds.join(", ")}]`,
          affectedResource: deadlockResult.deadlockedLockIds[0] ?? null,
        });

        return deadlockedSnapshot;
      }

      // No READY threads, but not deadlocked (e.g. unresolved semaphore blocking or idle)
      return currentSnapshot;
    }

    currentSnapshot = dispatchThread(currentSnapshot, nextThread.id);
  }

  // 4. If a thread is active, execute its next discrete operation
  if (currentSnapshot.activeThreadId !== null) {
    const threadIdToExecute = currentSnapshot.activeThreadId;
    currentSnapshot = executeNextOperation(currentSnapshot, threadIdToExecute);

    // Check if the executed operation immediately resulted in a circular wait deadlock
    if (
      currentSnapshot.status !== "DEADLOCKED" &&
      currentSnapshot.status !== "COMPLETED" &&
      currentSnapshot.activeThreadId === null &&
      currentSnapshot.readyQueue.length === 0 &&
      currentSnapshot.threads.some((t) => t.state === "BLOCKED")
    ) {
      const deadlockResult = detectDeadlock(currentSnapshot);
      if (deadlockResult.isDeadlocked) {
        currentSnapshot = structuredClone(currentSnapshot);
        currentSnapshot.status = "DEADLOCKED";
        currentSnapshot.activeThreadId = null;

        const cycleDescs = deadlockResult.cycles
          .map((c) => c.threadIds.join(" -> "))
          .join("; ");

        currentSnapshot.eventTrace.push({
          id: `evt-${currentSnapshot.eventTrace.length + 1}`,
          timestamp: currentSnapshot.logicalTime,
          threadId: deadlockResult.deadlockedThreadIds[0] ?? "system",
          eventType: "DEADLOCK_DETECTED",
          description: `Deadlock detected: Circular wait cycle [${cycleDescs}] on locks [${deadlockResult.deadlockedLockIds.join(", ")}]`,
          affectedResource: deadlockResult.deadlockedLockIds[0] ?? null,
        });

        return currentSnapshot;
      }
    }

    // 5. Round Robin quantum handling
    if (currentSnapshot.schedulingPolicy === "ROUND_ROBIN") {
      // Only preempt if the thread is still active and RUNNING
      // Do NOT preempt blocked or completed threads (their activeThreadId is already null)
      if (currentSnapshot.activeThreadId === threadIdToExecute) {
        const activeThread = currentSnapshot.threads.find(
          (t) => t.id === threadIdToExecute
        );

        if (activeThread && activeThread.state === "RUNNING") {
          const quantum = currentSnapshot.timeQuantum ?? 1;
          const used = (currentSnapshot.activeThreadQuantumUsed ?? 0) + 1;

          if (used >= quantum) {
            // Quantum expired: preempt running thread to tail of ready queue
            currentSnapshot = preemptThread(
              currentSnapshot,
              threadIdToExecute
            );
            currentSnapshot.activeThreadQuantumUsed = 0;
          } else {
            // Still within quantum: update quantum counter
            currentSnapshot = structuredClone(currentSnapshot);
            currentSnapshot.activeThreadQuantumUsed = used;
          }
        }
      }
    }
  }

  // 6. Check overall completion after operation execution
  // Do NOT label a simulation COMPLETED when unfinished threads remain blocked
  if (
    currentSnapshot.threads.length > 0 &&
    currentSnapshot.threads.every((t) => t.state === "DONE")
  ) {
    if (currentSnapshot.status !== "COMPLETED") {
      currentSnapshot = structuredClone(currentSnapshot);
      currentSnapshot.status = "COMPLETED";
      currentSnapshot.activeThreadId = null;
    }
  }

  return currentSnapshot;
}
