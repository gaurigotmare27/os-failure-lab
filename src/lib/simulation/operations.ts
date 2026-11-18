/**
 * OS Failure Lab - Operation Execution Engine
 *
 * Implements deterministic, discrete-event execution of thread instructions:
 * 1. Shared Memory Access (READ, WRITE)
 * 2. CPU Register Computation (COMPUTE)
 * 3. Mutual Exclusion Mutexes (ACQUIRE_LOCK, RELEASE_LOCK)
 * 4. Synchronization Primitives (WAIT, SIGNAL on counting & binary semaphores)
 *
 * Invariants:
 * - Immutable state transformations (never mutates input snapshot).
 * - Strict single-active-thread execution (only active RUNNING thread executes).
 * - Direct ownership/permit transfer to unblocked waiting threads.
 * - Deterministic logical clock progression.
 */

import type {
  SimulationSnapshot,
  ThreadDefinition,
  ThreadOperation,
  TraceEvent,
  TraceEventType,
} from "./types";

/**
 * Appends an immutable event log entry to the simulation snapshot.
 */
function emitEvent(
  snapshot: SimulationSnapshot,
  threadId: string,
  eventType: TraceEventType,
  description: string,
  affectedResource: string | null = null
): void {
  const event: TraceEvent = {
    id: `evt-${snapshot.eventTrace.length + 1}`,
    timestamp: snapshot.logicalTime,
    threadId,
    eventType,
    description,
    affectedResource,
  };
  snapshot.eventTrace.push(event);
}

/**
 * Checks and updates thread state if all operations are complete.
 * Also checks overall simulation completion.
 */
function handleThreadCompletion(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition
): void {
  if (thread.currentOperationIndex >= thread.operations.length) {
    if (thread.state !== "DONE") {
      thread.state = "DONE";
      thread.waitingReason = null;
      snapshot.threadStates[thread.id] = "DONE";
      snapshot.readyQueue = snapshot.readyQueue.filter((id) => id !== thread.id);

      if (snapshot.activeThreadId === thread.id) {
        snapshot.activeThreadId = null;
      }

      emitEvent(
        snapshot,
        thread.id,
        "STATE_CHANGE",
        `Thread '${thread.name}' finished all operations and transitioned to DONE`
      );
    }
  }

  // Check if all threads in the simulation have reached DONE
  const allDone =
    snapshot.threads.length > 0 &&
    snapshot.threads.every((t) => t.state === "DONE");

  if (allDone) {
    snapshot.status = "COMPLETED";
    snapshot.activeThreadId = null;
  }
}

/**
 * Executes a READ operation from a shared memory variable into a thread register.
 */
function executeRead(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' started READ operation`,
    op.resourceId ?? null
  );

  // Look up shared variable by resourceId, name, or payload variable name
  const targetVar = snapshot.sharedVariables.find(
    (v) =>
      v.id === op.resourceId ||
      v.name === op.resourceId ||
      (op.payload?.variable && v.name === op.payload.variable)
  );

  const targetReg = (op.payload?.targetRegister as string) ?? "R0";

  if (!snapshot.threadRegisters[thread.id]) {
    snapshot.threadRegisters[thread.id] = {};
  }

  if (targetVar) {
    const value = targetVar.currentValue;
    snapshot.threadRegisters[thread.id][targetReg] = value;

    emitEvent(
      snapshot,
      thread.id,
      "MEMORY_READ",
      `Thread '${thread.name}' read shared variable '${targetVar.name}' (value: ${String(value)}) into register ${targetReg}`,
      targetVar.id
    );
  } else {
    emitEvent(
      snapshot,
      thread.id,
      "MEMORY_READ",
      `Thread '${thread.name}' attempted READ on unknown variable '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
  }

  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_COMPLETE",
    `Thread '${thread.name}' completed READ operation`,
    op.resourceId ?? null
  );

  thread.currentOperationIndex += 1;
  handleThreadCompletion(snapshot, thread);
}

/**
 * Executes a COMPUTE operation on a thread's private CPU register.
 */
function executeCompute(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' started COMPUTE operation (${op.description})`
  );

  if (op.payload?.register) {
    const regName = String(op.payload.register);

    if (!snapshot.threadRegisters[thread.id]) {
      snapshot.threadRegisters[thread.id] = {};
    }

    const currentVal = snapshot.threadRegisters[thread.id][regName] ?? 0;
    const computeOp = op.payload.operation ?? "INCREMENT";

    if (computeOp === "INCREMENT") {
      const numVal =
        typeof currentVal === "number" ? currentVal : Number(currentVal) || 0;
      const nextVal = numVal + 1;
      snapshot.threadRegisters[thread.id][regName] = nextVal;

      emitEvent(
        snapshot,
        thread.id,
        "OPERATION_COMPLETE",
        `Thread '${thread.name}' computed INCREMENT on register ${regName} (${currentVal} -> ${nextVal})`
      );
    } else {
      emitEvent(
        snapshot,
        thread.id,
        "OPERATION_COMPLETE",
        `Thread '${thread.name}' performed computation on register ${regName}`
      );
    }
  } else {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' completed COMPUTE operation`
    );
  }

  thread.currentOperationIndex += 1;
  handleThreadCompletion(snapshot, thread);
}

