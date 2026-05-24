"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar } from "@/components/radar";
import { useCandidates } from "@/lib/storage";
import { extractScorecard } from "@/lib/scorecard";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  initials,
} from "@/lib/format";
import type { Candidate } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  GitCompareArrows,
  MapPin,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";

const MAX_PICK = 3;

export default function ComparePage() {
  const { list } = useCandidates();
  const [picks, setPicks] = useState<string[]>([]);
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const candidates = picks
    .map((id) => list.find((c) => c.id === id))
    .filter((c): c is Candidate => !!c);

  const scorecards = useMemo(
    () => candidates.map((c) => c.analysis ? extractScorecard(c.analysis) : null),
    [candidates]
  );

  const setSlot = (slot: number, id: string) => {
    const next = [...picks];
    next[slot] = id;
    setPicks(next);
    setPickerFor(null);
  };

  const removeSlot = (slot: number) => {
    setPicks((p) => p.filter((_, i) => i !== slot));
  };

  if (list.length < 2) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto text-center space-y-3">
          <GitCompareArrows className="h-7 w-7 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Compare candidates</h1>
          <p className="text-sm text-muted-foreground">
            You need at least 2 candidates to compare side-by-side.
          </p>
          <Link href="/candidates"><Button>Open candidates</Button></Link>
        </div>
      </AppShell>
    );
  }

  // Highest value per axis for highlight
  const axisLabels = scorecards[0]?.axes.map((a) => a.label) ?? [];
  const bestPerAxis = axisLabels.map((label) => {
    let best = -1;
    let bestIdx = -1;
    scorecards.forEach((sc, idx) => {
      const v = sc?.axes.find((a) => a.label === label)?.value ?? -1;
      if (v > best) {
        best = v;
        bestIdx = idx;
      }
    });
    return bestIdx;
  });

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Compare candidates</h1>
            <p className="text-sm text-muted-foreground">
              Pick up to {MAX_PICK} candidates and stack their scorecards side-by-side.
            </p>
          </div>
          {picks.length > 0 && (
            <Button variant="ghost" onClick={() => setPicks([])}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Slot picker grid */}
        <section className={cn(
          "grid gap-4",
          picks.length === 0 || picks.length === 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"
        )}>
          {Array.from({ length: Math.min(picks.length + 1, MAX_PICK) }).map((_, slot) => {
            const c = candidates[slot];
            const sc = scorecards[slot];
            if (!c) {
              return (
                <button
                  key={`slot-${slot}`}
                  onClick={() => setPickerFor(slot)}
                  className="rounded-xl border-2 border-dashed border-border bg-card hover:bg-muted/40 transition-colors py-12 flex flex-col items-center gap-2 text-sm text-muted-foreground"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add candidate</span>
                </button>
              );
            }
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/candidates/${c.id}`} className="text-base font-semibold truncate hover:underline">
                            {c.name}
                          </Link>
                          {c.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{c.title}</div>
                      </div>
                    </div>
                    <button onClick={() => removeSlot(slot)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className={cn("px-1.5 py-0.5 rounded border", STATUS_COLOR[c.status])}>
                      {STATUS_LABEL[c.status]}
                    </span>
                    {c.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>
                    )}
                  </div>

                  {sc ? (
                    <>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-md border border-border p-2">
                          <div className={cn(
                            "text-2xl font-bold font-mono",
                            sc.overallFit >= 80 ? "text-emerald-600" : sc.overallFit >= 60 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {sc.overallFit}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fit</div>
                        </div>
                        <div className="rounded-md border border-border p-2">
                          <div className="text-2xl font-bold font-mono">{sc.yearsExperience}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Years</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-center">
                        <Radar axes={sc.axes} size={220} color={SLOT_COLORS[slot] ?? "hsl(222 80% 55%)"} />
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      No analysis yet. Open the candidate to run one.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Per-axis table */}
        {candidates.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Per-axis breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium">Axis</th>
                    {candidates.map((c) => (
                      <th key={c.id} className="text-right px-4 py-2 font-medium">{c.name.split(" ")[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {axisLabels.map((label, axisIdx) => (
                    <tr key={label} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{label}</td>
                      {candidates.map((c, slot) => {
                        const v = scorecards[slot]?.axes.find((a) => a.label === label)?.value ?? null;
                        const isBest = bestPerAxis[axisIdx] === slot && v !== null;
                        return (
                          <td key={c.id} className={cn(
                            "px-4 py-2 text-right font-mono",
                            isBest && "text-emerald-600 font-semibold"
                          )}>
                            {v !== null ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                {v}
                                {isBest && <span className="text-[9px] uppercase">best</span>}
                              </span>
                            ) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {pickerFor !== null && (
        <PickerDialog
          candidates={list.filter((c) => !picks.includes(c.id))}
          onCancel={() => setPickerFor(null)}
          onPick={(id) => setSlot(pickerFor, id)}
        />
      )}
    </AppShell>
  );
}

const SLOT_COLORS = ["hsl(222 80% 55%)", "hsl(280 70% 55%)", "hsl(160 70% 45%)"];

function PickerDialog({
  candidates, onCancel, onPick,
}: { candidates: Candidate[]; onCancel: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = candidates.filter((c) =>
    !q || [c.name, c.title, c.location ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold">Pick a candidate</div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 text-left">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{c.title}</div>
              </div>
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">No matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}
