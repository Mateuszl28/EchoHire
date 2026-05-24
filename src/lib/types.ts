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
