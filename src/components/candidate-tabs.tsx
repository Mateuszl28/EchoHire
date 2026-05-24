"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { useCandidates, useJobs, newId } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import type {
  ActivityKind,
  Candidate,
  DraftEmail,
  InterviewKit,
  InterviewQuestion,
  Note,
} from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Copy,
  Loader2,
  Mail,
  MessageSquarePlus,
  Send,
  Sparkles,
  Star,
  Trash2,
  Activity as ActivityIcon,
  CheckCircle2,
  ClipboardCheck,
  FilePlus,
  HelpCircle,
} from "lucide-react";

type Tab = "analysis" | "interview" | "notes" | "email";

export function CandidateTabs({
  candidate,
  defaultTab = "analysis",
  analysisSlot,
}: {
  candidate: Candidate;
  defaultTab?: Tab;
  analysisSlot: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-border bg-muted/20">
        <TabBtn label="Analysis"   icon={<Sparkles className="h-3.5 w-3.5" />}        active={tab === "analysis"}  onClick={() => setTab("analysis")} />
        <TabBtn label="Interview"  icon={<ClipboardCheck className="h-3.5 w-3.5" />}  active={tab === "interview"} onClick={() => setTab("interview")} />
        <TabBtn label="Notes"      icon={<MessageSquarePlus className="h-3.5 w-3.5" />} active={tab === "notes"}     onClick={() => setTab("notes")} />
        <TabBtn label="Email"      icon={<Mail className="h-3.5 w-3.5" />}            active={tab === "email"}     onClick={() => setTab("email")} />
      </div>
      <div>
        {tab === "analysis"  && analysisSlot}
        {tab === "interview" && <InterviewPanel candidate={candidate} />}
        {tab === "notes"     && <NotesPanel candidate={candidate} />}
        {tab === "email"     && <EmailPanel candidate={candidate} />}
      </div>
    </Card>
  );
}

