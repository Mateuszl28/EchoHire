export type CandidateStatus =
  | "sourced"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface Candidate {
  id: string;
  name: string;
  title: string;          // current title (extracted/fallback)
  location?: string;
  email?: string;
  status: CandidateStatus;
  createdAt: number;
  updatedAt: number;
  cv: string;             // raw text
  analysis?: string;      // markdown from Claude
  scorecard?: Scorecard;
  tags: string[];
  starred?: boolean;
  notes?: Note[];
  activity?: ActivityEntry[];
  interviewKits?: InterviewKit[]; // generated per candidate-job pair
  draftEmails?: DraftEmail[];
}

export interface Note {
  id: string;
  body: string;           // plain text / markdown
  author: string;         // e.g. "MC"
  createdAt: number;
}

export type ActivityKind =
  | "created"
  | "status-changed"
  | "analyzed"
  | "matched"
  | "note-added"
  | "interview-prepped"
  | "email-drafted"
  | "starred"
  | "unstarred";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  message: string;        // short summary
  detail?: string;        // optional longer body
  createdAt: number;
  meta?: Record<string, string | number>;
}

export interface InterviewKit {
  id: string;
  jobId: string;          // empty if generic
  jobTitle: string;
  rubric: string[];       // 4-6 bullet criteria to score on
  questions: InterviewQuestion[];
  createdAt: number;
}

export interface InterviewQuestion {
  category: "technical" | "behavioral" | "domain" | "leadership" | "verification";
  question: string;
  probes: string[];       // follow-up prompts
  signal: string;         // what a good answer looks like
}

export interface DraftEmail {
  id: string;
  subject: string;
  body: string;
  intent: "first-outreach" | "interview-invite" | "rejection-warm" | "offer";
  createdAt: number;
}

export interface Scorecard {
  yearsExperience: number;
  overallFit: number;     // 0-100
  axes: ScorecardAxis[];  // 6 radar axes
  highlights: string[];
}

export interface ScorecardAxis {
  label: string;
  value: number;          // 0-100
}

export interface Job {
  id: string;
  title: string;
  team: string;
  location: string;
  seniority: "junior" | "mid" | "senior" | "staff" | "principal";
  status: "open" | "draft" | "closed";
  description: string;    // raw text JD
  mustHave: string[];
  niceToHave: string[];
  createdAt: number;
  applicants: number;
}

export interface MatchResult {
  jobId: string;
  candidateId: string;
  score: number;          // 0-100 overall fit
  matchedSkills: string[];
  gaps: string[];
  rationale: string;      // 2-3 sentence
  computedAt: number;
}
