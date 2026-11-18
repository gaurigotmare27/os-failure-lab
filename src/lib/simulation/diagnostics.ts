/**
 * OS Failure Lab - Concurrency Diagnostics Engine
 *
 * Implements formal operating system concurrency failure analysis:
 * 1. Wait-For Graph (WFG) Construction for resource allocation dependencies.
 * 2. Directed Cycle Detection using Depth-First Search (DFS) for Coffman's circular wait.
 * 3. No-Progress and Livelock/Unresolved Blocking Detection.
 * 4. Comprehensive Concurrency Diagnostics Reporting (Lock Ordering Violations, Contention, Mitigations).
 *
 * Invariants:
 * - Deterministic analysis.
 * - Decoupled from React and UI rendering.
 * - Deep snapshot immutability (read-only analysis).
 * - Distinguishes between mutex deadlocks and counting semaphore synchronization waits.
 */

import type {
  SimulationSnapshot,
  ThreadState,
  ThreadDefinition,
  LockDefinition,
} from "./types";

/**
 * Node in the Wait-For Graph representing an OS thread.
 */
export interface WaitForGraphNode {
  threadId: string;
  threadName: string;
  state: ThreadState;
  priority: number;
  heldLocks: string[];
}

/**
 * Directed edge in the Wait-For Graph:
 * fromThreadId (waiting thread) -> toThreadId (thread currently holding the requested lock)
 */
export interface WaitForEdge {
  fromThreadId: string;
  toThreadId: string;
  lockId: string;
  lockName: string;
}

/**
 * Wait-For Graph structure representing thread-lock resource dependencies.
 */
export interface WaitForGraph {
  nodes: WaitForGraphNode[];
  edges: WaitForEdge[];
  adjacencyList: Record<string, WaitForEdge[]>;
}

/**
 * A detected circular wait cycle among threads and locks.
 */
export interface DeadlockCycle {
  threadIds: string[];
  lockIds: string[];
  edges: WaitForEdge[];
}

/**
 * Result of deadlock cycle detection.
 */
export interface DeadlockDetectionResult {
  isDeadlocked: boolean;
  cycles: DeadlockCycle[];
  deadlockedThreadIds: string[];
  deadlockedLockIds: string[];
}

/**
 * Analysis of simulation progression and thread readiness.
 */
export interface NoProgressAnalysis {
  isNoProgress: boolean;
  reason: "NONE" | "DEADLOCK" | "UNRESOLVED_BLOCKING" | "COMPLETED";
  readyThreadIds: string[];
  runningThreadIds: string[];
  blockedThreadIds: string[];
  doneThreadIds: string[];
  description: string;
}

/**
 * High-level simulation health and concurrency condition.
 */
export type SimulationCondition =
  | "NORMAL_EXECUTION"
  | "DEADLOCK"
  | "UNRESOLVED_BLOCKING"
  | "MUTEX_CONTENTION"
  | "COMPLETED";

/**
 * Complete structured diagnostic report for the simulation.
 */
export interface SimulationDiagnosticReport {
  condition: SimulationCondition;
  isDeadlocked: boolean;
  isNoProgress: boolean;
  involvedThreadIds: string[];
  involvedLockIds: string[];
  waitForGraph: WaitForGraph;
  summary: string;
  explanation: string;
  suggestedTechnique: string;
  contentionDetails?: {
    contendedLockIds: string[];
    waitingThreadIds: string[];
  };
}

/**
 * TASK 2: Builds the directed Wait-For Graph from the simulation snapshot.
 *
 * Rules:
 * - Each thread is represented as a graph node.
 * - For a BLOCKED thread waiting for a mutex lock, identify the lock owner.
 * - Create a directed edge from the waiting thread to the lock-owning thread.
 * - Store the associated lock ID and lock name on each edge.
 * - Ignore edges without a valid lock owner.
 * - Avoid reporting ordinary semaphore waiting as a mutex deadlock.
 *
 * @param snapshot The current immutable simulation snapshot
 * @returns The complete Wait-For Graph structure
 */
