/**
 * OS Failure Lab - Client-side Run History Persistence
 *
 * Implements persistent localStorage management for completed and deadlocked simulation runs:
 * - Stores authentic SimulationSnapshot states without synthetic data
 * - Prevents duplicate saves of the same terminal state
 * - Implements a maximum run capacity FIFO pruning
 * - Safe for SSR and resilient against localStorage corruption/quota limits
 */

import type { SimulationSnapshot, SimulationStatus } from "./types";

const STORAGE_KEY = "os_failure_lab_run_history_v1";
const MAX_HISTORY_ITEMS = 15;

/**
 * Record representing a persisted simulation experiment run.
 */
export interface SavedSimulationRun {
  runId: string;
  scenarioId: string;
  scenarioName: string;
  schedulingPolicy: string;
  savedAt: string;
  status: SimulationStatus;
  logicalTime: number;
  eventsCount: number;
  /** Signature used to detect and prevent duplicate saves */
  fingerprint: string;
  /** The full immutable snapshot captured at save */
  snapshot: SimulationSnapshot;
}

/**
 * Generates a unique fingerprint for a snapshot to avoid duplicate entries.
 */
function generateRunFingerprint(
  scenarioId: string,
  snapshot: SimulationSnapshot
): string {
  return `${scenarioId}::${snapshot.status}::T${snapshot.logicalTime}::E${snapshot.eventTrace.length}`;
}

/**
 * Retrieves all saved simulation runs from localStorage, ordered newest first.
 */
export function getSavedRuns(): SavedSimulationRun[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter and validate structure
    const validRuns: SavedSimulationRun[] = parsed.filter(
      (item): item is SavedSimulationRun =>
        item !== null &&
        typeof item === "object" &&
        typeof item.runId === "string" &&
        typeof item.scenarioId === "string" &&
        typeof item.snapshot === "object" &&
        item.snapshot !== null &&
        Array.isArray(item.snapshot.threads)
    );

    return validRuns;
  } catch (err) {
    console.warn("Failed to load saved simulation runs from localStorage:", err);
    return [];
  }
}

/**
 * Persists an authentic SimulationSnapshot to history.
 * Only saves if the run fingerprint is not already identical to the most recent run.
 *
 * @returns The saved record or null if duplicate/failed.
 */
export function saveSimulationRun(
  snapshot: SimulationSnapshot,
  scenario: { id: string; name: string }
): SavedSimulationRun | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const currentRuns = getSavedRuns();
    const fingerprint = generateRunFingerprint(scenario.id, snapshot);

    // Prevent immediate duplicate save of the exact same state
    const duplicate = currentRuns.find((r) => r.fingerprint === fingerprint);
    if (duplicate) {
      return duplicate;
    }

    const newRecord: SavedSimulationRun = {
      runId: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      schedulingPolicy: snapshot.schedulingPolicy,
      savedAt: new Date().toISOString(),
      status: snapshot.status,
      logicalTime: snapshot.logicalTime,
      eventsCount: snapshot.eventTrace.length,
      fingerprint,
      snapshot: structuredClone(snapshot),
    };

    // Prepend and enforce maximum capacity limit
    const updatedRuns = [newRecord, ...currentRuns].slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRuns));

    return newRecord;
  } catch (err) {
    console.warn("Failed to persist simulation run to localStorage:", err);
    return null;
  }
}

/**
 * Deletes an individual simulation run by runId.
 */
export function deleteSavedRun(runId: string): void {
  if (typeof window === "undefined") return;

  try {
    const currentRuns = getSavedRuns();
    const filtered = currentRuns.filter((r) => r.runId !== runId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete saved simulation run:", err);
  }
}

/**
 * Clears all saved simulation runs from localStorage.
 */
export function clearSavedRuns(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear simulation run history:", err);
  }
}
