import React, { useMemo } from "react";
import type { SimulationSnapshot } from "@/lib/simulation/types";
import {
  buildWaitForGraph,
  detectDeadlock,
  type WaitForGraphNode,
  type WaitForEdge,
} from "@/lib/simulation/diagnostics";

export interface WaitForGraphProps {
  /** The current immutable simulation snapshot */
  snapshot: SimulationSnapshot;
}

interface NodeCoords {
  x: number;
  y: number;
}

export const WaitForGraph: React.FC<WaitForGraphProps> = ({ snapshot }) => {
  // Derive wait-for graph and cycle detection directly from snapshot
  const graph = useMemo(() => buildWaitForGraph(snapshot), [snapshot]);
  const deadlock = useMemo(() => detectDeadlock(snapshot), [snapshot]);

  const width = 640;
  const height = 300;
  const nodeRadius = 38;

  // Calculate layout coordinates for all graph nodes
  const nodeCoords = useMemo<Record<string, NodeCoords>>(() => {
    const coords: Record<string, NodeCoords> = {};
    const n = graph.nodes.length;
    if (n === 0) return coords;

    if (n === 1) {
      coords[graph.nodes[0].threadId] = { x: width / 2, y: height / 2 };
    } else if (n === 2) {
      coords[graph.nodes[0].threadId] = { x: 190, y: height / 2 };
      coords[graph.nodes[1].threadId] = { x: 450, y: height / 2 };
    } else if (n === 3) {
      coords[graph.nodes[0].threadId] = { x: width / 2, y: 75 };
      coords[graph.nodes[1].threadId] = { x: 180, y: 225 };
      coords[graph.nodes[2].threadId] = { x: 460, y: 225 };
    } else {
      // Circular polygon distribution for >= 4 nodes
      const cx = width / 2;
      const cy = height / 2;
      const r = 100;
      graph.nodes.forEach((node, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        coords[node.threadId] = {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        };
      });
    }

    return coords;
  }, [graph.nodes]);

  // Check if an edge is part of a detected deadlock cycle
  const isEdgeInDeadlock = (edge: WaitForEdge): boolean => {
    if (!deadlock.isDeadlocked) return false;
    return deadlock.cycles.some((cycle) =>
      cycle.edges.some(
        (e) =>
          e.fromThreadId === edge.fromThreadId &&
          e.toThreadId === edge.toThreadId &&
          e.lockId === edge.lockId
      )
    );
  };

  const hasDependencies = graph.edges.length > 0;

  return (
    <div className="lab-card overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-4 h-4 text-slate-700 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Wait-For Graph (Dependency & Cycle Detection)
          </h2>
        </div>

        {/* Deadlock / Contention Status Indicator */}
        <div>
          {deadlock.isDeadlocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              Circular Wait Cycle Detected
            </span>
          ) : hasDependencies ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Contention Present (Acyclic)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              No Wait-For Dependencies
            </span>
          )}
        </div>
      </div>

      {/* Main Graph Visualization */}
      <div className="p-5">
        {!hasDependencies ? (
          <div className="py-12 px-4 text-center">
            <div className="mx-auto w-12 h-12 text-emerald-600 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border border-emerald-200 shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-sm font-bold text-slate-800">
              No Active Resource Dependencies
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No threads are currently blocked on mutex locks held by other threads.
              The Wait-For Graph has zero directed edges.
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto max-h-[340px] select-none"
            >
              <defs>
                {/* Standard Dependency Arrowhead */}
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                </marker>

                {/* Deadlock Cycle Highlight Arrowhead */}
                <marker
                  id="arrow-deadlock"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#e11d48" />
                </marker>
              </defs>

              {/* Render Directed Edges */}
              {graph.edges.map((edge, idx) => {
                const from = nodeCoords[edge.fromThreadId];
                const to = nodeCoords[edge.toThreadId];
                if (!from || !to) return null;

                const inDeadlock = isEdgeInDeadlock(edge);

                // Calculate vector from -> to
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) return null;

                const ux = dx / dist;
                const uy = dy / dist;

                // Perpendicular vector for curved arc
                const nx = -uy;
                const ny = ux;
                const curveOffset = 38;

                // Start and end points trimmed to node boundaries
                const sx = from.x + ux * nodeRadius;
                const sy = from.y + uy * nodeRadius;
                const ex = to.x - ux * (nodeRadius + 4);
                const ey = to.y - uy * (nodeRadius + 4);

                // Quadratic control point
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                const cx = mx + nx * curveOffset;
                const cy = my + ny * curveOffset;

                // Label point at midpoint of curve
                const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
                const ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;

                return (
                  <g key={`edge-${edge.fromThreadId}-${edge.toThreadId}-${edge.lockId}-${idx}`}>
                    {/* Directed Curved Edge Path */}
                    <path
                      d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                      fill="none"
                      stroke={inDeadlock ? "#e11d48" : "#94a3b8"}
                      strokeWidth={inDeadlock ? 2.5 : 1.75}
                      markerEnd={inDeadlock ? "url(#arrow-deadlock)" : "url(#arrow-default)"}
                    />

                    {/* Lock Label Pill on Edge */}
                    <g transform={`translate(${lx}, ${ly})`}>
                      <rect
                        x="-42"
                        y="-11"
                        width="84"
                        height="22"
                        rx="5"
                        fill={inDeadlock ? "#fee2e2" : "#ffffff"}
                        stroke={inDeadlock ? "#fca5a5" : "#cbd5e1"}
                        strokeWidth={1}
                        className="shadow-2xs"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill={inDeadlock ? "#9f1239" : "#334155"}
                        fontFamily="ui-monospace, monospace"
                      >
                        {edge.lockName}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Render Thread Nodes */}
              {graph.nodes.map((node: WaitForGraphNode) => {
                const pos = nodeCoords[node.threadId];
                if (!pos) return null;

                const isDeadlocked = deadlock.deadlockedThreadIds.includes(node.threadId);
                const isBlocked = node.state === "BLOCKED";
                const isRunning = node.state === "RUNNING";

                let strokeColor = "#cbd5e1";
                let fillColor = "#ffffff";
                let textColor = "#1e293b";

                if (isDeadlocked) {
                  strokeColor = "#e11d48";
                  fillColor = "#fff1f2";
                  textColor = "#9f1239";
                } else if (isBlocked) {
                  strokeColor = "#f59e0b";
                  fillColor = "#fffbeb";
                  textColor = "#92400e";
                } else if (isRunning) {
                  strokeColor = "#10b981";
                  fillColor = "#ecfdf5";
                  textColor = "#065f46";
                }

                return (
                  <g
                    key={`node-${node.threadId}`}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-default"
                  >
                    {/* Highlight ring for deadlocked threads */}
                    {isDeadlocked && (
                      <circle
                        r={nodeRadius + 6}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: "0 0", animationDuration: "8s" }}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={nodeRadius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isDeadlocked ? 2.5 : 2}
                      className="shadow-xs"
                    />

                    {/* Node Text: Thread Name */}
                    <text
                      x="0"
                      y="-7"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill={textColor}
                    >
                      {node.threadName}
                    </text>

                    {/* Node Text: State */}
                    <text
                      x="0"
                      y="10"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isDeadlocked ? "#e11d48" : "#475569"}
                      fontFamily="ui-sans-serif, system-ui"
                    >
                      {isDeadlocked ? "DEADLOCKED" : node.state}
                    </text>

                    {/* Held Locks Count Indicator */}
                    {node.heldLocks.length > 0 && (
                      <g transform="translate(0, 24)">
                        <rect
                          x="-26"
                          y="-7"
                          width="52"
                          height="14"
                          rx="4"
                          fill={isDeadlocked ? "#ffe4e6" : "#f1f5f9"}
                          stroke={isDeadlocked ? "#fecdd3" : "#e2e8f0"}
                          strokeWidth={0.5}
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="700"
                          fill="#334155"
                        >
                          Holds: {node.heldLocks.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Bottom Diagnostic Banner */}
            {deadlock.isDeadlocked && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                  Coffman Condition 4 (Circular Wait) Verified:
                </div>
                <div className="text-xs text-rose-800 leading-relaxed font-mono">
                  {deadlock.cycles.map((c, i) => (
                    <span key={i} className="block">
                      Cycle #{i + 1}: {c.threadIds.join(" → ")} (Contested Locks: {c.lockIds.join(", ")})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