export function buildWaitForGraph(snapshot: SimulationSnapshot): WaitForGraph {
  const nodes: WaitForGraphNode[] = snapshot.threads.map((t) => ({
    threadId: t.id,
    threadName: t.name,
    state: t.state,
    priority: t.priority,
    heldLocks: [...t.heldLocks],
  }));

  const edges: WaitForEdge[] = [];
  const adjacencyList: Record<string, WaitForEdge[]> = {};

  for (const node of nodes) {
    adjacencyList[node.threadId] = [];
  }

  // Fast lookup of locks by ID
  const lockMap = new Map<string, LockDefinition>();
  for (const lock of snapshot.locks) {
    lockMap.set(lock.id, lock);
  }

  // Identify blocked threads waiting on mutex locks
  for (const thread of snapshot.threads) {
    if (thread.state !== "BLOCKED") {
      continue;
    }

    // Determine target lock from lock waiting queues and current operation
    const targetLocks: LockDefinition[] = [];

    // Source 1: Check locks where this thread is in the waitingQueue
    for (const lock of snapshot.locks) {
      if (lock.waitingQueue.includes(thread.id)) {
        targetLocks.push(lock);
      }
    }

    // Source 2: Check current pending operation if it is ACQUIRE_LOCK
    const currentOp = thread.operations[thread.currentOperationIndex];
    if (currentOp && currentOp.type === "ACQUIRE_LOCK" && currentOp.resourceId) {
      const lockFromOp = snapshot.locks.find(
        (l) => l.id === currentOp.resourceId || l.name === currentOp.resourceId
      );
      if (lockFromOp && !targetLocks.some((l) => l.id === lockFromOp.id)) {
        targetLocks.push(lockFromOp);
      }
    }

    // For each contended lock, identify the owning thread and construct directed edge
    for (const lock of targetLocks) {
      const ownerId = lock.ownerThreadId;
      // Ignore edges without a valid owner, or self-dependencies
      if (
        ownerId !== null &&
        ownerId !== thread.id &&
        snapshot.threads.some((t) => t.id === ownerId)
      ) {
        // Prevent duplicate edges
        const edgeExists = edges.some(
          (e) =>
            e.fromThreadId === thread.id &&
            e.toThreadId === ownerId &&
            e.lockId === lock.id
        );

        if (!edgeExists) {
          const newEdge: WaitForEdge = {
            fromThreadId: thread.id,
            toThreadId: ownerId,
            lockId: lock.id,
            lockName: lock.name,
          };
          edges.push(newEdge);
          adjacencyList[thread.id]?.push(newEdge);
        }
      }
    }
  }

  return {
    nodes,
    edges,
    adjacencyList,
  };
}

/**
 * TASK 3: Cycle Detection via Depth-First Search (DFS).
 *
 * Traverses the Wait-For Graph to discover directed cycles representing
 * Coffman's circular wait condition.
 *
 * @param snapshot The current immutable simulation snapshot
 * @returns Complete deadlock cycle detection results
 */
export function detectDeadlock(
  snapshot: SimulationSnapshot
): DeadlockDetectionResult {
  const graph = buildWaitForGraph(snapshot);
  const cycles: DeadlockCycle[] = [];
  const visited: Record<string, boolean> = {};
  const inStack: Record<string, boolean> = {};
  const currentPath: { threadId: string; edge?: WaitForEdge }[] = [];
  const seenCycleKeys = new Set<string>();

  function dfs(u: string) {
    visited[u] = true;
    inStack[u] = true;
    currentPath.push({ threadId: u });

    const outgoingEdges = graph.adjacencyList[u] || [];
    for (const edge of outgoingEdges) {
      const v = edge.toThreadId;

      if (!visited[v]) {
        currentPath[currentPath.length - 1].edge = edge;
        dfs(v);
      } else if (inStack[v]) {
        // Cycle detected: back-edge from u to v
        currentPath[currentPath.length - 1].edge = edge;

        const cycleStartIndex = currentPath.findIndex(
          (item) => item.threadId === v
        );

        if (cycleStartIndex !== -1) {
          const cycleSlice = currentPath.slice(cycleStartIndex);
          const cycleThreadIds = cycleSlice.map((item) => item.threadId);
          const fullCycleThreadIds = [...cycleThreadIds, v];

          const cycleEdges: WaitForEdge[] = [];
          const cycleLockIds = new Set<string>();

          for (let i = 0; i < cycleSlice.length; i++) {
            const nextNode = cycleSlice[(i + 1) % cycleSlice.length].threadId;
            const matchingEdge =
              (graph.adjacencyList[cycleSlice[i].threadId] || []).find(
                (e) => e.toThreadId === nextNode
              ) ?? cycleSlice[i].edge;

            if (matchingEdge) {
              cycleEdges.push(matchingEdge);
              cycleLockIds.add(matchingEdge.lockId);
            }
          }

          // Canonical key for deduplicating identical rotated cycles
          const canonicalKey = [...cycleThreadIds].sort().join(",");
          if (!seenCycleKeys.has(canonicalKey)) {
            seenCycleKeys.add(canonicalKey);
            cycles.push({
              threadIds: fullCycleThreadIds,
              lockIds: Array.from(cycleLockIds),
              edges: cycleEdges,
            });
          }
        }
      }
    }

    currentPath.pop();
    inStack[u] = false;
  }

  for (const node of graph.nodes) {
    if (!visited[node.threadId]) {
      dfs(node.threadId);
    }
  }

  const deadlockedThreadIds = Array.from(
    new Set(cycles.flatMap((c) => c.threadIds.slice(0, -1)))
  );
  const deadlockedLockIds = Array.from(
    new Set(cycles.flatMap((c) => c.lockIds))
  );

  return {
    isDeadlocked: cycles.length > 0,
    cycles,
    deadlockedThreadIds,
    deadlockedLockIds,
  };
}

