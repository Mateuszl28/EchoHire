"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCandidates, newId } from "@/lib/storage";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_DOT,
  STATUS_ORDER,
  formatRelative,
  initials,
} from "@/lib/format";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Filter,
  PlusCircle,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";

export default function CandidatesPage() {
  const { list, add, remove, update } = useCandidates();
  const router = useRouter();
  const sp = useSearchParams();
  const startWithNew = sp.get("new") === "1";
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (startWithNew) setShowNew(true);
  }, [startWithNew]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.name, c.title, c.location ?? "", c.email ?? "", ...c.tags]
        .join(" ").toLowerCase().includes(q);
    });
  }, [list, search, statusFilter]);

  const onCreate = (draft: { name: string; title: string; cv: string }) => {
    const c: Candidate = {
      id: newId("cnd"),
      name: draft.name.trim() || "Unnamed candidate",
      title: draft.title.trim() || "Candidate",
      status: "sourced",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cv: draft.cv,
      tags: [],
    };
    add(c);
    setShowNew(false);
    router.push(`/candidates/${c.id}`);
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
            <p className="text-sm text-muted-foreground">
              {list.length} on file — searchable, filterable, all stored locally.
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <PlusCircle className="h-4 w-4" />
            New candidate
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, title, location, tag…"
                  className="w-full h-9 pl-8 pr-3 rounded-md bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {(["all", ...STATUS_ORDER] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as typeof statusFilter)}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                      statusFilter === s
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s === "all" ? `all (${list.length})` : `${STATUS_LABEL[s as CandidateStatus]} (${list.filter((c) => c.status === s).length})`}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Title</th>
                    <th className="text-left px-3 py-2 font-medium">Location</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Tags</th>
                    <th className="text-left px-3 py-2 font-medium">Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/40 group">
                      <td className="px-3 py-2">
                        <Link href={`/candidates/${c.id}`} className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {c.name}
                              {c.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {c.email ?? "—"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{c.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.location ?? "—"}</td>
                      <td className="px-3 py-2">
                        <select
                          value={c.status}
                          onChange={(e) => update(c.id, { status: e.target.value as CandidateStatus })}
                          className={cn(
                            "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-transparent cursor-pointer",
                            STATUS_COLOR[c.status]
                          )}
                        >
                          {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs font-mono">
                        {formatRelative(c.updatedAt)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => update(c.id, { starred: !c.starred })}
                            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
                            title={c.starred ? "Unstar" : "Star"}
                          >
                            <Star className={cn(
                              "h-3.5 w-3.5",
                              c.starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                            )} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${c.name}? This cannot be undone.`)) {
                                remove(c.id);
                              }
                            }}
                            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                          <Link href={`/candidates/${c.id}`}
                            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
                            title="Open">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center">
                        {list.length === 0 ? (
                          <div className="space-y-2">
                            <Users className="h-6 w-6 mx-auto text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">No candidates yet.</div>
                            <Button size="sm" onClick={() => setShowNew(true)}>
                              <PlusCircle className="h-3.5 w-3.5" />
                              Add the first one
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No candidates match the current filters.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {showNew && <NewCandidateDialog onCancel={() => setShowNew(false)} onCreate={onCreate} />}
    </AppShell>
  );
}

function NewCandidateDialog({
  onCancel, onCreate,
}: { onCancel: () => void; onCreate: (d: { name: string; title: string; cv: string }) => void }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [cv, setCv] = useState("");

  const canCreate = name.trim() && cv.trim().length >= 50;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold">Add new candidate</div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ava Rosenberg"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </Field>
            <Field label="Current title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Software Engineer"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </Field>
          </div>
          <Field label={`CV text (${cv.length} chars · 50+ required)`}>
            <Textarea
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder="Paste the CV here…"
              className="min-h-[200px] font-mono text-xs"
            />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onCreate({ name, title, cv })} disabled={!canCreate}>
            <PlusCircle className="h-3.5 w-3.5" />
            Save candidate
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
