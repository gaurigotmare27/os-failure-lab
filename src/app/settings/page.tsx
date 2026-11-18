"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  CheckCircleIcon,
  SyncIcon,
  ClockIcon,
  LayersIcon,
} from "@/components/icons";

export default function SettingsPage() {
  const [defaultPolicy, setDefaultPolicy] = useState<string>("ROUND_ROBIN");
  const [defaultQuantum, setDefaultQuantum] = useState<number>(1);
  const [stepInterval, setStepInterval] = useState<number>(750);
  const [maxTraceLimit, setMaxTraceLimit] = useState<number>(1000);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-800">Settings</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Laboratory & Simulator Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure deterministic execution parameters, scheduler defaults, and environment preferences.
            </p>
          </div>
        </div>

        {saved && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon size={16} className="text-emerald-600 shrink-0" />
            <span>Settings saved successfully. New preferences will apply to newly initialized simulation scenarios.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Scheduler Parameters */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <SyncIcon size={16} className="text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                CPU Scheduler Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="default-policy"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Default Scheduling Algorithm
                </label>
                <select
                  id="default-policy"
                  value={defaultPolicy}
                  onChange={(e) => setDefaultPolicy(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="ROUND_ROBIN">Round Robin (Preemptive Time-Slicing)</option>
                  <option value="FCFS">First-Come, First-Served (FCFS)</option>
                  <option value="PRIORITY">Priority Scheduling (Highest Priority First)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Determines how the ready queue orders eligible threads.
                </p>
              </div>

              <div>
                <label
                  htmlFor="default-quantum"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Round Robin Time Quantum (Clock Ticks)
                </label>
                <input
                  id="default-quantum"
                  type="number"
                  min={1}
                  max={10}
                  value={defaultQuantum}
                  onChange={(e) => setDefaultQuantum(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Discrete tick allocation before forced CPU preemption.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Execution Timing */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ClockIcon size={16} className="text-slate-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Simulation Engine Timing
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="step-interval"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Auto-Run Playback Interval (ms)
                </label>
                <input
                  id="step-interval"
                  type="number"
                  min={100}
                  max={5000}
                  step={50}
                  value={stepInterval}
                  onChange={(e) => setStepInterval(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Delay between consecutive automated step executions.
                </p>
              </div>

              <div>
                <label
                  htmlFor="max-trace"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Maximum Event Trace Limit
                </label>
                <input
                  id="max-trace"
                  type="number"
                  min={100}
                  max={5000}
                  step={100}
                  value={maxTraceLimit}
                  onChange={(e) => setMaxTraceLimit(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Safety halt trigger preventing infinite loop execution.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Metadata Reference */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <LayersIcon size={16} className="text-slate-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                System Runtime Environment
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-100 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-400 font-mono block">MODEL</span>
                <span className="font-semibold text-slate-800">POSIX Threading</span>
              </div>
              <div className="border border-slate-100 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-400 font-mono block">EXECUTION</span>
                <span className="font-semibold text-slate-800">Discrete-Event</span>
              </div>
              <div className="border border-slate-100 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-400 font-mono block">DIAGNOSTICS</span>
                <span className="font-semibold text-slate-800">Wait-For Graph</span>
              </div>
              <div className="border border-slate-100 p-2 rounded bg-slate-50">
                <span className="text-[10px] text-slate-400 font-mono block">IMMUTABILITY</span>
                <span className="font-semibold text-slate-800">Deep Snapshot</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
