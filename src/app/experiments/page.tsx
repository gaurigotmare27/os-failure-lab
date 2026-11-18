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
          icon: <LayersIcon size={18} className="text-blue-600" />,
        };
      case deadlockScenario.id:
        return {
          category: "Coffman Deadlock & Circular Wait",
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
          learningObjective:
            "Analyze Coffman's four conditions in action. Observe how inverse lock acquisition ordering leads to permanent circular wait dependencies where neither thread can release its resource.",
          concurrencyPrimitves: ["Mutual Exclusion Mutexes", "Wait-For Graph"],
          scenarioQuery: "scenario-two-thread-deadlock",
          icon: <LockIcon size={18} className="text-rose-600" />,
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
          icon: <SyncIcon size={18} className="text-teal-600" />,
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-800">Experiments</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Predefined Concurrency Experiments
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Curated deterministic laboratory scenarios demonstrating canonical race conditions, deadlocks, and semaphore synchronization.
              </p>
            </div>
            <Link
              href="/simulation"
              className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <span>Open Simulation Lab</span>
              <ArrowRightIcon size={12} className="text-white" />
            </Link>
          </div>
        </div>

        {/* Experiment Cards Grid */}
        <div className="space-y-5">
          {starterScenarios.map((scenario) => {
            const details = getExperimentDetails(scenario.id);

            return (
              <div
                key={scenario.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Column: Info & Description */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold border ${details.badgeColor}`}
                      >
                        {details.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <ThreadMonitorIcon size={12} className="text-slate-400" />
                        {scenario.threads.length} Threads
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <ClockIcon size={12} className="text-slate-400" />
                        {scenario.schedulingPolicy}
                        {scenario.timeQuantum ? ` (Q=${scenario.timeQuantum})` : ""}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                        {details.icon}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {scenario.name}
                        </h2>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {scenario.description}
                        </p>
                      </div>
                    </div>

                    {/* Learning Objective Box */}
                    <div className="rounded border border-slate-100 bg-slate-50/80 p-3 text-xs">
                      <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px] block mb-1">
                        Learning Objective & Mechanics:
                      </span>
                      <p className="text-slate-600 leading-normal">
                        {details.learningObjective}
                      </p>
                    </div>

                    {/* Thread Operations & Resource Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Threads Summary */}
                      <div className="rounded border border-slate-200/70 p-2.5 bg-white">
                        <div className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Thread Instruction Pipeline</span>
                          <span className="font-mono text-slate-400 font-normal">
                            {scenario.threads.reduce(
                              (acc, t) => acc + t.operations.length,
                              0
                            )}{" "}
                            Total Ops
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {scenario.threads.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1 last:border-0 last:pb-0"
                            >
                              <span className="font-medium text-slate-900">
                                {t.name}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {t.operations.map((op) => op.type).join(" → ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Primitives Summary */}
                      <div className="rounded border border-slate-200/70 p-2.5 bg-white">
                        <div className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                          Active Primitives & Synchronization
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {details.concurrencyPrimitves.map((p) => (
                            <span
                              key={p}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 border border-slate-200"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        {scenario.locks.length > 0 && (
                          <div className="mt-2 text-[10.5px] text-slate-500">
                            Locks:{" "}
                            <span className="font-mono text-slate-700">
                              {scenario.locks.map((l) => l.name).join(", ")}
                            </span>
                          </div>
                        )}
                        {scenario.semaphores && scenario.semaphores.length > 0 && (
                          <div className="mt-1 text-[10.5px] text-slate-500">
                            Semaphores:{" "}
                            <span className="font-mono text-slate-700">
                              {scenario.semaphores
                                .map((s) => `${s.name}(init=${s.initialValue})`)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {scenario.sharedVariables &&
                          scenario.sharedVariables.length > 0 && (
                            <div className="mt-1 text-[10.5px] text-slate-500">
                              Shared Memory:{" "}
                              <span className="font-mono text-slate-700">
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
                  <div className="shrink-0 pt-2 md:pt-0">
                    <Link
                      href={`/simulation?scenario=${details.scenarioQuery}`}
                      className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-2xs w-full sm:w-auto"
                    >
                      <PlayCircleIcon size={14} className="text-white" />
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