/**
 * Executes a WRITE operation from a thread register or literal to a shared variable.
 */
function executeWrite(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' started WRITE operation`,
    op.resourceId ?? null
  );

  const targetVar = snapshot.sharedVariables.find(
    (v) =>
      v.id === op.resourceId ||
      v.name === op.resourceId ||
      (op.payload?.variable && v.name === op.payload.variable)
  );

  let valToWrite: number | string | boolean = 0;
  let sourceDesc = "immediate value";

  if (op.payload?.sourceRegister) {
    const srcReg = String(op.payload.sourceRegister);
    sourceDesc = `register ${srcReg}`;
    valToWrite = snapshot.threadRegisters[thread.id]?.[srcReg] ?? 0;
  } else if (op.payload?.itemValue !== undefined) {
    valToWrite = op.payload.itemValue;
    sourceDesc = `immediate value ${String(valToWrite)}`;
  } else if (op.payload?.value !== undefined) {
    valToWrite = op.payload.value;
    sourceDesc = `immediate value ${String(valToWrite)}`;
  }

  if (targetVar) {
    const oldValue = targetVar.currentValue;
    targetVar.currentValue = valToWrite;

    emitEvent(
      snapshot,
      thread.id,
      "MEMORY_WRITE",
      `Thread '${thread.name}' wrote value '${String(valToWrite)}' (previous: '${String(oldValue)}') from ${sourceDesc} to shared variable '${targetVar.name}'`,
      targetVar.id
    );
  } else {
    emitEvent(
      snapshot,
      thread.id,
      "MEMORY_WRITE",
      `Thread '${thread.name}' attempted WRITE to unknown variable '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
  }

  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_COMPLETE",
    `Thread '${thread.name}' completed WRITE operation`,
    op.resourceId ?? null
  );

  thread.currentOperationIndex += 1;
  handleThreadCompletion(snapshot, thread);
}

/**
 * Executes an ACQUIRE_LOCK operation on a mutual exclusion lock.
 */
function executeAcquireLock(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' requested Lock '${op.resourceId ?? "unknown"}'`,
    op.resourceId ?? null
  );

  const lock = snapshot.locks.find(
    (l) => l.id === op.resourceId || l.name === op.resourceId
  );

  if (!lock) {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' could not acquire unknown lock '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
    return;
  }

  if (lock.ownerThreadId === null) {
    // Lock is free: assign ownership directly to requesting thread
    lock.ownerThreadId = thread.id;
    snapshot.lockOwnership[lock.id] = thread.id;

    if (!thread.heldLocks.includes(lock.id)) {
      thread.heldLocks.push(lock.id);
    }

    emitEvent(
      snapshot,
      thread.id,
      "LOCK_ACQUIRED",
      `Thread '${thread.name}' acquired Lock '${lock.name}'`,
      lock.id
    );
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' completed ACQUIRE_LOCK for '${lock.name}'`,
      lock.id
    );

    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
  } else if (lock.ownerThreadId === thread.id) {
    // Re-entrant lock acquisition by existing owner
    emitEvent(
      snapshot,
      thread.id,
      "LOCK_ACQUIRED",
      `Thread '${thread.name}' re-acquired already held Lock '${lock.name}'`,
      lock.id
    );
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' completed ACQUIRE_LOCK for '${lock.name}'`,
      lock.id
    );

    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
  } else {
    // Lock is occupied: block thread, keep operation pending, add to lock waiting queue
    thread.state = "BLOCKED";
    thread.waitingReason = `Waiting for Lock '${lock.name}' (held by Thread '${lock.ownerThreadId}')`;
    snapshot.threadStates[thread.id] = "BLOCKED";

    // Add to waiting queue without duplicates
    if (!lock.waitingQueue.includes(thread.id)) {
      lock.waitingQueue.push(thread.id);
    }

    // Remove from readyQueue
    snapshot.readyQueue = snapshot.readyQueue.filter((id) => id !== thread.id);

    // Clear activeThreadId
    snapshot.activeThreadId = null;

    emitEvent(
      snapshot,
      thread.id,
      "LOCK_BLOCKED",
      `Thread '${thread.name}' blocked on Lock '${lock.name}' (held by Thread '${lock.ownerThreadId}')`,
      lock.id
    );
    emitEvent(
      snapshot,
      thread.id,
      "STATE_CHANGE",
      `Thread '${thread.name}' transitioned from RUNNING to BLOCKED (waiting for '${lock.name}')`,
      lock.id
    );
    // Operation remains pending at currentOperationIndex
  }
}

