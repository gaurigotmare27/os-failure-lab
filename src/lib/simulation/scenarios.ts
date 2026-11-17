/**
 * OS Failure Lab - Predefined Concurrency Scenarios
 *
 * Deterministic test harnesses demonstrating canonical OS concurrency problems:
 * 1. Shared Counter Race Condition (Lost Update)
 * 2. Two-Thread Deadlock (Circular Wait)
 * 3. Producer-Consumer Problem (Semaphore-based Coordination)
 */

import { Scenario } from "./types";

/**
 * ============================================================================
 * SCENARIO A: Shared Counter Race Condition
 * ============================================================================
 *
 * CONCEPT:
 * When two or more concurrent threads access and mutate shared data without
 * synchronization (e.g. mutex locks), instruction interleaving can lead to
 * inconsistent state.
 *
 * SETUP:
 * - Two threads: Thread A and Thread B.
 * - One shared variable: "counter" (initial value: 0).
 * - Both threads read the counter into a private local register, increment it,
 *   and write it back.
 *
 * SCHEDULE & INTERLEAVING (Round Robin, Quantum = 1 tick):
 * - Tick 1: Thread A executes READ    -> reads counter (0) into Register R1.
 * - Tick 2: Thread B executes READ    -> reads counter (0) into Register R2.
 * - Tick 3: Thread A executes COMPUTE -> increments R1 (0 + 1 = 1).
 * - Tick 4: Thread B executes COMPUTE -> increments R2 (0 + 1 = 1).
 * - Tick 5: Thread A executes WRITE   -> writes R1 (1) to counter.
 * - Tick 6: Thread B executes WRITE   -> writes R2 (1) to counter.
 *
 * EXPECTED OUTCOME:
 * The counter value is 1, even though two increments were performed.
 * Thread B's write overwrote Thread A's increment, producing a classic
 * "Lost Update" race condition. Expected correct value was 2.
 */
export const raceConditionScenario: Scenario = {
  id: "scenario-race-condition",
  name: "Shared Counter Race Condition",
  description:
    "Demonstrates an unsafe data race on a shared counter without mutual exclusion. Both threads read the initial counter value (0) into local registers before either thread commits its write, producing a lost update and an incorrect final result of 1 instead of 2.",
  schedulingPolicy: "ROUND_ROBIN",
  timeQuantum: 1,
  locks: [],
  resources: [],
  sharedVariables: [
    {
      id: "var-counter",
      name: "counter",
      initialValue: 0,
      currentValue: 0,
    },
  ],
  semaphores: [],
  threads: [
    {
      id: "thread-a",
      name: "Thread A",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-a-1",
          type: "READ",
          resourceId: "var-counter",
          description: "Thread A reads shared counter into local register R1 (reads 0)",
          duration: 1,
          payload: { targetRegister: "R1", variable: "counter" },
        },
        {
          id: "op-a-2",
          type: "COMPUTE",
          description: "Thread A increments local register R1 (R1 = 0 + 1 = 1)",
          duration: 1,
          payload: { register: "R1", operation: "INCREMENT" },
        },
        {
          id: "op-a-3",
          type: "WRITE",
          resourceId: "var-counter",
          description: "Thread A writes local register R1 value (1) to shared counter",
          duration: 1,
          payload: { sourceRegister: "R1", variable: "counter" },
        },
      ],
    },
    {
      id: "thread-b",
      name: "Thread B",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-b-1",
          type: "READ",
          resourceId: "var-counter",
          description: "Thread B reads shared counter into local register R2 (reads 0)",
          duration: 1,
          payload: { targetRegister: "R2", variable: "counter" },
        },
        {
          id: "op-b-2",
          type: "COMPUTE",
          description: "Thread B increments local register R2 (R2 = 0 + 1 = 1)",
          duration: 1,
          payload: { register: "R2", operation: "INCREMENT" },
        },
        {
          id: "op-b-3",
          type: "WRITE",
          resourceId: "var-counter",
          description: "Thread B writes local register R2 value (1) to shared counter",
          duration: 1,
          payload: { sourceRegister: "R2", variable: "counter" },
        },
      ],
    },
  ],
};

