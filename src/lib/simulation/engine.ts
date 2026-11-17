/**
 * OS Failure Lab - Core Simulation Engine
 *
 * Provides discrete-event execution primitives, snapshot initialization,
 * thread scheduling, dispatching, and preemption.
 *
 * Invariants:
 * - Deterministic execution.
 * - Deep immutability: Original scenario and previous snapshots are never mutated.
 * - Framework-agnostic: Completely decoupled from React and browser APIs.
 */

import {
  Scenario,
  SimulationSnapshot,
  ThreadDefinition,
  ThreadState,
  TraceEvent,
  ThreadRegisters,
  SharedVariableDefinition,
  SemaphoreDefinition,
} from "./types";
import { schedule } from "./scheduler";

/**
 * 1. createInitialSnapshot
 *
 * Constructs the initial immutable SimulationSnapshot from a given Scenario.
 * Deep-clones all scenario structures, initializes registers, ready queues,
 * and sets the engine state to IDLE at logical time 0.
 *
 * @param scenario The initial scenario specification
 * @returns Complete deterministic SimulationSnapshot at time 0
 */
export function createInitialSnapshot(scenario: Scenario): SimulationSnapshot {
  // Deep clone to guarantee isolation from the original scenario object
  const clonedScenario: Scenario = structuredClone(scenario);

  // Initialize per-thread states and independent CPU register files
  const threadStates: Record<string, ThreadState> = {};
  const threadRegisters: ThreadRegisters = {};

  for (const thread of clonedScenario.threads) {
    threadStates[thread.id] = thread.state;
    threadRegisters[thread.id] = {};
  }

  // Populate the ready queue with all threads initially in READY state
  const readyQueue: string[] = clonedScenario.threads
    .filter((t) => t.state === "READY")
    .map((t) => t.id);

  // Initialize lock ownership map (all locks unowned initially)
  const lockOwnership: Record<string, string | null> = {};
  for (const lock of clonedScenario.locks) {
    lockOwnership[lock.id] = lock.ownerThreadId ?? null;
  }

  // Copy shared variables with initial values
  const sharedVariables: SharedVariableDefinition[] = (
    clonedScenario.sharedVariables ?? []
  ).map((v) => ({
    ...v,
    currentValue: v.initialValue,
  }));

  // Copy semaphores with initial permits and empty wait queues
  const semaphores: SemaphoreDefinition[] = (
    clonedScenario.semaphores ?? []
  ).map((s) => ({
    ...s,
    currentValue: s.initialValue,
    waitingQueue: [...s.waitingQueue],
  }));

  return {
    logicalTime: 0,
    status: "IDLE",
    schedulingPolicy: clonedScenario.schedulingPolicy,
    timeQuantum: clonedScenario.timeQuantum,
    threadStates,
    threads: clonedScenario.threads,
    lockOwnership,
    locks: clonedScenario.locks,
    resources: clonedScenario.resources,
    sharedVariables,
    semaphores,
    threadRegisters,
    readyQueue,
    activeThreadId: null,
    eventTrace: [],
  };
}

/**
 * 2. selectNextThread
 *
 * Selects the next eligible thread to execute according to the snapshot's
 * configured CPU scheduling policy.
 *
 * @param snapshot The current simulation snapshot
 * @returns The selected ThreadDefinition, or null if no eligible READY thread exists
 */
export function selectNextThread(
  snapshot: SimulationSnapshot
): ThreadDefinition | null {
  const selectedThreadId = schedule(
    snapshot.schedulingPolicy,
    snapshot.readyQueue,
    snapshot.threads
  );

  if (!selectedThreadId) {
    return null;
  }

  const thread = snapshot.threads.find((t) => t.id === selectedThreadId);
  return thread ?? null;
}

/**
 * 3. dispatchThread
 *
 * Transitions the selected thread to the RUNNING state, removes it from the
 * ready queue, assigns activeThreadId, and logs context-switch and state-change
 * events into the event trace.
 *
 * @param snapshot The current simulation snapshot
 * @param threadId The ID of the thread to dispatch
 * @returns A new SimulationSnapshot with the thread running
 */
