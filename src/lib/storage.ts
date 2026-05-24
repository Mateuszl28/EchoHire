"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Candidate, Job, MatchResult } from "./types";

/**
 * Tiny reactive localStorage layer. Cross-tab + cross-hook updates via a
 * BroadcastChannel-style event so every component stays in sync.
 */

const EVT = "echohire-storage";

function readKey<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeKey<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
  } catch {
    /* quota / privacy errors — ignore */
  }
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  // SSR-safe snapshot
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return JSON.stringify(fallback);
    return localStorage.getItem(key) ?? JSON.stringify(fallback);
  }, [key, fallback]);
  const getServer = useCallback(() => JSON.stringify(fallback), [fallback]);

  const serialized = useSyncExternalStore(subscribe, getSnapshot, getServer);

  const [value, setValueState] = useState<T>(fallback);
  useEffect(() => {
    try {
      setValueState(JSON.parse(serialized) as T);
    } catch {
      setValueState(fallback);
    }
  }, [serialized, fallback]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const cur = readKey<T>(key, fallback);
      const computed = typeof next === "function" ? (next as (p: T) => T)(cur) : next;
      writeKey(key, computed);
      setValueState(computed);
    },
    [key, fallback]
  );

  return [value, set];
}

// ─ Candidates ─────────────────────────────────────────────────────────────

const CANDIDATES_KEY = "echohire.candidates.v1";

export function useCandidates() {
  const [list, setList] = useStored<Candidate[]>(CANDIDATES_KEY, []);
  const add = (c: Candidate) => setList((prev) => [c, ...prev]);
  const update = (id: string, patch: Partial<Candidate>) =>
    setList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c))
    );
  const remove = (id: string) => setList((prev) => prev.filter((c) => c.id !== id));
  const replaceAll = (next: Candidate[]) => setList(next);
  return { list, add, update, remove, replaceAll };
}

export function useCandidate(id: string | undefined) {
  const { list, update, remove } = useCandidates();
  const candidate = id ? list.find((c) => c.id === id) : undefined;
  return { candidate, update, remove };
}

// ─ Jobs ───────────────────────────────────────────────────────────────────

const JOBS_KEY = "echohire.jobs.v1";

export function useJobs() {
  const [list, setList] = useStored<Job[]>(JOBS_KEY, []);
  const add = (j: Job) => setList((prev) => [j, ...prev]);
  const update = (id: string, patch: Partial<Job>) =>
    setList((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  const remove = (id: string) => setList((prev) => prev.filter((j) => j.id !== id));
  const replaceAll = (next: Job[]) => setList(next);
  return { list, add, update, remove, replaceAll };
}

export function useJob(id: string | undefined) {
  const { list, update, remove } = useJobs();
  const job = id ? list.find((j) => j.id === id) : undefined;
  return { job, update, remove };
}

// ─ Matches ────────────────────────────────────────────────────────────────

const MATCHES_KEY = "echohire.matches.v1";

export function useMatches() {
  const [list, setList] = useStored<MatchResult[]>(MATCHES_KEY, []);
  const upsert = (m: MatchResult) =>
    setList((prev) => {
      const others = prev.filter((x) => !(x.candidateId === m.candidateId && x.jobId === m.jobId));
      return [m, ...others];
    });
  const remove = (candidateId: string, jobId: string) =>
    setList((prev) => prev.filter((m) => !(m.candidateId === candidateId && m.jobId === jobId)));
  const clear = () => setList([]);
  return { list, upsert, remove, clear };
}

// ─ Utility ────────────────────────────────────────────────────────────────

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