/**
 * Executes a RELEASE_LOCK operation on a mutual exclusion lock.
 */
function executeReleaseLock(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' requested RELEASE_LOCK for '${op.resourceId ?? "unknown"}'`,
    op.resourceId ?? null
  );

  const lock = snapshot.locks.find(
    (l) => l.id === op.resourceId || l.name === op.resourceId
  );

  if (!lock) {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' could not release unknown lock '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
    return;
  }

  // Rule 6: Do not allow non-owner lock release
  if (lock.ownerThreadId !== thread.id) {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Illegal lock release: Thread '${thread.name}' does not own Lock '${lock.name}' (current owner: '${lock.ownerThreadId ?? "none"}')`,
      lock.id
    );
    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
    return;
  }

  // Remove lock from releasing thread's heldLocks
  thread.heldLocks = thread.heldLocks.filter((id) => id !== lock.id);

  emitEvent(
    snapshot,
    thread.id,
    "LOCK_RELEASED",
    `Thread '${thread.name}' released Lock '${lock.name}'`,
    lock.id
  );

  // If a thread is waiting, transfer lock ownership directly to the first waiting thread
  if (lock.waitingQueue.length > 0) {
    const nextOwnerId = lock.waitingQueue.shift()!;
    lock.ownerThreadId = nextOwnerId;
    snapshot.lockOwnership[lock.id] = nextOwnerId;

    const nextOwnerThread = snapshot.threads.find((t) => t.id === nextOwnerId);
    if (nextOwnerThread) {
      if (!nextOwnerThread.heldLocks.includes(lock.id)) {
        nextOwnerThread.heldLocks.push(lock.id);
      }

      // Advance that waiting thread's pending acquire operation
      nextOwnerThread.currentOperationIndex += 1;

      // Move it to READY
      nextOwnerThread.state = "READY";
      nextOwnerThread.waitingReason = null;
      snapshot.threadStates[nextOwnerId] = "READY";

      // Add to readyQueue without duplicates
      if (!snapshot.readyQueue.includes(nextOwnerId)) {
        snapshot.readyQueue.push(nextOwnerId);
      }

      emitEvent(
        snapshot,
        nextOwnerId,
        "LOCK_ACQUIRED",
        `Lock '${lock.name}' ownership transferred directly to waiting Thread '${nextOwnerThread.name}'`,
        lock.id
      );
      emitEvent(
        snapshot,
        nextOwnerId,
        "STATE_CHANGE",
        `Thread '${nextOwnerThread.name}' unblocked from Lock '${lock.name}' and transitioned to READY`,
        lock.id
      );

      handleThreadCompletion(snapshot, nextOwnerThread);
    }
  } else {
    // No waiting threads; lock is now available
    lock.ownerThreadId = null;
    snapshot.lockOwnership[lock.id] = null;
  }

  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_COMPLETE",
    `Thread '${thread.name}' completed RELEASE_LOCK for '${lock.name}'`,
    lock.id
  );

  thread.currentOperationIndex += 1;
  handleThreadCompletion(snapshot, thread);
}

/**
 * Executes a WAIT operation on a counting or binary semaphore.
 */
function executeWait(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' started WAIT on semaphore '${op.resourceId ?? "unknown"}'`,
    op.resourceId ?? null
  );

  const sem = snapshot.semaphores.find(
    (s) => s.id === op.resourceId || s.name === op.resourceId
  );

  if (!sem) {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' could not wait on unknown semaphore '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
    return;
  }

  // If semaphore value is greater than zero, decrement it and complete the operation
  if (sem.currentValue > 0) {
    sem.currentValue -= 1;

    emitEvent(
      snapshot,
      thread.id,
      "SEMAPHORE_WAIT",
      `Thread '${thread.name}' acquired permit on semaphore '${sem.name}' (permits remaining: ${sem.currentValue})`,
      sem.id
    );
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' completed WAIT on semaphore '${sem.name}'`,
      sem.id
    );

    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
  } else {
    // Value is zero: block thread, keep WAIT operation pending, add to semaphore waiting queue
    thread.state = "BLOCKED";
    thread.waitingReason = `Waiting on semaphore '${sem.name}'`;
    snapshot.threadStates[thread.id] = "BLOCKED";

    // Prevent duplicate thread IDs in waiting queue
    if (!sem.waitingQueue.includes(thread.id)) {
      sem.waitingQueue.push(thread.id);
    }

    // Remove from readyQueue
    snapshot.readyQueue = snapshot.readyQueue.filter((id) => id !== thread.id);

    // Clear activeThreadId
    snapshot.activeThreadId = null;

    emitEvent(
      snapshot,
      thread.id,
      "SEMAPHORE_WAIT",
      `Thread '${thread.name}' blocked on semaphore '${sem.name}' (current permit count: 0)`,
      sem.id
    );
    emitEvent(
      snapshot,
      thread.id,
      "STATE_CHANGE",
      `Thread '${thread.name}' transitioned from RUNNING to BLOCKED (waiting on '${sem.name}')`,
      sem.id
    );
    // WAIT operation remains pending
  }
}