/**
 * ============================================================================
 * SCENARIO B: Two-Thread Deadlock
 * ============================================================================
 *
 * CONCEPT:
 * A deadlock occurs when a set of threads are blocked because each process is
 * holding a resource and waiting for another resource acquired by some other
 * process (Coffman's Circular Wait condition).
 *
 * SETUP:
 * - Two threads: Thread A and Thread B.
 * - Two mutex locks: Lock A and Lock B.
 * - Thread A acquires Lock A, then requests Lock B.
 * - Thread B acquires Lock B, then requests Lock A.
 *
 * SCHEDULE & INTERLEAVING (Round Robin, Quantum = 1 tick):
 * - Tick 1: Thread A executes ACQUIRE_LOCK -> acquires Lock A (Lock A owner = Thread A).
 * - Tick 2: Thread B executes ACQUIRE_LOCK -> acquires Lock B (Lock B owner = Thread B).
 * - Tick 3: Thread A executes ACQUIRE_LOCK -> requests Lock B -> BLOCKED (held by Thread B).
 * - Tick 4: Thread B executes ACQUIRE_LOCK -> requests Lock A -> BLOCKED (held by Thread A).
 *
 * EXPECTED OUTCOME:
 * Both threads are BLOCKED. Thread A cannot proceed without Lock B, and Thread B
 * cannot proceed without Lock A. Neither thread can release its held lock,
 * producing a permanent circular wait deadlock.
 */
export const deadlockScenario: Scenario = {
  id: "scenario-two-thread-deadlock",
  name: "Two-Thread Deadlock",
  description:
    "Demonstrates Coffman's circular wait condition between two threads acquiring two mutex locks in opposite orders. Thread A acquires Lock A and waits for Lock B, while Thread B acquires Lock B and waits for Lock A, resulting in an unrecoverable deadlock.",
  schedulingPolicy: "ROUND_ROBIN",
  timeQuantum: 1,
  resources: [],
  sharedVariables: [],
  semaphores: [],
  locks: [
    {
      id: "lock-a",
      name: "Lock A",
      ownerThreadId: null,
      waitingQueue: [],
    },
    {
      id: "lock-b",
      name: "Lock B",
      ownerThreadId: null,
      waitingQueue: [],
    },
  ],
  threads: [
    {
      id: "thread-a",
      name: "Thread A",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-deadlock-a-1",
          type: "ACQUIRE_LOCK",
          resourceId: "lock-a",
          description: "Thread A requests and acquires Lock A",
          duration: 1,
        },
        {
          id: "op-deadlock-a-2",
          type: "ACQUIRE_LOCK",
          resourceId: "lock-b",
          description: "Thread A requests Lock B (blocks if Lock B is held by Thread B)",
          duration: 1,
        },
        {
          id: "op-deadlock-a-3",
          type: "COMPUTE",
          description: "Thread A enters critical section and executes work",
          duration: 1,
        },
        {
          id: "op-deadlock-a-4",
          type: "RELEASE_LOCK",
          resourceId: "lock-b",
          description: "Thread A releases Lock B",
          duration: 1,
        },
        {
          id: "op-deadlock-a-5",
          type: "RELEASE_LOCK",
          resourceId: "lock-a",
          description: "Thread A releases Lock A",
          duration: 1,
        },
      ],
    },
    {
      id: "thread-b",
      name: "Thread B",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-deadlock-b-1",
          type: "ACQUIRE_LOCK",
          resourceId: "lock-b",
          description: "Thread B requests and acquires Lock B",
          duration: 1,
        },
        {
          id: "op-deadlock-b-2",
          type: "ACQUIRE_LOCK",
          resourceId: "lock-a",
          description: "Thread B requests Lock A (blocks if Lock A is held by Thread A)",
          duration: 1,
        },
        {
          id: "op-deadlock-b-3",
          type: "COMPUTE",
          description: "Thread B enters critical section and executes work",
          duration: 1,
        },
        {
          id: "op-deadlock-b-4",
          type: "RELEASE_LOCK",
          resourceId: "lock-a",
          description: "Thread B releases Lock A",
          duration: 1,
        },
        {
          id: "op-deadlock-b-5",
          type: "RELEASE_LOCK",
          resourceId: "lock-b",
          description: "Thread B releases Lock B",
          duration: 1,
        },
      ],
    },
  ],
};

