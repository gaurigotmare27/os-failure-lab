/**
 * OS Failure Lab - Core Simulation Engine Types
 *
 * Modular TypeScript definitions for a deterministic, discrete-event
 * operating system concurrency failure detection and recovery simulator.
 */

/**
 * 1. ThreadState
 * Represents the discrete lifecycle states of an OS thread in the simulator.
 */
export type ThreadState = "NEW" | "READY" | "RUNNING" | "BLOCKED" | "DONE";

/**
 * 2. OperationType
 * Supported discrete primitive operations that a thread can execute sequentially.
 */
export type OperationType =
  | "COMPUTE"
  | "READ"
  | "WRITE"
  | "ACQUIRE_LOCK"
  | "RELEASE_LOCK"
  | "WAIT"
  | "SIGNAL";

/**
 * 3. ThreadOperation
 * A single discrete instruction or action executed by a thread.
 */
export interface ThreadOperation {
  /** Unique identifier for the operation within a thread */
  id: string;
  /** The type of operation being performed */
  type: OperationType;
  /** Target resource, lock, variable, or semaphore identifier (if applicable) */
  resourceId?: string;
  /** Human-readable description of the operation */
  description: string;
  /** Execution duration in logical clock ticks (defaults to 1 if omitted) */
  duration?: number;
  /** Optional metadata payload (e.g. memory address, register value) */
  payload?: Record<string, string | number | boolean>;
}

/**
 * 4. ThreadDefinition
 * Complete definition and runtime state representation of a simulated thread.
 */
export interface ThreadDefinition {
  /** Unique thread identifier */
  id: string;
  /** Human-readable thread name (e.g. "Thread-1", "Worker-A") */
  name: string;
  /** Thread scheduling priority (higher integer = higher priority) */
  priority: number;
  /** Current execution state */
  state: ThreadState;
  /** Ordered list of operations to be executed */
  operations: ThreadOperation[];
  /** Index of the current or next operation to execute (0-based) */
  currentOperationIndex: number;
  /** List of lock IDs currently held by this thread */
  heldLocks: string[];
  /** Reason description if thread is BLOCKED (e.g. "Waiting for Lock-1") */
  waitingReason?: string | null;
}

/**
 * 5. LockDefinition
 * Mutual exclusion lock (mutex) definition and its contention state.
 */
export interface LockDefinition {
  /** Unique lock identifier */
  id: string;
  /** Human-readable lock name (e.g. "Mutex-A", "Lock-Buffer") */
  name: string;
  /** ID of the thread that currently holds this lock, or null if unlocked */
  ownerThreadId: string | null;
  /** Ordered queue of thread IDs waiting to acquire this lock */
  waitingQueue: string[];
}

/**
 * 6. ResourceDefinition
 * Multi-instance countable OS resource model (for resource allocation and bankers algorithm).
 */
export interface ResourceDefinition {
  /** Unique resource identifier */
  id: string;
  /** Human-readable resource name (e.g. "Buffer-Slot", "I/O-Channel") */
  name: string;
  /** Total available unallocated instances */
  availableInstances: number;
  /** Mapping of thread IDs to the number of instances currently allocated to them */
  currentAllocation: Record<string, number>;
  /** Total capacity of the resource across all instances */
  totalCapacity?: number;
}

/**
 * SharedVariableDefinition
 * Definition and state of a shared memory variable accessible by concurrent threads.
 */
export interface SharedVariableDefinition {
  /** Unique shared variable identifier */
  id: string;
  /** Human-readable variable name (e.g. "counter", "shared_balance") */
  name: string;
  /** Initial value before simulation execution starts */
  initialValue: number | string | boolean;
  /** Current value during simulation execution */
  currentValue: number | string | boolean;
}

/**
 * SemaphoreDefinition
 * Definition and state of a counting or binary semaphore used for process synchronization.
 */
export interface SemaphoreDefinition {
  /** Unique semaphore identifier */
  id: string;
  /** Human-readable semaphore name (e.g. "empty", "full", "mutex") */
  name: string;
  /** Initial permit counter */
  initialValue: number;
  /** Current permit counter */
  currentValue: number;
  /** Ordered FIFO queue of thread IDs waiting on this semaphore */
  waitingQueue: string[];
}

/**
 * Supported types for thread local register values.
 */
export type RegisterValue = number | string | boolean;

/**
 * Independent local CPU register values mapped by thread ID and register name.
 * e.g., threadRegisters["thread-a"]["R1"] = 0
 */
