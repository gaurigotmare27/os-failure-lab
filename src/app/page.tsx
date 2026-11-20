import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ModuleCard } from "@/components/ModuleCard";
import { QuickStartCard } from "@/components/QuickStartCard";
import { ThreadStateReference } from "@/components/ThreadStateReference";
import { RecentActivity } from "@/components/RecentActivity";
import {
  LayersIcon,
  SimulationLabIcon,
  ThreadMonitorIcon,
  DeadlockAnalyzerIcon,
  SyncIcon,
  LockIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@/components/icons";
import {
  StatMetric,
  LearningModule,
  QuickStartExperiment,
} from "@/types/dashboard";

const summaryStats: StatMetric[] = [
  {
    id: "learning-modules",
    label: "Learning Modules",
    value: "04",
    subtext: "Curated OS labs",
  },
  {
    id: "starter-experiments",
    label: "Starter Experiments",
    value: "03",
    subtext: "Preset failure cases",
  },
  {
    id: "thread-states",
    label: "Thread States",
    value: "05",
    subtext: "POSIX thread model",
  },
  {
    id: "simulation-runs",
    label: "Simulation Runs",
    value: "00",
    subtext: "Recorded traces",
  },
];

const learningModules: LearningModule[] = [
  {
    id: "race-condition",
    code: "LAB 01",
    title: "Race Condition Laboratory",
    description:
      "Explore shared data conflicts and understand how unsafe thread execution creates non-deterministic lost updates.",
    concepts: ["Shared Memory", "Critical Section", "Atomic Operations"],
  },
  {
    id: "deadlock-detection",
    code: "LAB 02",
    title: "Deadlock Detection",
    description:
      "Visualize resource allocation dependencies, circular wait conditions, and Coffman criteria verification.",
    concepts: ["Circular Wait", "Resource Graphs", "Coffman Conditions"],
  },
  {
    id: "process-synchronization",
    code: "LAB 03",
    title: "Process Synchronization",
    description:
      "Learn critical sections, binary mutex locks, counting semaphores, and producer-consumer coordination.",
    concepts: ["Mutex Locks", "Counting Semaphores", "Condition Variables"],
  },
  {
    id: "thread-monitoring",
    code: "LAB 04",
    title: "Thread Monitoring",
    description:
      "Observe deterministic thread state transitions, CPU Gantt timelines, ready queue dispatch, and context switches.",
    concepts: ["State Transitions", "Gantt Timeline", "Context Switching"],
  },
];

const quickStartExperiments: QuickStartExperiment[] = [
  {
    id: "exp-shared-counter",
    title: "Shared Counter Race Condition",
    description:
      "Two threads concurrently increment a shared counter without mutual exclusion, causing non-deterministic lost updates.",
    category: "Data Race",
    threads: "2 Threads",
  },
  {
    id: "exp-two-thread-deadlock",
    title: "Two-Thread Deadlock",
    description:
      "Classic circular wait scenario where Thread 1 holds Lock A awaiting Lock B, and Thread 2 holds Lock B awaiting Lock A.",
    category: "Deadlock",
    threads: "2 Threads",
  },
  {
    id: "exp-producer-consumer",
    title: "Producer-Consumer Problem",
    description:
      "Bounded buffer synchronization using mutexes and semaphores to coordinate data exchange and guard boundary limits.",
    category: "Synchronization",
    threads: "4 Threads",
  },
];

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Welcome Banner */}
        <div className="lab-card p-6 sm:p-8 bg-gradient-to-r from-white via-white to-blue-50/40 border-slate-200/90 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                Academic OS Simulator
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Operating Systems Laboratory
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Explore concurrency problems, inspect deterministic thread state transitions, analyze resource dependency graphs, and verify synchronization protocols in real time.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-3">
              <Link
                href="/experiments"
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
              >
                <span>Browse Experiments</span>
              </Link>
              <Link
                href="/simulation"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-xs"
              >
                <span>Launch Simulation Lab</span>
                <ArrowRightIcon size={14} className="text-white" />
              </Link>
            </div>
          </div>
        </div>

        {/* At a glance Metrics Section */}
        <section aria-labelledby="at-a-glance-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="at-a-glance-heading"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Laboratory Telemetry & Architecture
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              stat={summaryStats[0]}
              icon={<LayersIcon size={20} className="text-blue-600" />}
            />
            <StatCard
              stat={summaryStats[1]}
              icon={<SimulationLabIcon size={20} className="text-emerald-600" />}
            />
            <StatCard
              stat={summaryStats[2]}
              icon={<ThreadMonitorIcon size={20} className="text-purple-600" />}
            />
            <StatCard
              stat={summaryStats[3]}
              icon={<ClockIcon size={20} className="text-amber-600" />}
            />
          </div>
        </section>

        {/* Main Grid: Learning Modules & Quickstart on Left + Reference Sidebar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Learning Modules Section */}
            <section aria-labelledby="modules-heading" className="space-y-4">
              <div>
                <h2
                  id="modules-heading"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                >
                  Interactive Learning Modules
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Structured laboratory topics for concurrency principles, thread safety, and deadlock prevention
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModuleCard
                  module={learningModules[0]}
                  icon={<SimulationLabIcon size={18} className="text-blue-600" />}
                />
                <ModuleCard
                  module={learningModules[1]}
                  icon={<DeadlockAnalyzerIcon size={18} className="text-rose-600" />}
                />
                <ModuleCard
                  module={learningModules[2]}
                  icon={<SyncIcon size={18} className="text-teal-600" />}
                />
                <ModuleCard
                  module={learningModules[3]}
                  icon={<ThreadMonitorIcon size={18} className="text-purple-600" />}
                />
              </div>
            </section>

            {/* Quick Start Section */}
            <section id="quickstart" aria-labelledby="quickstart-heading" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h2
                    id="quickstart-heading"
                    className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                  >
                    Quick Start Failure Scenarios
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Deterministic scenarios ready for immediate execution trace inspection
                  </p>
                </div>
                <Link
                  href="/experiments"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>All experiments</span>
                  <ArrowRightIcon size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickStartCard
                  experiment={quickStartExperiments[0]}
                  icon={<LockIcon size={16} className="text-blue-600" />}
                />
                <QuickStartCard
                  experiment={quickStartExperiments[1]}
                  icon={<DeadlockAnalyzerIcon size={16} className="text-rose-600" />}
                />
                <QuickStartCard
                  experiment={quickStartExperiments[2]}
                  icon={<SyncIcon size={16} className="text-teal-600" />}
                />
              </div>
            </section>
          </div>

          {/* Right Context Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <ThreadStateReference />
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