/**
 * Executes a SIGNAL operation on a counting or binary semaphore.
 */
function executeSignal(
  snapshot: SimulationSnapshot,
  thread: ThreadDefinition,
  op: ThreadOperation
): void {
  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_START",
    `Thread '${thread.name}' started SIGNAL on semaphore '${op.resourceId ?? "unknown"}'`,
    op.resourceId ?? null
  );

  const sem = snapshot.semaphores.find(
    (s) => s.id === op.resourceId || s.name === op.resourceId
  );

  if (!sem) {
    emitEvent(
      snapshot,
      thread.id,
      "OPERATION_COMPLETE",
      `Thread '${thread.name}' could not signal unknown semaphore '${op.resourceId ?? "unknown"}'`,
      op.resourceId ?? null
    );
    thread.currentOperationIndex += 1;
    handleThreadCompletion(snapshot, thread);
    return;
  }

  // If a thread is waiting, wake the first waiter and transfer permit directly
  if (sem.waitingQueue.length > 0) {
    const waiterId = sem.waitingQueue.shift()!;
    const waiterThread = snapshot.threads.find((t) => t.id === waiterId);

    if (waiterThread) {
      // Advance its pending WAIT operation
      waiterThread.currentOperationIndex += 1;

      // Move it to READY
      waiterThread.state = "READY";
      waiterThread.waitingReason = null;
      snapshot.threadStates[waiterId] = "READY";

      // Add to readyQueue without duplicates
      if (!snapshot.readyQueue.includes(waiterId)) {
        snapshot.readyQueue.push(waiterId);
      }

      emitEvent(
        snapshot,
        thread.id,
        "SEMAPHORE_SIGNAL",
        `Thread '${thread.name}' signaled semaphore '${sem.name}', transferring permit directly to waiting Thread '${waiterThread.name}'`,
        sem.id
      );
      emitEvent(
        snapshot,
        waiterId,
        "STATE_CHANGE",
        `Thread '${waiterThread.name}' unblocked from semaphore '${sem.name}' and transitioned to READY`,
        sem.id
      );

      handleThreadCompletion(snapshot, waiterThread);
    }
  } else {
    // Otherwise increment semaphore count
    sem.currentValue += 1;

    emitEvent(
      snapshot,
      thread.id,
      "SEMAPHORE_SIGNAL",
      `Thread '${thread.name}' incremented semaphore '${sem.name}' (current count: ${sem.currentValue})`,
      sem.id
    );
  }

  emitEvent(
    snapshot,
    thread.id,
    "OPERATION_COMPLETE",
    `Thread '${thread.name}' completed SIGNAL on semaphore '${sem.name}'`,
    sem.id
  );

  thread.currentOperationIndex += 1;
  handleThreadCompletion(snapshot, thread);
}

