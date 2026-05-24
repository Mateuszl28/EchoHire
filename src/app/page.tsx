"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidates, useJobs, useMatches } from "@/lib/storage";
import { STATUS_LABEL, STATUS_COLOR, STATUS_DOT, STATUS_ORDER, formatRelative, initials } from "@/lib/format";
import { sampleCandidates, sampleJobs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GitCompareArrows,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { list: candidates, replaceAll: replaceCandidates } = useCandidates();
  const { list: jobs, replaceAll: replaceJobs } = useJobs();
  const { list: matches } = useMatches();

  const empty = candidates.length === 0 && jobs.length === 0;

  const stats = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<typeof STATUS_ORDER[number], number>;
    for (const c of candidates) byStatus[c.status]++;
    return {
      total: candidates.length,
      analyzed: candidates.filter((c) => c.analysis).length,
      starred: candidates.filter((c) => c.starred).length,
      byStatus,
      openJobs: jobs.filter((j) => j.status === "open").length,
    };
  }, [candidates, jobs]);

  const recent = candidates.slice(0, 5);
  const topMatches = useMemo(
    () =>
      matches
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((m) => ({
          ...m,
          candidate: candidates.find((c) => c.id === m.candidateId),
          job: jobs.find((j) => j.id === m.jobId),
        }))
        .filter((m) => m.candidate && m.job),
    [matches, candidates, jobs]
  );

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot of your hiring pipeline. Powered by Claude Sonnet 4.6.
          </p>
        </div>

        {empty ? (
          <EmptyHero
            onLoad={() => {
              replaceCandidates(sampleCandidates());
              replaceJobs(sampleJobs());
            }}
          />
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Candidates"    value={stats.total}    icon={<Users className="h-4 w-4" />}     accent="text-indigo-600 bg-indigo-50" />
              <Kpi label="Analyzed"      value={stats.analyzed} icon={<Sparkles className="h-4 w-4" />}   accent="text-violet-600 bg-violet-50" />
              <Kpi label="Open jobs"     value={stats.openJobs} icon={<Briefcase className="h-4 w-4" />}  accent="text-emerald-600 bg-emerald-50" />
              <Kpi label="Match scores"  value={matches.length} icon={<GitCompareArrows className="h-4 w-4" />} accent="text-amber-600 bg-amber-50" />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pipeline by status */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pipeline by stage</span>
                    <Link href="/candidates" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STATUS_ORDER.map((s) => {
                    const n = stats.byStatus[s];
                    const pct = stats.total === 0 ? 0 : Math.round((n / stats.total) * 100);
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-28 shrink-0">
                          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
                          <span className="text-xs font-medium">{STATUS_LABEL[s]}</span>
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full", STATUS_DOT[s])} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-16 text-right text-xs font-mono text-muted-foreground">
                          {n} · {pct}%
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ActionRow href="/candidates" icon={<Users className="h-4 w-4" />}
                    title="Manage candidates" subtitle={`${stats.total} on file`} />
                  <ActionRow href="/jobs" icon={<Briefcase className="h-4 w-4" />}
                    title="Job descriptions" subtitle={`${stats.openJobs} open`} />
                  <ActionRow href="/match" icon={<Sparkles className="h-4 w-4" />}
                    title="Match candidates to a job" subtitle="AI-ranked fit" />
                  <ActionRow href="/compare" icon={<GitCompareArrows className="h-4 w-4" />}
                    title="Compare candidates" subtitle="Side-by-side" />
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent candidates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent candidates</span>
                    <Link href="/candidates" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {recent.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      No candidates yet.
                    </div>
                  ) : (
                    <ul>
                      {recent.map((c) => (
                        <li key={c.id} className="border-t border-border first:border-t-0">
                          <Link href={`/candidates/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                              {initials(c.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{c.name}</span>
                                {c.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {c.title} · {c.location ?? "—"}
                              </div>
                            </div>
                            <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border", STATUS_COLOR[c.status])}>
                              {STATUS_LABEL[c.status]}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono w-14 text-right">
                              {formatRelative(c.updatedAt)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Top matches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Top AI matches</span>
                    <Link href="/match" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      Run match <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {topMatches.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-6 px-4">
                      Run a match in <Link href="/match" className="underline">/match</Link> to see ranked fit.
                    </div>
                  ) : (
                    <ul>
                      {topMatches.map((m, i) => (
                        <li key={i} className="border-t border-border first:border-t-0 px-4 py-3 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 text-right shrink-0">
                              <div className={cn(
                                "text-lg font-bold font-mono",
                                m.score >= 80 ? "text-emerald-600" : m.score >= 60 ? "text-amber-600" : "text-rose-600"
                              )}>
                                {m.score}
                              </div>
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">fit</div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {m.candidate!.name} <span className="text-muted-foreground">→</span> {m.job!.title}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {m.rationale}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({
  label, value, icon, accent,
}: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold font-mono">{value}</div>
        </div>
        <div className={cn("rounded-md p-2", accent)}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function ActionRow({
  href, icon, title, subtitle,
}: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 rounded-md border border-border p-2.5 hover:bg-muted/40 transition-colors group">
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

function EmptyHero({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-indigo-50 via-card to-violet-50 p-8 sm:p-12 text-center relative overflow-hidden">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-200 blur-3xl opacity-50" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-200 blur-3xl opacity-50" />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
          <Sparkles className="h-3 w-3 text-violet-500" />
          AI-native ATS · powered by Claude
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Turn CVs into <span className="text-indigo-600">structured signal.</span>
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground">
          Paste a CV and get a recruiter-grade analysis in seconds. Build a candidate library,
          score against your job descriptions, and run side-by-side comparisons — all in your
          browser, no backend required.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onLoad} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Load demo candidates &amp; jobs
          </Button>
          <Link href="/candidates?new=1">
            <Button variant="outline" size="lg" className="gap-2">
              <Users className="h-4 w-4" />
              Add your first candidate
            </Button>
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          <Feature icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            title="Streaming analysis"
            body="Claude streams strengths, gaps, suggested roles, and interview questions live." />
          <Feature icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
            title="Scorecards & radar"
            body="6-axis radar chart with per-candidate fit and highlights." />
          <Feature icon={<GitCompareArrows className="h-4 w-4 text-violet-600" />}
            title="JD matching"
            body="Rank candidates against any role with explainable scores." />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
