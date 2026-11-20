"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  PlayCircleIcon,
  ArrowRightIcon,
  LayersIcon,
  LockIcon,
  SyncIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
  ClockIcon,
} from "@/components/icons";
import {
  raceConditionScenario,
  deadlockScenario,
  producerConsumerScenario,
} from "@/lib/simulation/scenarios";
import { createInitialSnapshot } from "@/lib/simulation/engine";
import { stepSimulation } from "@/lib/simulation/controller";
import {
  ThreadStateTable,
  ExecutionTimeline,
  WaitForGraph,
  ResourceMonitor,
} from "@/components/simulation";

interface ModuleViewProps {
  moduleId: string;
}

export function ModuleView({ moduleId }: ModuleViewProps) {
  // Pre-compute authentic snapshots for interactive demonstrations using the real simulation engine
  const raceSnapshot = useMemo(() => {
    let snap = createInitialSnapshot(raceConditionScenario);
    // Advance 2 steps to illustrate interleaved reads before writes
    snap = stepSimulation(snap);
    snap = stepSimulation(snap);
    return snap;
  }, []);

  const deadlockSnapshot = useMemo(() => {
    let snap = createInitialSnapshot(deadlockScenario);
    // Step until deadlocked state is established
    for (let i = 0; i < 8; i++) {
      if (snap.status === "DEADLOCKED") break;
      snap = stepSimulation(snap);
    }
    return snap;
  }, []);

  const producerConsumerSnapshot = useMemo(() => {
    let snap = createInitialSnapshot(producerConsumerScenario);
    // Advance 1 step: Producer acquires empty semaphore
    snap = stepSimulation(snap);
    return snap;
  }, []);

  const threadMonitoringSnapshot = useMemo(() => {
    let snap = createInitialSnapshot(raceConditionScenario);
    // Advance 4 steps to create a diverse Gantt timeline of RUNNING and READY slices
    for (let i = 0; i < 4; i++) {
      snap = stepSimulation(snap);
    }
    return snap;
  }, []);

  // Render MODULE 1: Race Condition Laboratory
  if (moduleId === "race-condition") {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb & Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span>Modules</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Module 01</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-blue-700 border border-blue-200/80 mb-1">
                  Module 01 · Data Race Analysis
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  Race Condition Laboratory
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                  Understand shared memory concurrency, critical section vulnerabilities, and non-deterministic lost updates.
                </p>
              </div>
              <Link
                href="/simulation?scenario=scenario-race-condition"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto shrink-0"
              >
                <PlayCircleIcon size={16} className="text-white" />
                <span>Launch Race Condition Lab</span>
              </Link>
            </div>
          </div>

          {/* Academic Concepts Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-600">
                <LayersIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Shared Memory & Registers
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Threads share global heap and data memory, but each thread possesses its own private CPU register set and program counter. Moving data into a register creates a local, isolated copy.
              </p>
            </div>

            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-600">
                <LockIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  The Critical Section Problem
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A critical section is a sequence of code accessing shared resources that must execute atomically. Without mutual exclusion, concurrent thread preemption within this section corrupts system invariants.
              </p>
            </div>

            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-600">
                <ClockIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  The Lost Update Anomaly
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When Thread A and Thread B both read the initial counter value (0) before either writes back its incremented register, the final write of Thread B overwrites Thread A, resulting in 1 instead of 2.
              </p>
            </div>
          </div>

          {/* Interactive Experiment Preview */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Experiment Harness: Shared Counter Race Condition
                </h2>
                <p className="text-xs text-slate-500">
                  Live state after 2 execution ticks under Round Robin (Q=1). Both threads have loaded counter = 0 into local registers R1 and R2.
                </p>
              </div>
              <Link
                href="/simulation?scenario=scenario-race-condition"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Step through in Simulation Lab</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>

            {/* Reused Live Components */}
            <ResourceMonitor snapshot={raceSnapshot} />
            <ThreadStateTable snapshot={raceSnapshot} />
          </div>

          {/* Bottom Action Footer */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-blue-900">
                Ready to experiment with instruction interleaving?
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Open the interactive laboratory to step through single instructions or run continuous execution.
              </p>
            </div>
            <Link
              href="/simulation?scenario=scenario-race-condition"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs shrink-0"
            >
              <PlayCircleIcon size={16} className="text-white" />
              <span>Launch Race Condition Experiment</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render MODULE 2: Deadlock Detection
  if (moduleId === "deadlock-detection") {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb & Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span>Modules</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Module 02</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold tracking-wider text-rose-700 border border-rose-200/80 mb-1">
                  Module 02 · Deadlock Diagnostics
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  Deadlock Detection & Graph Analysis
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                  Explore Coffman&apos;s four conditions, directed Wait-For Graphs, and cycle detection algorithms.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
                <Link
                  href="/deadlock-analyzer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span>Deadlock Analyzer</span>
                </Link>
                <Link
                  href="/simulation?scenario=scenario-two-thread-deadlock"
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <PlayCircleIcon size={16} className="text-white" />
                  <span>Launch Deadlock Lab</span>
                </Link>
              </div>
            </div>
          </div>

          {/* The Four Coffman Conditions */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              The Four Coffman Conditions (1971)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lab-card p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 font-mono">CONDITION 1</div>
                <div className="text-sm font-bold text-slate-900">Mutual Exclusion</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  At least one resource is held in a non-shareable mode; only one thread can hold it at any given moment.
                </p>
              </div>

              <div className="lab-card p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 font-mono">CONDITION 2</div>
                <div className="text-sm font-bold text-slate-900">Hold and Wait</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A thread holds at least one resource while concurrently waiting to acquire additional resources held by other threads.
                </p>
              </div>

              <div className="lab-card p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 font-mono">CONDITION 3</div>
                <div className="text-sm font-bold text-slate-900">No Preemption</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resources cannot be forcibly confiscated from a thread; a resource can only be released voluntarily after execution finishes.
                </p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs space-y-1.5">
                <div className="text-[11px] font-bold text-rose-600 font-mono">CONDITION 4</div>
                <div className="text-sm font-bold text-rose-900">Circular Wait</div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  A closed chain of threads exists where T0 waits for a lock held by T1, and T1 waits for a lock held by T0.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Wait-For Graph Live Demonstration */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Live Wait-For Graph (Cycle Detection Demo)
                </h2>
                <p className="text-xs text-slate-500">
                  Actual Wait-For Graph derived directly from the Two-Thread Deadlock scenario where Thread A and Thread B form an unrecoverable circular wait.
                </p>
              </div>
              <Link
                href="/deadlock-analyzer"
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Open Full Analyzer</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>

            {/* Reused Wait-For Graph with Real Detected Deadlock */}
            <WaitForGraph snapshot={deadlockSnapshot} />
            <ResourceMonitor snapshot={deadlockSnapshot} />
          </div>

          {/* Prevention & Mitigation Strategy */}
          <div className="lab-card p-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircleIcon size={16} className="text-emerald-600" />
              <span>Deadlock Prevention: Global Lock Ordering Protocol</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Deadlock is structurally impossible if threads acquire locks in a globally ordered hierarchy (Lock 1 &lt; Lock 2 &lt; ... &lt; Lock N). In our experiment, Thread A acquired Lock A then Lock B, whereas Thread B acquired Lock B then Lock A. Imposing strict ascending lock acquisition eliminates Coffman Condition 4.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render MODULE 3: Process Synchronization
  if (moduleId === "process-synchronization") {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb & Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span>Modules</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Module 03</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold tracking-wider text-teal-700 border border-teal-200/80 mb-1">
                  Module 03 · Synchronization Primitives
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  Process Synchronization & Semaphores
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                  Master mutual exclusion, Dijkstra semaphores, and coordinated thread execution in bounded buffers.
                </p>
              </div>
              <Link
                href="/simulation?scenario=scenario-producer-consumer"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow-xs self-start sm:self-auto shrink-0"
              >
                <PlayCircleIcon size={16} className="text-white" />
                <span>Launch Producer-Consumer Lab</span>
              </Link>
            </div>
          </div>

          {/* Core Synchronization Theory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-teal-600">
                <SyncIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mutex Locks vs. Semaphores
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A <strong>Mutex</strong> is an ownership lock (binary token, 0 or 1) owned by one thread. A <strong>Semaphore</strong> maintains an integer permit counter with atomic <code>wait(S)</code> and <code>signal(S)</code> primitives.
              </p>
            </div>

            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-600">
                <ShieldAlertIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bounded Buffer Problem
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Producers write items into fixed-size storage, while Consumers remove them. Synchronization ensures producers never overwrite a full buffer and consumers never read an empty buffer.
              </p>
            </div>

            <div className="lab-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-600">
                <CheckCircleIcon size={18} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Counting Semaphores in Action
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Semaphore <code>empty</code> initializes to buffer capacity (N=1). Semaphore <code>full</code> initializes to 0. Binary semaphore <code>mutex</code> (1) enforces exclusive buffer modification.
              </p>
            </div>
          </div>

          {/* Interactive Demonstration */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Experiment Harness: Producer-Consumer Coordination
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect initial counting and binary semaphore states: empty=1, full=0, mutex=1.
                </p>
              </div>
              <Link
                href="/simulation?scenario=scenario-producer-consumer"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Launch in Simulation Lab</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>

            <ResourceMonitor snapshot={producerConsumerSnapshot} />
            <ThreadStateTable snapshot={producerConsumerSnapshot} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render MODULE 4: Thread Monitoring
  if (moduleId === "thread-monitoring") {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb & Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span>Modules</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Module 04</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold tracking-wider text-purple-700 border border-purple-200/80 mb-1">
                  Module 04 · Thread Telemetry
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                  Thread Lifecycle & Execution Monitoring
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                  Trace POSIX thread lifecycle states, context switches, ready queue rotations, and Gantt timelines.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
                <Link
                  href="/thread-monitor"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span>Thread Monitor</span>
                </Link>
                <Link
                  href="/simulation"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-purple-700 transition-colors shadow-xs"
                >
                  <PlayCircleIcon size={16} className="text-white" />
                  <span>Launch Simulation Lab</span>
                </Link>
              </div>
            </div>
          </div>

          {/* POSIX Thread State Lifecycle Cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Discrete Thread Execution Lifecycle
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="lab-card p-4 space-y-1">
                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200 mb-1">
                  NEW
                </span>
                <div className="text-sm font-bold text-slate-900">Initialized</div>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Thread allocated in memory; not yet admitted to the CPU ready queue.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs space-y-1">
                <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 mb-1">
                  READY
                </span>
                <div className="text-sm font-bold text-blue-900">Runnable Queue</div>
                <p className="text-xs text-blue-800 mt-1 leading-normal">
                  Eligible for execution; waiting for scheduler CPU dispatch.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs space-y-1">
                <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 mb-1">
                  RUNNING
                </span>
                <div className="text-sm font-bold text-emerald-900">Active on CPU</div>
                <p className="text-xs text-emerald-800 mt-1 leading-normal">
                  Actively executing operations on the physical or virtual processor.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs space-y-1">
                <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 mb-1">
                  BLOCKED
                </span>
                <div className="text-sm font-bold text-amber-900">Waiting</div>
                <p className="text-xs text-amber-800 mt-1 leading-normal">
                  Yielded CPU; waiting on mutex lock acquisition or semaphore permit.
                </p>
              </div>

              <div className="lab-card p-4 space-y-1">
                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200 mb-1">
                  DONE
                </span>
                <div className="text-sm font-bold text-slate-900">Halted</div>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  All instructions executed; thread finished and terminated.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Execution Timeline & State Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Gantt Execution Timeline & State Table
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time visualization of CPU context switches and discrete execution steps across logical clock ticks.
                </p>
              </div>
              <Link
                href="/simulation"
                className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Open in Simulation Lab</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>

            <ExecutionTimeline snapshot={threadMonitoringSnapshot} />
            <ThreadStateTable snapshot={threadMonitoringSnapshot} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Fallback / Unknown Module
  return (
    <DashboardLayout>
      <div className="p-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Module Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested module identifier &ldquo;{moduleId}&rdquo; does not match any curated laboratory modules.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow-xs"
          >
            Return to Overview
          </Link>
          <Link
            href="/experiments"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Browse Experiments
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