/**
 * Executes the next pending operation for the specified thread.
 *
 * Invariants:
 * - Only the currently active RUNNING thread may execute.
 * - Snapshots are deeply cloned and strictly immutable.
 * - Logical time advances deterministically by operation duration (default: 1 tick).
 *
 * @param snapshot The current simulation snapshot
 * @param threadId The ID of the thread requesting operation execution
 * @returns A new immutable SimulationSnapshot after operation execution, or unchanged snapshot if invalid
 */
export function executeNextOperation(
  snapshot: SimulationSnapshot,
  threadId: string
): SimulationSnapshot {
  // Only allow the currently active RUNNING thread to execute its next operation
  if (!snapshot.activeThreadId || snapshot.activeThreadId !== threadId) {
    return snapshot;
  }

  const thread = snapshot.threads.find((t) => t.id === threadId);
  if (
    !thread ||
    thread.state !== "RUNNING" ||
    snapshot.threadStates[threadId] !== "RUNNING"
  ) {
    return snapshot;
  }

  // If thread has finished all operations, return unchanged snapshot
  if (thread.currentOperationIndex >= thread.operations.length) {
    return snapshot;
  }

  // Create immutable deep clone of the snapshot
  const nextSnapshot: SimulationSnapshot = structuredClone(snapshot);
  const targetThread = nextSnapshot.threads.find((t) => t.id === threadId)!;
  const op = targetThread.operations[targetThread.currentOperationIndex];

  // Advance logicalTime deterministically using operation duration (default: 1 tick)
  const duration = op.duration && op.duration > 0 ? op.duration : 1;
  nextSnapshot.logicalTime += duration;

  // Execute operation based on operation type
  switch (op.type) {
    case "READ":
      executeRead(nextSnapshot, targetThread, op);
      break;

    case "COMPUTE":
      executeCompute(nextSnapshot, targetThread, op);
      break;

    case "WRITE":
      executeWrite(nextSnapshot, targetThread, op);
      break;

    case "ACQUIRE_LOCK":
      executeAcquireLock(nextSnapshot, targetThread, op);
      break;

    case "RELEASE_LOCK":
      executeReleaseLock(nextSnapshot, targetThread, op);
      break;

    case "WAIT":
      executeWait(nextSnapshot, targetThread, op);
      break;

    case "SIGNAL":
      executeSignal(nextSnapshot, targetThread, op);
      break;

    default:
      // Unknown operation fallback: advance index safely
      targetThread.currentOperationIndex += 1;
      handleThreadCompletion(nextSnapshot, targetThread);
      break;
  }

  return nextSnapshot;
}