/**
 * ============================================================================
 * SCENARIO C: Producer-Consumer Problem
 * ============================================================================
 *
 * CONCEPT:
 * The classical bounded-buffer synchronization problem. A Producer thread
 * inserts data items into a buffer of capacity 1, while a Consumer thread
 * removes them. Semaphores ensure:
 * 1. Mutual exclusion in the critical section (via binary semaphore 'mutex').
 * 2. Producer blocks when buffer is full (via counting semaphore 'empty').
 * 3. Consumer blocks when buffer is empty (via counting semaphore 'full').
 *
 * SETUP:
 * - One Producer thread, one Consumer thread.
 * - Single-slot bounded buffer: variable "buffer" (initial value: 0).
 * - Semaphores:
 *     empty = 1 (1 slot available for insertion)
 *     full  = 0 (0 items available for consumption)
 *     mutex = 1 (binary semaphore guarding critical section)
 *
 * PRODUCER PROTOCOL:
 *   wait(empty) -> wait(mutex) -> write(buffer) -> signal(mutex) -> signal(full)
 *
 * CONSUMER PROTOCOL:
 *   wait(full)  -> wait(mutex) -> read(buffer)  -> signal(mutex) -> signal(empty)
 *
 * EXPECTED OUTCOME:
 * Synchronized thread cooperation. If Consumer runs first, wait(full) causes it
 * to block immediately. Producer runs, writes item, and unblocks Consumer.
 * Neither buffer overflow nor buffer underflow can occur.
 */
export const producerConsumerScenario: Scenario = {
  id: "scenario-producer-consumer",
  name: "Producer-Consumer Problem",
  description:
    "Demonstrates bounded-buffer process synchronization using Dijkstra's semaphores. A Producer and a Consumer coordinate access to a 1-slot buffer using counting semaphores ('empty' and 'full') and a binary semaphore ('mutex') to prevent buffer underflow, overflow, and concurrent access.",
  schedulingPolicy: "ROUND_ROBIN",
  timeQuantum: 1,
  locks: [],
  resources: [],
  sharedVariables: [
    {
      id: "var-buffer",
      name: "buffer",
      initialValue: 0,
      currentValue: 0,
    },
  ],
  semaphores: [
    {
      id: "sem-empty",
      name: "empty",
      initialValue: 1,
      currentValue: 1,
      waitingQueue: [],
    },
    {
      id: "sem-full",
      name: "full",
      initialValue: 0,
      currentValue: 0,
      waitingQueue: [],
    },
    {
      id: "sem-mutex",
      name: "mutex",
      initialValue: 1,
      currentValue: 1,
      waitingQueue: [],
    },
  ],
  threads: [
    {
      id: "thread-producer",
      name: "Producer",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-prod-1",
          type: "WAIT",
          resourceId: "sem-empty",
          description: "Producer executes wait(empty) -> checks if buffer has empty slot",
          duration: 1,
        },
        {
          id: "op-prod-2",
          type: "WAIT",
          resourceId: "sem-mutex",
          description: "Producer executes wait(mutex) -> enters buffer critical section",
          duration: 1,
        },
        {
          id: "op-prod-3",
          type: "WRITE",
          resourceId: "var-buffer",
          description: "Producer writes produced item (value: 42) into bounded buffer",
          duration: 1,
          payload: { itemValue: 42 },
        },
        {
          id: "op-prod-4",
          type: "SIGNAL",
          resourceId: "sem-mutex",
          description: "Producer executes signal(mutex) -> leaves buffer critical section",
          duration: 1,
        },
        {
          id: "op-prod-5",
          type: "SIGNAL",
          resourceId: "sem-full",
          description: "Producer executes signal(full) -> notifies consumer item is ready",
          duration: 1,
        },
      ],
    },
    {
      id: "thread-consumer",
      name: "Consumer",
      priority: 1,
      state: "READY",
      currentOperationIndex: 0,
      heldLocks: [],
      waitingReason: null,
      operations: [
        {
          id: "op-cons-1",
          type: "WAIT",
          resourceId: "sem-full",
          description: "Consumer executes wait(full) -> blocks if buffer is empty",
          duration: 1,
        },
        {
          id: "op-cons-2",
          type: "WAIT",
          resourceId: "sem-mutex",
          description: "Consumer executes wait(mutex) -> enters buffer critical section",
          duration: 1,
        },
        {
          id: "op-cons-3",
          type: "READ",
          resourceId: "var-buffer",
          description: "Consumer reads item from bounded buffer and empties slot",
          duration: 1,
        },
        {
          id: "op-cons-4",
          type: "SIGNAL",
          resourceId: "sem-mutex",
          description: "Consumer executes signal(mutex) -> leaves buffer critical section",
          duration: 1,
        },
        {
          id: "op-cons-5",
          type: "SIGNAL",
          resourceId: "sem-empty",
          description: "Consumer executes signal(empty) -> notifies producer slot is free",
          duration: 1,
        },
      ],
    },
  ],
};

/**
 * Starter scenarios collection for laboratory experiments.
 */
export const starterScenarios: Scenario[] = [
  raceConditionScenario,
  deadlockScenario,
  producerConsumerScenario,
];
