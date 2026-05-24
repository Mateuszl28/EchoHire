import type { CandidateStatus } from "./types";

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  sourced: "Sourced",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const STATUS_COLOR: Record<CandidateStatus, string> = {
  sourced:   "bg-slate-100 text-slate-700 border-slate-200",
  screening: "bg-sky-50 text-sky-700 border-sky-200",
  interview: "bg-violet-50 text-violet-700 border-violet-200",
  offer:     "bg-amber-50 text-amber-800 border-amber-200",
  hired:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:  "bg-rose-50 text-rose-700 border-rose-200",
};

export const STATUS_DOT: Record<CandidateStatus, string> = {
  sourced:   "bg-slate-400",
  screening: "bg-sky-500",
  interview: "bg-violet-500",
  offer:     "bg-amber-500",
  hired:     "bg-emerald-500",
  rejected:  "bg-rose-500",
};

export const STATUS_ORDER: CandidateStatus[] = [
  "sourced", "screening", "interview", "offer", "hired", "rejected",
];
