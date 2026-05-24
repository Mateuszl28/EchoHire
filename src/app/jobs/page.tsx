"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJobs, newId } from "@/lib/storage";
import { sampleJobs } from "@/lib/mock-data";
import type { Job } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  Globe2,
  PlusCircle,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

const SEN_LABEL: Record<Job["seniority"], string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
  principal: "Principal",
};

const SEN_COLOR: Record<Job["seniority"], string> = {
  junior: "bg-sky-50 text-sky-700 border-sky-200",
  mid: "bg-indigo-50 text-indigo-700 border-indigo-200",
  senior: "bg-violet-50 text-violet-700 border-violet-200",
  staff: "bg-amber-50 text-amber-800 border-amber-200",
  principal: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function JobsPage() {
  const { list, add, remove, replaceAll } = useJobs();
  const [showNew, setShowNew] = useState(false);

  const onCreate = (j: Partial<Job>) => {
    const job: Job = {
      id: newId("job"),
      title: j.title?.trim() || "Untitled role",
      team: j.team?.trim() || "—",
      location: j.location?.trim() || "Remote",
      seniority: (j.seniority ?? "mid") as Job["seniority"],
      status: "open",
      description: j.description ?? "",
      mustHave: (j.mustHave ?? []) as string[],
      niceToHave: (j.niceToHave ?? []) as string[],
      createdAt: Date.now(),
      applicants: 0,
    };
    add(job);
    setShowNew(false);
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job descriptions</h1>
            <p className="text-sm text-muted-foreground">
              The roles you're hiring for. Match candidates against any of them.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {list.length === 0 && (
              <Button variant="outline" onClick={() => replaceAll(sampleJobs())}>
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Load samples
              </Button>
            )}
            <Button onClick={() => setShowNew(true)}>
              <PlusCircle className="h-4 w-4" />
              New role
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 space-y-2">
              <Briefcase className="h-7 w-7 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No jobs yet.</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Create a role, or load the demo set to try matching with the sample candidates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map((j) => (
              <Card key={j.id} className="h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                          SEN_COLOR[j.seniority]
                        )}>
                          {SEN_LABEL[j.seniority]}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {j.status}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold leading-snug">{j.title}</h3>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {j.team} · <Globe2 className="h-3 w-3 inline -mt-0.5" /> {j.location}
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm("Delete this role?")) remove(j.id); }}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 hover:text-destructive" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground line-clamp-3">
                    {j.description}
                  </p>

                  <div className="mt-3 space-y-1.5 flex-1">
                    {j.mustHave.length > 0 && (
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Must have</div>
                        <div className="flex flex-wrap gap-1">
                          {j.mustHave.slice(0, 5).map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {j.applicants} applicants
                    </span>
                    <span>created {formatRelative(j.createdAt)}</span>
                  </div>

                  <Link
                    href={`/match?job=${j.id}`}
                    className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="h-3 w-3" />
                    Match candidates
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>

      {showNew && <NewJobDialog onCancel={() => setShowNew(false)} onCreate={onCreate} />}
    </AppShell>
  );
}

function NewJobDialog({
  onCancel, onCreate,
}: { onCancel: () => void; onCreate: (j: Partial<Job>) => void }) {
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [location, setLocation] = useState("Remote");
  const [seniority, setSeniority] = useState<Job["seniority"]>("mid");
  const [desc, setDesc] = useState("");
  const [mustHave, setMustHave] = useState("");
  const [niceToHave, setNiceToHave] = useState("");

  const canCreate = title.trim().length > 2 && desc.trim().length > 20;

  const splitLines = (s: string) =>
    s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold">New role</div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Backend Engineer"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </Field>
            <Field label="Team">
              <input value={team} onChange={(e) => setTeam(e.target.value)}
                placeholder="Platform"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </Field>
            <Field label="Location">
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </Field>
            <Field label="Seniority">
              <select value={seniority} onChange={(e) => setSeniority(e.target.value as Job["seniority"])}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                {(["junior", "mid", "senior", "staff", "principal"] as const).map((s) => (
                  <option key={s} value={s}>{SEN_LABEL[s]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the role, the team, and what success looks like…"
              className="min-h-[120px] text-sm" />
          </Field>
          <Field label="Must-have (one per line or comma-separated)">
            <Textarea value={mustHave} onChange={(e) => setMustHave(e.target.value)}
              placeholder="5+ years backend, Kafka or Flink in production, ..."
              className="min-h-[60px] text-sm" />
          </Field>
          <Field label="Nice-to-have">
            <Textarea value={niceToHave} onChange={(e) => setNiceToHave(e.target.value)}
              className="min-h-[60px] text-sm" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20 shrink-0">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => onCreate({
              title, team, location, seniority, description: desc,
              mustHave: splitLines(mustHave),
              niceToHave: splitLines(niceToHave),
            })}
            disabled={!canCreate}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Save role
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
