"use client";

import { Sparkles } from "lucide-react";
import { useCandidates, useJobs, useMatches } from "@/lib/storage";
import { sampleCandidates, sampleJobs } from "@/lib/mock-data";

export function Header() {
  const { list: candidates, replaceAll: replaceCandidates } = useCandidates();
  const { list: jobs, replaceAll: replaceJobs } = useJobs();
  const { clear: clearMatches } = useMatches();

  const loadSamples = () => {
    replaceCandidates(sampleCandidates());
    replaceJobs(sampleJobs());
    clearMatches();
  };

  const reset = () => {
    if (typeof window === "undefined") return;
    if (!confirm("Reset all candidates, jobs, and matches from your browser?")) return;
    replaceCandidates([]);
    replaceJobs([]);
    clearMatches();
  };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card flex items-center px-4 gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live · Claude Sonnet 4.6</span>
      </div>

      <div className="flex-1" />

      <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-3">
        <span className="font-mono">
          {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
        </span>
        <span className="text-border">·</span>
        <span className="font-mono">
          {jobs.length} job{jobs.length === 1 ? "" : "s"}
        </span>
      </div>

      <button
        onClick={loadSamples}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/60 transition-colors"
        title="Replace browser data with a curated demo set"
      >
        <Sparkles className="h-3 w-3 text-violet-500" />
        Load samples
      </button>

      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/60 transition-colors"
      >
        Reset
      </button>

      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
        MC
      </div>
    </header>
  );
}
