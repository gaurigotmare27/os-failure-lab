import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  starterScenarios,
  raceConditionScenario,
  deadlockScenario,
  producerConsumerScenario,
} from "@/lib/simulation/scenarios";
import {
  PlayCircleIcon,
  LayersIcon,
  LockIcon,
  SyncIcon,
  ThreadMonitorIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@/components/icons";

export default function ExperimentsPage() {
  const getExperimentDetails = (scenarioId: string) => {
    switch (scenarioId) {
      case raceConditionScenario.id:
        return {
          category: "Data Race & Lost Update",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          learningObjective:
            "Observe how lack of mutual exclusion during non-atomic read-modify-write sequences causes concurrent threads to overwrite each other's increments, resulting in an inconsistent final counter value.",
          concurrencyPrimitves: ["Shared Memory Variable", "CPU Registers"],
          scenarioQuery: "scenario-race-condition",
          icon: <LayersIcon size={20} className="text-blue-600" />,
        };
      case deadlockScenario.id:
        return {
          category: "Coffman Deadlock & Circular Wait",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
          learningObjective:
            "Analyze Coffman's four conditions in action. Observe how inverse lock acquisition ordering leads to permanent circular wait dependencies where neither thread can release its resource.",
          concurrencyPrimitves: ["Mutual Exclusion Mutexes", "Wait-For Graph"],
          scenarioQuery: "scenario-two-thread-deadlock",
          icon: <LockIcon size={20} className="text-rose-600" />,
        };
      case producerConsumerScenario.id:
      default:
        return {
          category: "Process Synchronization & Coordination",
          badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
          learningObjective:
            "Understand Dijkstra's semaphore synchronization primitives. Examine how counting semaphores ('empty' and 'full') and a binary semaphore ('mutex') regulate bounded-buffer item production and consumption.",
          concurrencyPrimitves: ["Counting Semaphores", "Binary Semaphores", "Bounded Buffer"],
          scenarioQuery: "scenario-producer-consumer",
          icon: <SyncIcon size={20} className="text-teal-600" />,
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb & Page Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Experiments</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Predefined Concurrency Experiments
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">
                Curated deterministic laboratory scenarios demonstrating canonical race conditions, deadlocks, and semaphore synchronization.
              </p>
            </div>
            <Link
              href="/simulation"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto shrink-0"
            >
              <span>Open Simulation Lab</span>
              <ArrowRightIcon size={14} className="text-white" />
            </Link>
          </div>
        </div>

        {/* Experiment Cards Grid */}
        <div className="space-y-6">
          {starterScenarios.map((scenario) => {
            const details = getExperimentDetails(scenario.id);

            return (
              <div
                key={scenario.id}
                className="lab-card p-6 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Column: Info & Details */}
                  <div className="flex-1 space-y-4 min-w-0">
                    {/* Scenario Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold border ${details.badgeColor}`}
                      >
                        {details.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        <ThreadMonitorIcon size={13} className="text-slate-500" />
                        {scenario.threads.length} Threads
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        <ClockIcon size={13} className="text-slate-500" />
                        {scenario.schedulingPolicy}
                        {scenario.timeQuantum ? ` (Q=${scenario.timeQuantum})` : ""}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 mt-1">
                        {details.icon}
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          {scenario.name}
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-3xl">
                          {scenario.description}
                        </p>
                      </div>
                    </div>

                    {/* Learning Objective Box */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs space-y-1.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
                        Learning Objective & Mechanics:
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {details.learningObjective}
                      </p>
                    </div>

                    {/* Thread Operations & Resource Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Threads Summary */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <span>Thread Instruction Pipeline</span>
                          <span className="font-mono text-slate-500 font-normal">
                            {scenario.threads.reduce(
                              (acc, t) => acc + t.operations.length,
                              0
                            )}{" "}
                            Total Ops
                          </span>
                        </div>
                        <div className="space-y-2">
                          {scenario.threads.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-xs border-b border-slate-100/70 pb-1.5 last:border-0 last:pb-0"
                            >
                              <span className="font-semibold text-slate-900">
                                {t.name}
                              </span>
                              <span className="text-slate-500 font-mono text-xs">
                                {t.operations.map((op) => op.type).join(" → ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Primitives Summary */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                          Active Primitives & Synchronization
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {details.concurrencyPrimitves.map((p) => (
                            <span
                              key={p}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/80"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        {scenario.locks.length > 0 && (
                          <div className="text-xs text-slate-600 pt-1">
                            Locks:{" "}
                            <span className="font-mono font-medium text-slate-800">
                              {scenario.locks.map((l) => l.name).join(", ")}
                            </span>
                          </div>
                        )}
                        {scenario.semaphores && scenario.semaphores.length > 0 && (
                          <div className="text-xs text-slate-600">
                            Semaphores:{" "}
                            <span className="font-mono font-medium text-slate-800">
                              {scenario.semaphores
                                .map((s) => `${s.name}(init=${s.initialValue})`)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {scenario.sharedVariables &&
                          scenario.sharedVariables.length > 0 && (
                            <div className="text-xs text-slate-600">
                              Shared Memory:{" "}
                              <span className="font-mono font-medium text-slate-800">
                                {scenario.sharedVariables
                                  .map((v) => `${v.name}=${v.initialValue}`)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Launch Action */}
                  <div className="shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/simulation?scenario=${details.scenarioQuery}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-xs w-full sm:w-auto"
                    >
                      <PlayCircleIcon size={16} className="text-white" />
                      <span>Launch Simulation</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
