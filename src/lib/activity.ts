import { newId } from "./storage";
import type { ActivityEntry, ActivityKind, Candidate } from "./types";

export function logActivity(
  candidate: Candidate,
  kind: ActivityKind,
  message: string,
  detail?: string,
  meta?: Record<string, string | number>
): Candidate {
  const entry: ActivityEntry = {
    id: newId("act"),
    kind,
    message,
    detail,
    meta,
    createdAt: Date.now(),
  };
  return {
    ...candidate,
    activity: [entry, ...(candidate.activity ?? [])].slice(0, 200),
    updatedAt: Date.now(),
  };
}
