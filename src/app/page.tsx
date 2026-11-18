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
      "Explore shared data conflicts and understand how unsafe thread execution creates incorrect results.",
    concepts: ["Shared Memory", "Critical Section", "Atomic Operations"],
  },
  {
    id: "deadlock-detection",
    code: "LAB 02",
    title: "Deadlock Detection",
    description:
      "Visualize resource dependencies, circular waits and deadlock prevention.",
    concepts: ["Circular Wait", "Resource Graphs", "Coffman Conditions"],
  },
  {
    id: "process-synchronization",
    code: "LAB 03",
    title: "Process Synchronization",
    description:
      "Learn critical sections, mutex locks, semaphores and controlled resource access.",
    concepts: ["Mutex Locks", "Counting Semaphores", "Condition Variables"],
  },
  {
    id: "thread-monitoring",
    code: "LAB 04",
    title: "Thread Monitoring",
    description:
      "Observe thread states, execution timelines, waiting time and event logs.",
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
      <div className="space-y-5">
        {/* Welcome Section */}
        <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Operating Systems Laboratory
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-normal">
                Explore concurrency problems, understand operating system failures
                and experiment with synchronization.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/simulation"
                className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs"
              >
                <span>Start an Experiment</span>
                <ArrowRightIcon size={12} className="text-white" />
              </Link>
            </div>
          </div>
        </div>

        {/* At a glance Section */}
        <section aria-labelledby="at-a-glance-heading">
          <div className="mb-2.5">
            <h2
              id="at-a-glance-heading"
              className="text-xs font-semibold text-slate-900 uppercase tracking-wide"
            >
              At a glance
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              stat={summaryStats[0]}
              icon={<LayersIcon size={16} className="text-slate-600" />}
            />
            <StatCard
              stat={summaryStats[1]}
              icon={<SimulationLabIcon size={16} className="text-slate-600" />}
            />
            <StatCard
              stat={summaryStats[2]}
              icon={<ThreadMonitorIcon size={16} className="text-slate-600" />}
            />
            <StatCard
              stat={summaryStats[3]}
              icon={<ClockIcon size={16} className="text-slate-600" />}
            />
          </div>
        </section>

        {/* Main Grid: Workbench Left + Side Context Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Learning Modules Section */}
            <section aria-labelledby="modules-heading">
              <div className="mb-2.5">
                <h2
                  id="modules-heading"
                  className="text-xs font-semibold text-slate-900 uppercase tracking-wide"
                >
                  Learning Modules
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive topics for concurrency principles, thread safety and deadlock prevention
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ModuleCard
                  module={learningModules[0]}
                  icon={<SimulationLabIcon size={16} className="text-slate-700" />}
                />
                <ModuleCard
                  module={learningModules[1]}
                  icon={<DeadlockAnalyzerIcon size={16} className="text-slate-700" />}
                />
                <ModuleCard
                  module={learningModules[2]}
                  icon={<SyncIcon size={16} className="text-slate-700" />}
                />
                <ModuleCard
                  module={learningModules[3]}
                  icon={<ThreadMonitorIcon size={16} className="text-slate-700" />}
                />
              </div>
            </section>

            {/* Quick Start Section */}
            <section id="quickstart" aria-labelledby="quickstart-heading">
              <div className="mb-2.5">
                <h2
                  id="quickstart-heading"
                  className="text-xs font-semibold text-slate-900 uppercase tracking-wide"
                >
                  Quick Start Experiments
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-configured scenarios ready for execution trace inspection
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickStartCard
                  experiment={quickStartExperiments[0]}
                  icon={<LockIcon size={14} className="text-slate-700" />}
                />
                <QuickStartCard
                  experiment={quickStartExperiments[1]}
                  icon={<DeadlockAnalyzerIcon size={14} className="text-slate-700" />}
                />
                <QuickStartCard
                  experiment={quickStartExperiments[2]}
                  icon={<SyncIcon size={14} className="text-slate-700" />}
                />
              </div>
            </section>
          </div>

          {/* Right Side Column: Thread Model Reference & Activity */}
          <div className="lg:col-span-4 space-y-5">
            {/* Thread State Model Reference */}
            <ThreadStateReference />

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