export function dispatchThread(
  snapshot: SimulationSnapshot,
  threadId: string
): SimulationSnapshot {
  // Deep clone to maintain state immutability
  const nextSnapshot: SimulationSnapshot = structuredClone(snapshot);

  const targetThread = nextSnapshot.threads.find((t) => t.id === threadId);
  if (!targetThread) {
    return nextSnapshot;
  }

  const previousThreadId = nextSnapshot.activeThreadId;

  // Record Context-Switch trace event if switching between different threads
  if (previousThreadId !== threadId) {
    const contextSwitchEvent: TraceEvent = {
      id: `evt-${nextSnapshot.eventTrace.length + 1}`,
      timestamp: nextSnapshot.logicalTime,
      threadId: threadId,
      eventType: "CONTEXT_SWITCH",
      description: previousThreadId
        ? `Context switch: CPU switched from Thread '${previousThreadId}' to Thread '${targetThread.name}'`
        : `CPU dispatched to Thread '${targetThread.name}'`,
      affectedResource: null,
    };
    nextSnapshot.eventTrace.push(contextSwitchEvent);
  }

  // Remove the dispatched thread from the ready queue
  nextSnapshot.readyQueue = nextSnapshot.readyQueue.filter((id) => id !== threadId);

  // Update thread state to RUNNING
  if (targetThread.state !== "RUNNING") {
    targetThread.state = "RUNNING";
    targetThread.waitingReason = null;
    nextSnapshot.threadStates[threadId] = "RUNNING";

    const stateChangeEvent: TraceEvent = {
      id: `evt-${nextSnapshot.eventTrace.length + 1}`,
      timestamp: nextSnapshot.logicalTime,
      threadId: threadId,
      eventType: "STATE_CHANGE",
      description: `Thread '${targetThread.name}' transitioned from READY to RUNNING`,
      affectedResource: null,
    };
    nextSnapshot.eventTrace.push(stateChangeEvent);
  }

  nextSnapshot.activeThreadId = threadId;

  // Transition simulation status from IDLE to RUNNING upon first dispatch
  if (nextSnapshot.status === "IDLE") {
    nextSnapshot.status = "RUNNING";
  }

  return nextSnapshot;
}

/**
 * 4. preemptThread
 *
 * Preempts an actively running thread, transitioning it back to READY state
 * and appending it to the end of the ready queue for fair scheduling rotation.
 *
 * @param snapshot The current simulation snapshot
 * @param threadId The ID of the thread to preempt
 * @returns A new SimulationSnapshot with the thread preempted and re-queued
 */
export function preemptThread(
  snapshot: SimulationSnapshot,
  threadId: string
): SimulationSnapshot {
  // Deep clone to maintain state immutability
  const nextSnapshot: SimulationSnapshot = structuredClone(snapshot);

  const targetThread = nextSnapshot.threads.find((t) => t.id === threadId);
  if (!targetThread) {
    return nextSnapshot;
  }

  // Only preempt threads currently in RUNNING state
  if (targetThread.state === "RUNNING") {
    targetThread.state = "READY";
    nextSnapshot.threadStates[threadId] = "READY";

    // Add back to the tail of the ready queue for FIFO rotation
    if (!nextSnapshot.readyQueue.includes(threadId)) {
      nextSnapshot.readyQueue.push(threadId);
    }

    const preemptionEvent: TraceEvent = {
      id: `evt-${nextSnapshot.eventTrace.length + 1}`,
      timestamp: nextSnapshot.logicalTime,
      threadId: threadId,
      eventType: "STATE_CHANGE",
      description: `Thread '${targetThread.name}' preempted and returned to READY queue`,
      affectedResource: null,
    };
    nextSnapshot.eventTrace.push(preemptionEvent);

    if (nextSnapshot.activeThreadId === threadId) {
      nextSnapshot.activeThreadId = null;
    }
  }

  return nextSnapshot;
}
