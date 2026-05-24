"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useCandidates, useJobs } from "@/lib/storage";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_DOT,
  STATUS_ORDER,
  formatRelative,
  initials,
} from "@/lib/format";
import { logActivity } from "@/lib/activity";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Briefcase, GripVertical, Star, ChevronRight } from "lucide-react";

export default function PipelinePage() {
  const { list, update } = useCandidates();
  const { list: jobs } = useJobs();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverStatus, setHoverStatus] = useState<CandidateStatus | null>(null);

  const byStatus = useMemo(() => {
    const groups: Record<CandidateStatus, Candidate[]> = {
      sourced: [], screening: [], interview: [], offer: [], hired: [], rejected: [],
    };
    for (const c of list) groups[c.status].push(c);
    return groups;
  }, [list]);

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: React.DragEvent, status: CandidateStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    setHoverStatus(null);
    if (!id) return;
    const c = list.find((x) => x.id === id);
    if (!c || c.status === status) return;
    const next = logActivity(
      { ...c, status },
      "status-changed",
      `Moved from ${STATUS_LABEL[c.status]} → ${STATUS_LABEL[status]}`,
      undefined,
      { from: c.status, to: status }
    );
    update(id, next);
  };

  if (list.length === 0) {
    return (
      <AppShell>
        <div className="p-8 max-w-2xl mx-auto text-center space-y-3">
          <h1 className="text-xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            No candidates yet. Drop in a CV on the candidates page (or load the demo set from the dashboard).
          </p>
          <Link href="/candidates" className="text-sm underline">Open candidates</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-[1500px] mx-auto h-full flex flex-col">
        <header className="shrink-0 mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Drag candidates between columns. Open <span className="font-mono">{jobs.length}</span> jobs · <span className="font-mono">{list.length}</span> candidates total.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 flex-1 min-h-0">
          {STATUS_ORDER.map((status) => {
            const cards = byStatus[status];
            const isHover = hoverStatus === status && dragId !== null;
            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setHoverStatus(status); }}
                onDragLeave={() => setHoverStatus(null)}
                onDrop={(e) => onDrop(e, status)}
                className={cn(
                  "rounded-lg border bg-card/70 backdrop-blur flex flex-col min-h-0 transition-colors",
                  isHover ? "border-indigo-500/60 bg-indigo-50/40" : "border-border"
                )}
              >
                <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                    {cards.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.length === 0 ? (
                    <div className="text-center text-[11px] text-muted-foreground py-6">
                      Drop here
                    </div>
                  ) : (
                    cards.map((c) => (
                      <article
                        key={c.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, c.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          "group rounded-md border border-border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-indigo-300",
                          dragId === c.id && "opacity-40 rotate-1"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground transition-colors" />
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/candidates/${c.id}`}
                                className="text-sm font-medium truncate hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.name}
                              </Link>
                              {c.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {c.title}
                            </div>
                          </div>
                        </div>

                        {c.scorecard?.overallFit !== undefined ? (
                          <div className="mt-2 flex items-center gap-2 text-[10px]">
                            <span className={cn(
                              "font-mono font-bold",
                              c.scorecard.overallFit >= 80 ? "text-emerald-600" : c.scorecard.overallFit >= 60 ? "text-amber-600" : "text-rose-600"
                            )}>
                              {c.scorecard.overallFit}
                            </span>
                            <span className="text-muted-foreground uppercase tracking-widest">fit</span>
                            <span className="text-border">·</span>
                            <span className="text-muted-foreground">
                              {c.scorecard.yearsExperience}y exp
                            </span>
                          </div>
                        ) : c.analysis ? (
                          <div className="mt-2 text-[10px] text-muted-foreground italic">
                            analyzed · no scorecard yet
                          </div>
                        ) : null}

                        {c.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted border border-border">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono">
                          <span>{formatRelative(c.updatedAt)}</span>
                          <Link
                            href={`/candidates/${c.id}`}
                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-0.5 hover:text-foreground transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            open
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="mt-3 text-[10px] text-muted-foreground font-mono shrink-0">
          <Briefcase className="h-3 w-3 inline mr-1" />
          Drag-and-drop edits the candidate's status. All changes saved locally.
        </footer>
      </div>
    </AppShell>
  );
}