/**
 * TASK 4: Evaluates execution progress and non-progress conditions.
 *
 * Rules:
 * - Identifies READY, RUNNING, and BLOCKED threads.
 * - Detects when no thread can currently execute.
 * - If all remaining unfinished threads are BLOCKED, reports a no-progress condition.
 * - Only classifies as DEADLOCK when a valid circular dependency exists in the WFG.
 * - Otherwise reports UNRESOLVED_BLOCKING.
 *
 * @param snapshot The current immutable simulation snapshot
 * @returns No-progress diagnostic details
 */
export function analyzeNoProgress(
  snapshot: SimulationSnapshot
): NoProgressAnalysis {
  const readyThreads = snapshot.threads.filter((t) => t.state === "READY");
  const runningThreads = snapshot.threads.filter((t) => t.state === "RUNNING");
  const blockedThreads = snapshot.threads.filter((t) => t.state === "BLOCKED");
  const doneThreads = snapshot.threads.filter((t) => t.state === "DONE");

  const readyThreadIds = readyThreads.map((t) => t.id);
  const runningThreadIds = runningThreads.map((t) => t.id);
  const blockedThreadIds = blockedThreads.map((t) => t.id);
  const doneThreadIds = doneThreads.map((t) => t.id);

  // Normal terminal completion
  if (
    doneThreads.length === snapshot.threads.length &&
    snapshot.threads.length > 0
  ) {
    return {
      isNoProgress: false,
      reason: "COMPLETED",
      readyThreadIds,
      runningThreadIds,
      blockedThreadIds,
      doneThreadIds,
      description: "All threads have completed execution successfully.",
    };
  }

  // Active or ready execution exists
  const canExecute =
    readyThreads.length > 0 ||
    runningThreads.length > 0 ||
    snapshot.activeThreadId !== null;

  if (canExecute) {
    return {
      isNoProgress: false,
      reason: "NONE",
      readyThreadIds,
      runningThreadIds,
      blockedThreadIds,
      doneThreadIds,
      description: "Threads are actively executing or queued for CPU dispatch.",
    };
  }

  // No active/ready thread. Check if remaining threads are blocked
  const unfinishedCount = snapshot.threads.length - doneThreads.length;
  if (blockedThreads.length > 0 && blockedThreads.length === unfinishedCount) {
    const deadlock = detectDeadlock(snapshot);

    if (deadlock.isDeadlocked) {
      return {
        isNoProgress: true,
        reason: "DEADLOCK",
        readyThreadIds,
        runningThreadIds,
        blockedThreadIds,
        doneThreadIds,
        description: `Simulation halted: Circular wait deadlock detected among threads [${deadlock.deadlockedThreadIds.join(", ")}].`,
      };
    }

    return {
      isNoProgress: true,
      reason: "UNRESOLVED_BLOCKING",
      readyThreadIds,
      runningThreadIds,
      blockedThreadIds,
      doneThreadIds,
      description: `Simulation stalled: All ${blockedThreads.length} remaining threads are BLOCKED, but no circular wait graph cycle exists. Threads may be awaiting semaphore permits that will never be signaled.`,
    };
  }

  return {
    isNoProgress: false,
    reason: "NONE",
    readyThreadIds,
    runningThreadIds,
    blockedThreadIds,
    doneThreadIds,
    description: "Simulation is idle or waiting for external dispatch.",
  };
}

