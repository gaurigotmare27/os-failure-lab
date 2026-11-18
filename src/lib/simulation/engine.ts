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

import type {
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
export { executeNextOperation } from "./operations";

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
    activeThreadQuantumUsed: 0,
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
 * Correctness Invariants:
 * - Only threads whose state is READY can be dispatched.
 * - Confirms that the thread exists in the readyQueue.
 * - Never dispatches BLOCKED, DONE, or NEW threads.
 * - If another thread is currently RUNNING, requires it to be preempted first.
 * - Returns an unchanged snapshot for invalid dispatches.
 *
 * @param snapshot The current simulation snapshot
 * @param threadId The ID of the thread to dispatch
 * @returns A new SimulationSnapshot with the thread running, or unchanged snapshot if invalid
 */
export function dispatchThread(
  snapshot: SimulationSnapshot,
  threadId: string
): SimulationSnapshot {
  // If another thread is currently RUNNING, require it to be preempted first.
  if (snapshot.activeThreadId !== null) {
    return snapshot;
  }
  const hasRunningThread = snapshot.threads.some((t) => t.state === "RUNNING");
  if (hasRunningThread) {
    return snapshot;
  }

  // Confirm target thread exists
  const targetThread = snapshot.threads.find((t) => t.id === threadId);
  if (!targetThread) {
    return snapshot;
  }

  // Only dispatch threads whose state is READY (never BLOCKED, DONE, or NEW)
  if (targetThread.state !== "READY" || snapshot.threadStates[threadId] !== "READY") {
    return snapshot;
  }

  // Confirm that the thread exists in the readyQueue
  if (!snapshot.readyQueue.includes(threadId)) {
    return snapshot;
  }

  // Deep clone to maintain state immutability
  const nextSnapshot: SimulationSnapshot = structuredClone(snapshot);

  const clonedTargetThread = nextSnapshot.threads.find((t) => t.id === threadId);
  if (!clonedTargetThread) {
    return snapshot;
  }

  // Remove the dispatched thread from the ready queue
  nextSnapshot.readyQueue = nextSnapshot.readyQueue.filter((id) => id !== threadId);

  // Record Context-Switch trace event
  const contextSwitchEvent: TraceEvent = {
    id: `evt-${nextSnapshot.eventTrace.length + 1}`,
    timestamp: nextSnapshot.logicalTime,
    threadId: threadId,
    eventType: "CONTEXT_SWITCH",
    description: `CPU dispatched to Thread '${clonedTargetThread.name}'`,
    affectedResource: null,
  };
  nextSnapshot.eventTrace.push(contextSwitchEvent);

  // Transition thread to RUNNING state
  clonedTargetThread.state = "RUNNING";
  clonedTargetThread.waitingReason = null;
  nextSnapshot.threadStates[threadId] = "RUNNING";

  const stateChangeEvent: TraceEvent = {
    id: `evt-${nextSnapshot.eventTrace.length + 1}`,
    timestamp: nextSnapshot.logicalTime,
    threadId: threadId,
    eventType: "STATE_CHANGE",
    description: `Thread '${clonedTargetThread.name}' transitioned from READY to RUNNING`,
    affectedResource: null,
  };
  nextSnapshot.eventTrace.push(stateChangeEvent);

  nextSnapshot.activeThreadId = threadId;
  nextSnapshot.activeThreadQuantumUsed = 0;

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
 * Correctness Invariants:
 * - Only preempts the currently active RUNNING thread.
 * - Confirms activeThreadId matches threadId.
 * - Returns unchanged snapshot for invalid requests.
 * - Moves a successfully preempted thread to the end of the READY queue without duplicates.
 *
 * @param snapshot The current simulation snapshot
 * @param threadId The ID of the thread to preempt
 * @returns A new SimulationSnapshot with the thread preempted and re-queued, or unchanged snapshot
 */
export function preemptThread(
  snapshot: SimulationSnapshot,
  threadId: string
): SimulationSnapshot {
  // Confirm activeThreadId matches threadId
  if (!snapshot.activeThreadId || snapshot.activeThreadId !== threadId) {
    return snapshot;
  }

  // Confirm target thread exists and is currently RUNNING
  const targetThread = snapshot.threads.find((t) => t.id === threadId);
  if (
    !targetThread ||
    targetThread.state !== "RUNNING" ||
    snapshot.threadStates[threadId] !== "RUNNING"
  ) {
    return snapshot;
  }

  // Deep clone to maintain state immutability
  const nextSnapshot: SimulationSnapshot = structuredClone(snapshot);

  const clonedTargetThread = nextSnapshot.threads.find((t) => t.id === threadId);
  if (!clonedTargetThread) {
    return snapshot;
  }

  // Transition thread from RUNNING back to READY
  clonedTargetThread.state = "READY";
  nextSnapshot.threadStates[threadId] = "READY";

  // Move a successfully preempted thread to the end of the READY queue without duplicates
  nextSnapshot.readyQueue = [
    ...nextSnapshot.readyQueue.filter((id) => id !== threadId),
    threadId,
  ];

  const preemptionEvent: TraceEvent = {
    id: `evt-${nextSnapshot.eventTrace.length + 1}`,
    timestamp: nextSnapshot.logicalTime,
    threadId: threadId,
    eventType: "STATE_CHANGE",
    description: `Thread '${clonedTargetThread.name}' preempted and returned to READY queue`,
    affectedResource: null,
  };
  nextSnapshot.eventTrace.push(preemptionEvent);

  // Clear activeThreadId
  nextSnapshot.activeThreadId = null;
  nextSnapshot.activeThreadQuantumUsed = 0;

  return nextSnapshot;
}