function TabBtn({
  label, icon, active, onClick,
}: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Interview prep panel ──────────────────────────────────────────────────

function InterviewPanel({ candidate }: { candidate: Candidate }) {
  const { update } = useCandidates();
  const { list: jobs } = useJobs();
  const [jobId, setJobId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | "mock-fallback" | null>(null);
  const [kit, setKit] = useState<InterviewKit | null>(() => {
    return candidate.interviewKits?.[0] ?? null;
  });

  const job = jobs.find((j) => j.id === jobId);

  const generate = async () => {
    setRunning(true);
    setError(null);
    setMode(null);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidate.name,
          cv: candidate.cv,
          jobTitle: job?.title ?? candidate.title,
          jobDescription: job?.description ?? "",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMode((res.headers.get("x-echohire-mode") as typeof mode) ?? "live");
      const data = (await res.json()) as { rubric: string[]; questions: InterviewQuestion[] };
      const newKit: InterviewKit = {
        id: newId("kit"),
        jobId: job?.id ?? "",
        jobTitle: job?.title ?? candidate.title,
        rubric: data.rubric,
        questions: data.questions,
        createdAt: Date.now(),
      };
      setKit(newKit);
      const updated = logActivity(
        { ...candidate, interviewKits: [newKit, ...(candidate.interviewKits ?? [])].slice(0, 6) },
        "interview-prepped",
        `Generated interview kit for ${newKit.jobTitle}`,
        undefined,
        { jobTitle: newKit.jobTitle }
      );
      update(candidate.id, updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const copy = () => {
    if (!kit) return;
    const text = renderKitAsMarkdown(kit);
    navigator.clipboard?.writeText(text);
  };

  return (
    <CardContent className="p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Target role (optional — sharpens questions)
          </div>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Use the candidate's current title</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {mode && (
            <span className={cn(
              "text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border",
              mode === "live" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"
            )}>
              {mode}
            </span>
          )}
          {kit && (
            <Button variant="ghost" size="sm" onClick={copy} title="Copy kit as markdown">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button onClick={generate} disabled={running}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {kit ? "Regenerate" : "Generate kit"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!kit && !running && !error && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <HelpCircle className="h-5 w-5 mx-auto mb-2" />
          Generate a tailored interview kit — rubric + 8-10 questions with probes &amp; signal.
        </div>
      )}

      {kit && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Rubric — score the candidate on
            </h3>
            <ul className="space-y-1">
              {kit.rubric.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Questions ({kit.questions.length})
            </h3>
            <ol className="space-y-3">
              {kit.questions.map((q, i) => (
                <li key={i} className="rounded-md border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {q.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Q{i + 1}</span>
                  </div>
                  <p className="text-sm font-medium">{q.question}</p>
                  {q.probes?.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {q.probes.map((p, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-muted-foreground/50">↳</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.signal && (
                    <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                      <strong>Signal:</strong> {q.signal}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="text-[10px] text-muted-foreground font-mono">
            Generated for <strong className="text-foreground">{kit.jobTitle}</strong> · {formatRelative(kit.createdAt)}
          </div>
        </div>
      )}
    </CardContent>
  );
}

function renderKitAsMarkdown(kit: InterviewKit): string {
  return [
    `# Interview kit — ${kit.jobTitle}`,
    ``,
    `## Rubric`,
    ...kit.rubric.map((r) => `- ${r}`),
    ``,
    `## Questions`,
    ...kit.questions.map((q, i) =>
      [
        `### Q${i + 1} (${q.category})`,
        q.question,
        ``,
        ...(q.probes?.length ? [`**Probes:**`, ...q.probes.map((p) => `- ${p}`), ``] : []),
        q.signal ? `**Signal:** ${q.signal}\n` : "",
      ].join("\n")
    ),
  ].join("\n");
}

// ─── Notes & activity panel ────────────────────────────────────────────────

function NotesPanel({ candidate }: { candidate: Candidate }) {
  const { update } = useCandidates();
  const [draft, setDraft] = useState("");

  const notes = candidate.notes ?? [];
  const activity = candidate.activity ?? [];

  const addNote = () => {
    const body = draft.trim();
    if (!body) return;
    const n: Note = { id: newId("note"), body, author: "MC", createdAt: Date.now() };
    const next: Candidate = {
      ...candidate,
      notes: [n, ...(candidate.notes ?? [])],
    };
    const withActivity = logActivity(
      next,
      "note-added",
      `Added a note (${body.split(/\s+/).length} words)`,
      body.slice(0, 200)
    );
    update(candidate.id, withActivity);
    setDraft("");
  };

  const remove = (id: string) => {
    update(candidate.id, {
      notes: (candidate.notes ?? []).filter((n) => n.id !== id),
    });
  };

  return (
    <CardContent className="p-4 space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a recruiter note — what came up in the screen, follow-ups, vibes…"
          className="min-h-[80px] text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"} · {activity.length} {activity.length === 1 ? "event" : "events"}
          </div>
          <Button size="sm" onClick={addNote} disabled={!draft.trim()}>
            <FilePlus className="h-3.5 w-3.5" />
            Add note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Notes</h3>
          {notes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-md">
              No notes yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-3 group relative">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                    <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white">
                      {n.author}
                    </span>
                    <span>{n.author}</span>
                    <span>·</span>
                    <span>{formatRelative(n.createdAt)}</span>
                  </div>
                  <Markdown content={n.body} />
                  <button
                    onClick={() => remove(n.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <ActivityIcon className="h-3 w-3" />
            Activity
          </h3>
          {activity.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-md">
              No activity yet.
            </div>
          ) : (
            <ol className="relative pl-5">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
              {activity.map((a) => (
                <li key={a.id} className="relative pb-3">
                  <span className={cn(
                    "absolute -left-3.5 top-1 h-3 w-3 rounded-full border-2 border-card",
                    ACTIVITY_DOT[a.kind] ?? "bg-foreground"
                  )} />
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{formatRelative(a.createdAt)}</span>
                    <span className="text-[9px] uppercase tracking-widest">{a.kind.replace("-", " ")}</span>
                  </div>
                  <div className="text-sm">{a.message}</div>
                  {a.detail && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{a.detail}</div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </CardContent>
  );
}

const ACTIVITY_DOT: Record<ActivityKind, string> = {
  created: "bg-slate-500",
  "status-changed": "bg-indigo-500",
  analyzed: "bg-violet-500",
  matched: "bg-emerald-500",
  "note-added": "bg-amber-500",
  "interview-prepped": "bg-sky-500",
  "email-drafted": "bg-rose-500",
  starred: "bg-yellow-500",
  unstarred: "bg-slate-400",
};

// ─── Email composer panel ───────────────────────────────────────────────────

const INTENTS: { id: DraftEmail["intent"]; label: string }[] = [
  { id: "first-outreach", label: "First outreach" },
  { id: "interview-invite", label: "Interview invite" },
  { id: "rejection-warm", label: "Warm rejection" },
  { id: "offer", label: "Offer" },
];

function EmailPanel({ candidate }: { candidate: Candidate }) {
  const { update } = useCandidates();
  const { list: jobs } = useJobs();
  const [intent, setIntent] = useState<DraftEmail["intent"]>("first-outreach");
  const [jobId, setJobId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | "mock-fallback" | null>(null);

  const job = jobs.find((j) => j.id === jobId);

  const draft = async () => {
    setRunning(true);
    setError(null);
    setMode(null);
    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidate.name,
          cv: candidate.cv,
          jobTitle: job?.title ?? candidate.title,
          intent,
          recruiterName: "Mateusz",
          company: "EchoHire",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMode((res.headers.get("x-echohire-mode") as typeof mode) ?? "live");
      const d = (await res.json()) as { subject: string; body: string };
      setSubject(d.subject);
      setBody(d.body);

      const saved: DraftEmail = {
        id: newId("eml"),
        subject: d.subject,
        body: d.body,
        intent,
        createdAt: Date.now(),
      };
      const next = logActivity(
        { ...candidate, draftEmails: [saved, ...(candidate.draftEmails ?? [])].slice(0, 12) },
        "email-drafted",
        `Drafted ${INTENTS.find((x) => x.id === intent)?.label.toLowerCase() ?? intent}`,
        d.subject
      );
      update(candidate.id, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const copyAll = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard?.writeText(text);
  };
  const openMailto = () => {
    if (!candidate.email) return;
    const href = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(href, "_self");
  };

  return (
    <CardContent className="p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Intent</div>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as DraftEmail["intent"])}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {INTENTS.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Role (optional)</div>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Candidate's current title</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {mode && (
            <span className={cn(
              "text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border",
              mode === "live" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"
            )}>
              {mode}
            </span>
          )}
          <Button onClick={draft} disabled={running}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Draft with AI
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(subject || body) && (
        <>
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Subject</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Body</div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[260px] text-sm whitespace-pre-wrap"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={copyAll}>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            {candidate.email && (
              <Button size="sm" onClick={openMailto}>
                <Send className="h-3.5 w-3.5" />
                Send via mailto
              </Button>
            )}
          </div>
        </>
      )}

      {!subject && !body && !running && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Pick an intent and click <strong>Draft with AI</strong>. The draft references concrete details from the CV.
        </div>
      )}
    </CardContent>
  );
}