/**
 * Checks for Lock Ordering Violations across thread operation definitions.
 * Evaluates whether two threads acquire common mutex locks in conflicting sequences.
 */
function checkLockOrderingViolation(threads: ThreadDefinition[]): {
  hasViolation: boolean;
  conflictingLocks: string[];
  explanation?: string;
} {
  const threadLockOrders: { threadId: string; threadName: string; locks: string[] }[] = [];

  for (const thread of threads) {
    const locks: string[] = [];
    for (const op of thread.operations) {
      if (op.type === "ACQUIRE_LOCK" && op.resourceId) {
        if (!locks.includes(op.resourceId)) {
          locks.push(op.resourceId);
        }
      }
    }
    if (locks.length >= 2) {
      threadLockOrders.push({
        threadId: thread.id,
        threadName: thread.name,
        locks,
      });
    }
  }

  for (let i = 0; i < threadLockOrders.length; i++) {
    for (let j = i + 1; j < threadLockOrders.length; j++) {
      const a = threadLockOrders[i];
      const b = threadLockOrders[j];

      const common = a.locks.filter((l) => b.locks.includes(l));
      if (common.length >= 2) {
        const orderA = common.map((l) => a.locks.indexOf(l));
        const orderB = common.map((l) => b.locks.indexOf(l));

        // Check if relative ordering differs (e.g. [0, 1] vs [1, 0])
        let inversion = false;
        for (let x = 0; x < common.length; x++) {
          for (let y = x + 1; y < common.length; y++) {
            const relA = orderA[x] < orderA[y];
            const relB = orderB[x] < orderB[y];
            if (relA !== relB) {
              inversion = true;
              break;
            }
          }
          if (inversion) break;
        }

        if (inversion) {
          return {
            hasViolation: true,
            conflictingLocks: common,
            explanation: `Thread '${a.threadName}' acquires locks in order [${common.join(" -> ")}], whereas Thread '${b.threadName}' acquires them in reverse order. This violates hierarchical lock ordering rules.`,
          };
        }
      }
    }
  }

  return { hasViolation: false, conflictingLocks: [] };
}

/**
 * TASK 5: Generates a complete, structured diagnostic report.
 *
 * Provides root-cause explanations and prevention recommendations for:
 * - Circular Wait
 * - Lock Ordering Violation
 * - Mutex Contention
 * - Unresolved Blocking
 *
 * @param snapshot The current immutable simulation snapshot
 * @returns Comprehensive diagnostic analysis report
 */
