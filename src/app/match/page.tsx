"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidates, useJobs, useMatches } from "@/lib/storage";
import type { MatchResult } from "@/lib/types";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";

export default function MatchPage() {
  return (
    <Suspense fallback={<AppShell><div /></AppShell>}>
      <MatchInner />
    </Suspense>
  );
}

function MatchInner() {
  const sp = useSearchParams();
  const initialJobId = sp.get("job") ?? "";

  const { list: jobs } = useJobs();
  const { list: candidates } = useCandidates();
  const { list: storedMatches, upsert: upsertMatch } = useMatches();

  const [jobId, setJobId] = useState<string>(initialJobId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | "mock-fallback" | null>(null);

  // initial job preselect
  useEffect(() => {
    if (!jobId && jobs.length > 0) setJobId(jobs[0].id);
  }, [jobId, jobs]);

  // restore previous matches if any
  useEffect(() => {
    if (!jobId) return;
    const prior = storedMatches.filter((m) => m.jobId === jobId);
    setResults(prior.sort((a, b) => b.score - a.score));
  }, [jobId, storedMatches]);

  const job = jobs.find((j) => j.id === jobId);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAll = () =>
    setSelected((s) => (s.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id))));

  const run = async () => {
    if (!job) return;
    setError(null);
    setRunning(true);
    setResults([]);
    setMode(null);

    const picked = candidates.filter((c) => selected.has(c.id));
    if (picked.length === 0) {
      setError("Pick at least one candidate.");
      setRunning(false);
      return;
    }

    try {
      const res = await fetch("/api/match-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: {
            id: job.id,
            title: job.title,
            description: job.description,
            mustHave: job.mustHave,
            niceToHave: job.niceToHave,
          },
          candidates: picked.map((c) => ({ id: c.id, name: c.name, cv: c.cv })),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMode((res.headers.get("x-echohire-mode") as typeof mode) ?? "live");
      const j = (await res.json()) as { matches: Omit<MatchResult, "jobId" | "computedAt">[] };
      const matches: MatchResult[] = j.matches.map((m) => ({
        ...m,
        jobId: job.id,
        computedAt: Date.now(),
      }));
      setResults(matches);
      matches.forEach(upsertMatch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const sortedResults = useMemo(
    () => results.slice().sort((a, b) => b.score - a.score),
    [results]
  );

  if (jobs.length === 0 || candidates.length === 0) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto text-center space-y-3">
          <Target className="h-7 w-7 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Match candidates to a job</h1>
          <p className="text-sm text-muted-foreground">
            You need {jobs.length === 0 ? "at least one job" : ""}
            {jobs.length === 0 && candidates.length === 0 ? " and " : ""}
            {candidates.length === 0 ? "at least one candidate" : ""}
            {" "}before you can run a match.
          </p>
          <div className="flex items-center justify-center gap-2">
            {jobs.length === 0 && (
              <Link href="/jobs"><Button>Add a job</Button></Link>
            )}
            {candidates.length === 0 && (
              <Link href="/candidates"><Button>Add a candidate</Button></Link>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI matching</h1>
          <p className="text-sm text-muted-foreground">
            Pick a role + candidates → Claude scores each on 0-100 fit, with matched skills, gaps, and rationale.
          </p>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Job picker */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                1. Pick a role
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-[280px] overflow-y-auto">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setJobId(j.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-md border transition-colors",
                    jobId === j.id
                      ? "border-indigo-500/50 bg-indigo-50/50"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div className="text-sm font-medium line-clamp-1">{j.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    {j.team} · {j.location}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Candidate picker */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-violet-600" />
                  2. Pick candidates ({selected.size}/{candidates.length})
                </span>
                <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground">
                  {selected.size === candidates.length ? "Deselect all" : "Select all"}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[280px] overflow-y-auto">
              {candidates.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors",
                      checked ? "border-violet-500/50 bg-violet-50/50" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                      className="accent-violet-600"
                    />
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.title}</div>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Run + results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                3. Run match
                {mode === "mock" && (
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50">
                    mock
                  </span>
                )}
                {mode === "mock-fallback" && (
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50">
                    fallback
                  </span>
                )}
                {mode === "live" && (
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-700 bg-emerald-50">
                    live
                  </span>
                )}
              </span>
              <Button
                onClick={run}
                disabled={running || selected.size === 0 || !jobId}
                className="gap-1.5"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {running ? "Scoring…" : `Score ${selected.size || ""} candidate${selected.size === 1 ? "" : "s"}`}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="m-3 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {running && results.length === 0 && (
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </div>
            )}
            {!running && results.length === 0 && !error && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Pick candidates above and click <strong>Score</strong>.
              </div>
            )}
            {sortedResults.length > 0 && (
              <ul className="divide-y divide-border">
                {sortedResults.map((m, i) => {
                  const c = candidates.find((x) => x.id === m.candidateId);
                  if (!c) return null;
                  return (
                    <li key={m.candidateId} className="p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="text-right shrink-0 w-14">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">#{i + 1}</div>
                          <div className={cn(
                            "text-2xl font-bold font-mono leading-none mt-0.5",
                            m.score >= 80 ? "text-emerald-600"
                            : m.score >= 60 ? "text-amber-600"
                            : "text-rose-600"
                          )}>
                            {m.score}
                          </div>
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">fit</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/candidates/${c.id}`}
                            className="flex items-center gap-2 min-w-0 group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {initials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate group-hover:underline">{c.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{c.title}</div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <p className="mt-2 text-sm text-foreground/85">{m.rationale}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.matchedSkills.map((s) => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                                ✓ {s}
                              </span>
                            ))}
                            {m.gaps.map((g) => (
                              <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                                ✗ {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
