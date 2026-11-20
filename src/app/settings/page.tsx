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
      <div className="space-y-8 max-w-4xl">
        {/* Breadcrumb & Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Overview
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Settings</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Laboratory & Simulator Settings
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Configure deterministic execution parameters, scheduler defaults, and runtime environment preferences.
            </p>
          </div>
        </div>

        {saved && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-3 shadow-2xs">
            <CheckCircleIcon size={20} className="text-emerald-600 shrink-0" />
            <span className="font-medium">Settings saved successfully. New preferences will apply to newly initialized simulation scenarios.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Scheduler Parameters */}
          <div className="lab-card p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <SyncIcon size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                CPU Scheduler Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="default-policy"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Default Scheduling Algorithm
                </label>
                <select
                  id="default-policy"
                  value={defaultPolicy}
                  onChange={(e) => setDefaultPolicy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                >
                  <option value="ROUND_ROBIN">Round Robin (Preemptive Time-Slicing)</option>
                  <option value="FCFS">First-Come, First-Served (FCFS)</option>
                  <option value="PRIORITY">Priority Scheduling (Highest Priority First)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  Determines how the ready queue orders and dispatches eligible threads.
                </p>
              </div>

              <div>
                <label
                  htmlFor="default-quantum"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                />
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  Discrete tick allocation before forced CPU preemption and context switch.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Execution Timing */}
          <div className="lab-card p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ClockIcon size={18} className="text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Simulation Engine Timing & Limits
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="step-interval"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                />
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  Delay between consecutive automated step executions during continuous run.
                </p>
              </div>

              <div>
                <label
                  htmlFor="max-trace"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
                />
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  Safety halt trigger preventing runaway infinite execution traces.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Metadata Reference */}
          <div className="lab-card p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <LayersIcon size={18} className="text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Runtime Environment
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/70 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-bold block">MODEL</span>
                <span className="font-bold text-sm text-slate-900">POSIX Threading</span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/70 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-bold block">EXECUTION</span>
                <span className="font-bold text-sm text-slate-900">Discrete-Event</span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/70 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-bold block">DIAGNOSTICS</span>
                <span className="font-bold text-sm text-slate-900">Wait-For Graph</span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/70 space-y-0.5">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider font-bold block">STATE IMMUTABILITY</span>
                <span className="font-bold text-sm text-slate-900">Deep Snapshot</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