export function analyzeSimulation(
  snapshot: SimulationSnapshot
): SimulationDiagnosticReport {
  const waitForGraph = buildWaitForGraph(snapshot);
  const deadlockResult = detectDeadlock(snapshot);
  const noProgressResult = analyzeNoProgress(snapshot);
  const lockOrderCheck = checkLockOrderingViolation(snapshot.threads);

  // Check for active mutex contention (threads waiting for locks held by others, without a cycle)
  const contendedLocks = snapshot.locks.filter((l) => l.waitingQueue.length > 0);
  const waitingThreadIds = Array.from(
    new Set(contendedLocks.flatMap((l) => l.waitingQueue))
  );

  // Condition 1: DEADLOCK
  if (deadlockResult.isDeadlocked) {
    const cycleDesc = deadlockResult.cycles
      .map((c) => c.threadIds.join(" -> "))
      .join("; ");

    let explanation = `Coffman's Circular Wait condition detected in the Wait-For Graph: [${cycleDesc}]. Each thread holds a mutex lock while awaiting another lock held by the next thread in the cycle. Neither thread can yield or proceed.`;

    if (lockOrderCheck.hasViolation && lockOrderCheck.explanation) {
      explanation += ` Additionally, a Lock Ordering Violation was identified: ${lockOrderCheck.explanation}`;
    }

    const suggestedTechnique =
      "Apply Strict Lock Hierarchy (Hierarchical Resource Allocation): Define a global total ordering over all mutexes (e.g., Lock A < Lock B) and mandate that all threads acquire locks in strictly ascending order. Alternatively, employ non-blocking trylock operations (pthread_mutex_trylock) with exponential backoff, or implement deadlock detection with thread rollback.";

    return {
      condition: "DEADLOCK",
      isDeadlocked: true,
      isNoProgress: true,
      involvedThreadIds: deadlockResult.deadlockedThreadIds,
      involvedLockIds: deadlockResult.deadlockedLockIds,
      waitForGraph,
      summary: `Deadlock confirmed: Circular wait cycle among ${deadlockResult.deadlockedThreadIds.length} threads.`,
      explanation,
      suggestedTechnique,
      contentionDetails: {
        contendedLockIds: deadlockResult.deadlockedLockIds,
        waitingThreadIds: deadlockResult.deadlockedThreadIds,
      },
    };
  }

  // Condition 2: UNRESOLVED BLOCKING (No cycle, but all threads blocked)
  if (noProgressResult.isNoProgress && noProgressResult.reason === "UNRESOLVED_BLOCKING") {
    const blockedThreads = snapshot.threads.filter((t) => t.state === "BLOCKED");
    const blockedSemaphores = snapshot.semaphores.filter(
      (s) => s.waitingQueue.length > 0
    );

    const explanation = `All ${blockedThreads.length} remaining threads are BLOCKED, but no circular wait graph cycle exists. ${
      blockedSemaphores.length > 0
        ? `Threads are waiting on semaphores [${blockedSemaphores.map((s) => s.name).join(", ")}] with permit count 0, but no active thread remains to execute signal().`
        : "Threads are blocked on resources that cannot be satisfied by any remaining thread."
    }`;

    const suggestedTechnique =
      "Audit semaphore permit initialization and verify that producer/signaling threads cannot terminate prematurely before signaling all waiting consumers. Ensure synchronization barriers and counting semaphores have matching wait/signal pairs.";

    return {
      condition: "UNRESOLVED_BLOCKING",
      isDeadlocked: false,
      isNoProgress: true,
      involvedThreadIds: noProgressResult.blockedThreadIds,
      involvedLockIds: [],
      waitForGraph,
      summary: "Unresolved blocking: All remaining threads are blocked without circular deadlock.",
      explanation,
      suggestedTechnique,
    };
  }

  // Condition 3: COMPLETED
  if (
    snapshot.status === "COMPLETED" ||
    (snapshot.threads.length > 0 &&
      snapshot.threads.every((t) => t.state === "DONE"))
  ) {
    return {
      condition: "COMPLETED",
      isDeadlocked: false,
      isNoProgress: false,
      involvedThreadIds: [],
      involvedLockIds: [],
      waitForGraph,
      summary: "Simulation completed successfully.",
      explanation:
        "All simulated threads have successfully executed all operations and transitioned to DONE state.",
      suggestedTechnique:
        "No recovery needed. The scenario completed without unhandled deadlock or permanent stalls.",
    };
  }

  // Condition 4: MUTEX CONTENTION (Active contention without deadlock)
  if (contendedLocks.length > 0) {
    const lockNames = contendedLocks.map((l) => l.name).join(", ");
    return {
      condition: "MUTEX_CONTENTION",
      isDeadlocked: false,
      isNoProgress: false,
      involvedThreadIds: waitingThreadIds,
      involvedLockIds: contendedLocks.map((l) => l.id),
      waitForGraph,
      summary: `Active mutex contention detected on locks: ${lockNames}.`,
      explanation: `Threads [${waitingThreadIds.join(", ")}] are currently blocked waiting to acquire contested locks [${lockNames}]. Because the lock owners are actively executing or queued in the ready queue, this represents normal mutual exclusion contention rather than an unrecoverable circular deadlock.`,
      suggestedTechnique:
        "Minimize critical section duration, reduce holding times, or adopt read-write locks (shared_mutex) to increase parallelism if read operations predominate.",
      contentionDetails: {
        contendedLockIds: contendedLocks.map((l) => l.id),
        waitingThreadIds,
      },
    };
  }

  // Condition 5: NORMAL EXECUTION
  return {
    condition: "NORMAL_EXECUTION",
    isDeadlocked: false,
    isNoProgress: false,
    involvedThreadIds: [],
    involvedLockIds: [],
    waitForGraph,
    summary: "Normal execution: Threads progressing without resource contention.",
    explanation:
      "Threads are executing or ready in the scheduler queue. No lock ordering violations or circular dependencies are present.",
    suggestedTechnique:
      "Maintain current concurrency controls and observe execution progression.",
  };
}