export type ThreadRegisters = Record<string, Record<string, RegisterValue>>;

/**
 * 7. SchedulingPolicy
 * Supported CPU scheduling algorithms for thread selection.
 */
export type SchedulingPolicy = "FCFS" | "ROUND_ROBIN" | "PRIORITY";

/**
 * 8. Scenario
 * Configuration and initial state definition for a concurrency simulation scenario.
 */
export interface Scenario {
  /** Unique scenario identifier */
  id: string;
  /** Human-readable scenario title */
  name: string;
  /** Detailed description of the scenario, failure mode, or learning goal */
  description: string;
  /** List of threads configured for this scenario */
  threads: ThreadDefinition[];
  /** Mutexes and locks used within the scenario */
  locks: LockDefinition[];
  /** Shared multi-instance resources used within the scenario */
  resources: ResourceDefinition[];
  /** Shared variables accessed by threads in this scenario */
  sharedVariables?: SharedVariableDefinition[];
  /** Semaphores configured for synchronization in this scenario */
  semaphores?: SemaphoreDefinition[];
  /** CPU scheduling algorithm applied to the ready queue */
  schedulingPolicy: SchedulingPolicy;
  /** Optional time quantum for Round Robin scheduling (in logical clock ticks) */
  timeQuantum?: number;
}

/**
 * Event classifications for the discrete event trace log.
 */
export type TraceEventType =
  | "STATE_CHANGE"
  | "LOCK_ACQUIRED"
  | "LOCK_BLOCKED"
  | "LOCK_RELEASED"
  | "SEMAPHORE_WAIT"
  | "SEMAPHORE_SIGNAL"
  | "RESOURCE_ALLOCATED"
  | "RESOURCE_RELEASED"
  | "OPERATION_START"
  | "OPERATION_COMPLETE"
  | "CONTEXT_SWITCH"
  | "DEADLOCK_DETECTED"
  | "STEP_LIMIT"
  | "MEMORY_READ"
  | "MEMORY_WRITE";

/**
 * 9. TraceEvent
 * An immutable discrete-event log entry generated during simulation execution.
 */
export interface TraceEvent {
  /** Unique event identifier */
  id: string;
  /** Logical discrete simulation clock tick when the event occurred */
  timestamp: number;
  /** ID of the thread associated with this event */
  threadId: string;
  /** Nature of the event */
  eventType: TraceEventType;
  /** Human-readable description of what transpired */
  description: string;
  /** Identifier of the affected resource, lock, or variable (if applicable) */
  affectedResource?: string | null;
}

/**
 * 10. SimulationStatus
 * High-level engine lifecycle and health states.
 */
export type SimulationStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "DEADLOCKED"
  | "STEP_LIMIT_REACHED";

/**
 * 11. SimulationSnapshot
 * An immutable snapshot of the entire simulator state at a given logical clock tick.
 * Enables step-by-step playback, backward stepping, and state verification.
 */
export interface SimulationSnapshot {
  /** Current logical clock time */
  logicalTime: number;
  /** Current status of the simulation */
  status: SimulationStatus;
  /** Configured CPU scheduling policy */
  schedulingPolicy: SchedulingPolicy;
  /** Configured time quantum for Round Robin scheduling (where applicable) */
  timeQuantum?: number;
  /** Number of operations/ticks executed by active thread in current quantum slice */
  activeThreadQuantumUsed?: number;
  /** Current states of all threads mapped by thread ID */
  threadStates: Record<string, ThreadState>;
  /** Complete current state of each thread */
  threads: ThreadDefinition[];
  /** Current lock ownership map (lock ID -> owner thread ID or null) */
  lockOwnership: Record<string, string | null>;
  /** Complete state of each lock */
  locks: LockDefinition[];
  /** Complete state of each resource */
  resources: ResourceDefinition[];
  /** State of shared variables at this snapshot */
  sharedVariables: SharedVariableDefinition[];
  /** State of semaphores at this snapshot */
  semaphores: SemaphoreDefinition[];
  /** Independent local register values for each thread (threadId -> registerName -> value) */
  threadRegisters: ThreadRegisters;
  /** Ordered list of thread IDs currently in the READY queue */
  readyQueue: string[];
  /** Currently executing thread ID, or null if CPU is idle */
  activeThreadId: string | null;
  /** Complete historical event trace up to this snapshot */
  eventTrace: TraceEvent[];
}
