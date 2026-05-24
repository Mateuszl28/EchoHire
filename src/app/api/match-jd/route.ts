import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface CandidateInput {
  id: string;
  name: string;
  cv: string;
}
interface JobInput {
  id: string;
  title: string;
  description: string;
  mustHave?: string[];
  niceToHave?: string[];
}
interface MatchOut {
  candidateId: string;
  score: number;
  matchedSkills: string[];
  gaps: string[];
  rationale: string;
}

const SYSTEM_PROMPT = `You are EchoHire's matching engine. Given a job description and a list of candidate CVs, you score each candidate's fit on a 0-100 scale.

You MUST respond with valid JSON only — no markdown fence, no commentary — in this exact shape:
{
  "matches": [
    {
      "candidateId": "<the id passed in>",
      "score": <integer 0-100>,
      "matchedSkills": ["..."],   // up to 6 strings, drawn from the CV
      "gaps": ["..."],             // up to 4 strings, things the JD wants that are absent or weak
      "rationale": "<2-3 sentences, plain English>"
    }
  ]
}

Scoring guide:
- 90-100: rare excellent fit; strong evidence on every must-have plus most nice-to-haves
- 75-89: strong fit; covers all must-haves
- 60-74: decent fit; some must-haves missing
- 40-59: stretch; significant gaps
- <40: poor fit

Be rigorous. Reference specific evidence (job titles, durations, projects) in rationale.`;

function buildMockMatches(job: JobInput, candidates: CandidateInput[]): MatchOut[] {
  return candidates.map((c) => {
    const cvLc = c.cv.toLowerCase();
    const jdLc = (job.description + " " + (job.mustHave ?? []).join(" ") + " " + (job.niceToHave ?? []).join(" ")).toLowerCase();

    // pull keyword-like tokens from JD
    const tokens = Array.from(new Set(jdLc.match(/\b[a-z][a-z0-9+\-/.]{2,}\b/g) ?? []))
      .filter((t) => !STOP.has(t))
      .filter((t) => t.length >= 3);

    const hits = tokens.filter((t) => cvLc.includes(t));
    const mustHits = (job.mustHave ?? []).filter((m) => cvLc.includes(m.toLowerCase().split(/[\s+]/)[0] || ""));
    const niceHits = (job.niceToHave ?? []).filter((m) => cvLc.includes(m.toLowerCase().split(/[\s+]/)[0] || ""));

    const ratio = tokens.length === 0 ? 0.5 : hits.length / tokens.length;
    let score = Math.round(40 + ratio * 50 + mustHits.length * 3 + niceHits.length * 1.5);
    score = Math.max(15, Math.min(98, score));

    const matched = Array.from(new Set([
      ...mustHits,
      ...niceHits,
      ...hits.filter((t) => /(kafka|rust|kubernetes|python|typescript|react|next|graphql|postgres|tensorrt|pytorch|cv|ml|fintech|leader|manage|hir|on-call|senior|staff)/.test(t)).slice(0, 6),
    ])).slice(0, 6);

    const gaps = (job.mustHave ?? [])
      .filter((m) => !mustHits.includes(m))
      .slice(0, 4);

    const yearsM = c.cv.match(/(\d{1,2})\s*\+?\s*years/i);
    const years = yearsM ? Number(yearsM[1]) : 0;

    const rationale =
      score >= 80
        ? `${c.name} is a strong fit for ${job.title}. The CV directly evidences ${matched.slice(0, 3).join(", ")}, and the trajectory (~${years}y) matches the level. Worth fast-tracking.`
        : score >= 60
        ? `${c.name} is a reasonable fit for ${job.title}. The match is solid on ${matched.slice(0, 2).join(", ")}, but worth probing ${gaps[0] ?? "the must-haves"} in screening.`
        : `${c.name} is a stretch fit for ${job.title}. Some adjacent experience, but key must-haves like ${gaps.slice(0, 2).join(", ") || "the core skills"} aren't well represented in the CV.`;

    return {
      candidateId: c.id,
      score,
      matchedSkills: matched,
      gaps,
      rationale,
    };
  }).sort((a, b) => b.score - a.score);
}

const STOP = new Set([
  "the","and","you","for","with","this","that","are","our","will","have","has","from","into","onto","not",
  "but","all","any","can","get","one","its","out","new","use","via","per","off","two","etc","www",
]);

export async function POST(req: Request) {
  let job: JobInput;
  let candidates: CandidateInput[];
  try {
    const body = await req.json() as { job?: JobInput; candidates?: CandidateInput[] };
    if (!body.job || !body.candidates || !Array.isArray(body.candidates) || body.candidates.length === 0) {
      return NextResponse.json({ error: "Missing 'job' or 'candidates'." }, { status: 400 });
    }
    job = body.job;
    candidates = body.candidates.slice(0, 12); // cap
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true" || !apiKey;

  if (useMock) {
    // mimic latency
    await new Promise((r) => setTimeout(r, 600 + candidates.length * 120));
    return NextResponse.json(
      { matches: buildMockMatches(job, candidates) },
      { headers: { "x-echohire-mode": "mock" } }
    );
  }

  const client = new Anthropic({ apiKey });

  const userBody = `JOB
Title: ${job.title}
${job.mustHave?.length ? `Must have:\n- ${job.mustHave.join("\n- ")}\n` : ""}${job.niceToHave?.length ? `Nice to have:\n- ${job.niceToHave.join("\n- ")}\n` : ""}
Description:
${job.description}

CANDIDATES (${candidates.length}):
${candidates.map((c) =>
  `--- id=${c.id} name=${c.name} ---\n${c.cv.slice(0, 6000)}\n--- end ---`
).join("\n\n")}

Return JSON only. One entry per candidate. Order doesn't matter — I'll sort.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userBody }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Try to parse JSON — be lenient with code fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as { matches: MatchOut[] };
    if (!parsed.matches || !Array.isArray(parsed.matches)) {
      throw new Error("Model did not return a 'matches' array.");
    }
    return NextResponse.json(
      { matches: parsed.matches.sort((a, b) => b.score - a.score) },
      { headers: { "x-echohire-mode": "live" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // Fall back to mock so the UI still works on parse failure
    const fallback = buildMockMatches(job, candidates);
    return NextResponse.json(
      { matches: fallback, fallbackReason: msg },
      { headers: { "x-echohire-mode": "mock-fallback" } }
    );
  }
}
