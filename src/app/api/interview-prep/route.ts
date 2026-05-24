import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { InterviewKit, InterviewQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ReqBody {
  candidateName?: string;
  cv?: string;
  jobTitle?: string;
  jobDescription?: string;
}

const SYSTEM_PROMPT = `You are EchoHire's interview prep coach. Given a candidate CV and a target role, you produce a tight, structured interview kit that helps a hiring manager prepare in <5 minutes.

Output JSON only — no markdown fence, no commentary — in this exact shape:
{
  "rubric": ["...", "..."],  // 4-6 short criteria to score the candidate on
  "questions": [
    {
      "category": "technical" | "behavioral" | "domain" | "leadership" | "verification",
      "question": "Sharp, role-specific question.",
      "probes": ["follow-up 1", "follow-up 2"],
      "signal": "What a good answer looks like."
    }
  ]
}

Rules:
- 8-10 questions total, balanced across categories appropriate to the role.
- Tie at least 2 questions to specific items in the CV (use 'verification' category for those).
- 'probes' = 1-3 short follow-ups (≤15 words each).
- 'signal' = 1 sentence describing what a strong answer demonstrates.
- Be specific — no fluffy "Tell me about yourself" templates.`;

function buildMockKit(name: string, jobTitle: string, cv: string): { rubric: string[]; questions: InterviewQuestion[] } {
  const lc = cv.toLowerCase();
  const seniorish = /(senior|staff|principal|lead|architect|manager|director)/.test(lc);
  const ml = /(pytorch|jax|tensorflow|deep|computer vision|ml|machine learning)/.test(lc);
  const mgr = /(manag|led team|hired|coaching|leadership|hire)/.test(lc);
  const distrib = /(kafka|flink|distributed|microservice|kubernetes|throughput)/.test(lc);

  const rubric = [
    seniorish ? "Operates at the level of the role with limited support" : "Strong fundamentals appropriate for the level",
    "Communicates technical tradeoffs clearly",
    distrib ? "Reasons about distributed-system failure modes" : "Reasons about correctness under failure",
    mgr ? "Demonstrates coaching + organizational impact" : "Shows ownership beyond their own tasks",
    "Cites concrete evidence (numbers, names, outcomes) — not generalities",
    ml ? "Has shipped models that work in the real world, not just on benchmarks" : "Has shipped systems that survived contact with real users",
  ];

  const questions: InterviewQuestion[] = [
    {
      category: "technical",
      question: distrib
        ? "Walk through a system you owned end-to-end. What was the failure mode you didn't anticipate, and how did you find it?"
        : "Pick a project from your CV. Walk me through the design and the biggest tradeoff you made.",
      probes: ["What changed on day 2?", "What would you build differently now?"],
      signal: "Specific design tradeoffs, evidence of operating in production, no hand-waving.",
    },
    {
      category: ml ? "domain" : "technical",
      question: ml
        ? "Describe a model that worked offline but underperformed in production. How did you debug the gap?"
        : "Describe a time the data shape changed under you in production. What did you do?",
      probes: ["Metric chosen?", "How long until detection?"],
      signal: ml
        ? "Distribution shift, label drift, eval set mismatch — concrete investigation."
        : "Detection, hypothesis, rollback / forward fix.",
    },
    {
      category: "behavioral",
      question: "Tell me about a decision you made that you later realized was wrong. How did you notice, and what did you do?",
      probes: ["Who flagged it first?", "How did you communicate the reversal?"],
      signal: "Self-awareness, blame-free retrospection, fast correction.",
    },
    {
      category: mgr ? "leadership" : "behavioral",
      question: mgr
        ? "Walk me through coaching a senior engineer who wasn't growing. What did you do over what timeframe?"
        : "Describe pushing back on a decision from a senior person. How did the conversation go?",
      probes: ["What was the smallest thing that mattered most?", "Outcome?"],
      signal: mgr
        ? "Concrete, time-boxed coaching loop with evidence of growth or graceful transition."
        : "Confidence + curiosity, not just confrontation. Outcome-oriented.",
    },
    {
      category: "verification",
      question: `Your CV mentions ${jobTitle.toLowerCase().includes("manager") ? "growing the team and 0 regrettable departures" : "shipping projects with measurable impact"}. Pick the one you're proudest of and tell me the story in detail.`,
      probes: ["Who else was involved?", "What's the honest counterfactual?"],
      signal: "Specifics that prove first-hand ownership; humility about luck and team.",
    },
    {
      category: "verification",
      question: `If we called your last manager from ${cv.match(/at\s+([A-Z][\w\s.&-]+?)(?:\(|,|\n)/)?.[1]?.trim() ?? "your most recent role"}, what would they say is your biggest area to grow?`,
      probes: ["What are you doing about it?"],
      signal: "A real answer — not 'I work too hard'. Active learning loop.",
    },
    {
      category: "technical",
      question: `For the ${jobTitle} role, what's the first thing you'd want to understand about the team in your first 30 days?`,
      probes: ["What signals would tell you it's bad?", "What changes would you avoid?"],
      signal: "Curiosity about the team's reality before prescribing fixes.",
    },
    {
      category: "behavioral",
      question: "Walk me through a piece of feedback you got that landed hard but turned out to be right.",
      probes: ["How long did it take you to act on it?"],
      signal: "Specific feedback, concrete behavior change, not vague growth-mindset talk.",
    },
  ];

  return { rubric, questions };
}

export async function POST(req: Request) {
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const cv = (body.cv ?? "").trim();
  const candidateName = (body.candidateName ?? "the candidate").trim();
  const jobTitle = (body.jobTitle ?? "the target role").trim();
  const jobDescription = (body.jobDescription ?? "").trim();
  if (!cv) {
    return NextResponse.json({ error: "Missing 'cv'." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true" || !apiKey;

  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    const kit = buildMockKit(candidateName, jobTitle, cv);
    return NextResponse.json(kit as Omit<InterviewKit, "id" | "jobId" | "jobTitle" | "createdAt">, {
      headers: { "x-echohire-mode": "mock" },
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Candidate: ${candidateName}
Target role: ${jobTitle}
${jobDescription ? `Job description:\n${jobDescription.slice(0, 4000)}\n\n` : ""}<cv>
${cv.slice(0, 8000)}
</cv>

Return JSON only.`,
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as { rubric: string[]; questions: InterviewQuestion[] };
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.rubric)) {
      throw new Error("Model did not return the expected shape.");
    }
    return NextResponse.json(parsed, { headers: { "x-echohire-mode": "live" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ...buildMockKit(candidateName, jobTitle, cv), fallbackReason: msg },
      { headers: { "x-echohire-mode": "mock-fallback" } }
    );
  }
}
