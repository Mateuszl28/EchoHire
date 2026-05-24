"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Radar } from "@/components/radar";
import { useCandidate, useCandidates } from "@/lib/storage";
import { extractScorecard } from "@/lib/scorecard";
import { logActivity } from "@/lib/activity";
import { CandidateTabs } from "@/components/candidate-tabs";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_DOT,
  STATUS_ORDER,
  formatRelative,
  initials,
} from "@/lib/format";
import type { CandidateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Briefcase,
  Copy,
  Download,
  Mail,
  MapPin,
  Sparkles,
  Square,
  Star,
  Trash2,
} from "lucide-react";

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { candidate, update, remove } = useCandidate(id);
  const { list: all } = useCandidates();

  if (!candidate) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          Candidate not found.{" "}
          <Link href="/candidates" className="underline">Back to candidates</Link>
        </div>
      </AppShell>
    );
  }

  // Pre-compute scorecard from existing analysis (no LLM call)
  const scorecard = useMemo(
    () => (candidate.analysis ? extractScorecard(candidate.analysis) : null),
    [candidate.analysis]
  );

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Link href="/candidates" className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> candidates
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{candidate.id}</span>
        </div>

        {/* Hero */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {initials(candidate.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
                  {candidate.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  <select
                    value={candidate.status}
                    onChange={(e) => update(candidate.id, { status: e.target.value as CandidateStatus })}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-transparent cursor-pointer ml-1",
                      STATUS_COLOR[candidate.status]
                    )}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {candidate.title}
                  </span>
                  {candidate.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {candidate.location}
                    </span>
                  )}
                  {candidate.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {candidate.email}
                    </span>
                  )}
                  <span className="font-mono text-xs">updated {formatRelative(candidate.updatedAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => update(candidate.id, { starred: !candidate.starred })}
                >
                  <Star className={cn(
                    "h-3.5 w-3.5",
                    candidate.starred ? "text-amber-500 fill-amber-500" : ""
                  )} />
                  {candidate.starred ? "Starred" : "Star"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete ${candidate.name}?`)) {
                      remove(candidate.id);
                      router.push("/candidates");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs (Analysis · Interview · Notes · Email) + Scorecard */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CandidateTabs
              candidate={candidate}
              analysisSlot={<AnalysisCard candidate={candidate} />}
            />
          </div>
          <div className="space-y-4">
            <ScorecardCard scorecard={scorecard} />
            <CvSourceCard cv={candidate.cv} />
            <RelatedCard
              currentId={candidate.id}
              candidates={all}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AnalysisCard({ candidate }: { candidate: ReturnType<typeof useCandidate>["candidate"] & {} }) {
  const { update } = useCandidates();
  const [analysis, setAnalysis] = useState<string>(candidate.analysis ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const ctlRef = useRef<AbortController | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setAnalysis("");
    setMode(null);
    const ctl = new AbortController();
    ctlRef.current = ctl;
    try {
      const res = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: candidate.cv }),
        signal: ctl.signal,
      });
      if (!res.ok) {
        let msg = `Request failed with status ${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      setMode((res.headers.get("x-echohire-mode") as "live" | "mock") ?? "live");
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        setAnalysis(buf);
      }
      const updated = logActivity(
        { ...candidate, analysis: buf },
        "analyzed",
        candidate.analysis ? "Re-ran analysis" : "Ran initial analysis",
        undefined,
        { length: buf.length }
      );
      update(candidate.id, updated);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const stop = () => ctlRef.current?.abort();
  const copy = () => navigator.clipboard?.writeText(analysis);
  const download = () => {
    const blob = new Blob([analysis], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.name.replace(/\s+/g, "-").toLowerCase()}-analysis.md`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          Claude analysis
          {mode === "mock" && (
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50">
              mock
            </span>
          )}
          {mode === "live" && (
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-700 bg-emerald-50">
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {analysis && !loading && (
            <>
              <Button variant="ghost" size="sm" onClick={copy} title="Copy markdown">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={download} title="Download .md">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {loading ? (
            <Button variant="outline" size="sm" onClick={stop}>
              <Square className="h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={run}>
              <Sparkles className="h-3.5 w-3.5" />
              {analysis ? "Re-analyze" : "Analyze with Claude"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {!analysis && !loading && !error && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          No analysis yet. Click <strong>Analyze with Claude</strong> to generate one.
        </div>
      )}
      {analysis && (
        <>
          <Markdown content={analysis} />
          {loading && <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-1 align-baseline" />}
        </>
      )}
      {loading && !analysis && (
        <div className="space-y-2 py-2">
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
        </div>
      )}
    </CardContent>
  );
}

function ScorecardCard({ scorecard }: { scorecard: ReturnType<typeof extractScorecard> | null }) {
  if (!scorecard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Run the analysis first — scorecard is derived from it.
          </p>
        </CardContent>
      </Card>
    );
  }
  const fitColor =
    scorecard.overallFit >= 80 ? "text-emerald-600"
    : scorecard.overallFit >= 60 ? "text-amber-600"
    : "text-rose-600";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-md border border-border p-2">
            <div className={cn("text-2xl font-bold font-mono", fitColor)}>{scorecard.overallFit}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall fit</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-2xl font-bold font-mono">{scorecard.yearsExperience}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Years exp</div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Radar axes={scorecard.axes} size={240} />
        </div>
        {scorecard.highlights.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Highlights</div>
            <ul className="space-y-0.5 text-xs">
              {scorecard.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CvSourceCard({ cv }: { cv: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>CV source</span>
          <span className="text-[10px] text-muted-foreground font-mono">{cv.length.toLocaleString()} chars</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <pre className={cn(
          "p-3 text-[11px] font-mono whitespace-pre-wrap overflow-y-auto bg-muted/30",
          expanded ? "max-h-[400px]" : "max-h-[140px]"
        )}>
          {cv}
        </pre>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/40 border-t border-border"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </CardContent>
    </Card>
  );
}

function RelatedCard({
  currentId, candidates,
}: { currentId: string; candidates: ReturnType<typeof useCandidates>["list"] }) {
  const others = candidates.filter((c) => c.id !== currentId).slice(0, 3);
  if (others.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other candidates</CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        {others.map((c) => (
          <Link key={c.id} href={`/candidates/${c.id}`}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
              {initials(c.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{c.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{c.title}</div>
            </div>
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[c.status])} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
