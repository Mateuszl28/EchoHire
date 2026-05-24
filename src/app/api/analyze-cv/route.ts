import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are EchoHire's recruitment analyst. You evaluate candidate CVs and produce a concise, structured assessment for a hiring manager.

For each CV, return well-structured Markdown with these sections, in this order:

## Summary
2-3 sentences. The candidate's profile in plain language.

## Years of relevant experience
A single number followed by a one-sentence justification.

## Top 3 strengths
Concrete bullets, each citing evidence from the CV (e.g. "shipped X at Y", not "team player").

## Top 3 gaps or risks
What a recruiter should probe in an interview.

## Suggested roles
2-3 role titles this candidate fits today.

## Interview questions
3 sharp, role-specific questions that verify the strengths and probe the risks.

Rules:
- Cite evidence from the CV when possible (job titles, projects, durations).
- Do not invent facts. If something isn't in the CV, say so explicitly.
- Be direct and useful. Skip filler and hedging language.
- Use markdown headings exactly as shown so a downstream parser can find each section.`;

function streamMockAnalysis(cv: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  // Light personalization based on a few CV keywords
  const lower = cv.toLowerCase();
  const senior = /(senior|lead|principal|staff|architect)/.test(lower);
  const ml = /(pytorch|ml|machine learning|computer vision|deep)/.test(lower);
  const manager = /(manag|director|head of)/.test(lower);
  const yearsMatch = lower.match(/(\d{1,2})\s*\+?\s*years/);
  const years = yearsMatch ? Math.min(Number(yearsMatch[1]), 25) : senior ? 8 : ml ? 5 : 3;

  const role = manager
    ? "Engineering Manager"
    : ml
    ? "Machine Learning Engineer"
    : senior
    ? "Senior Software Engineer"
    : "Software Engineer";

  const text = `## Summary
A capable ${role.toLowerCase()} with a credible track record across the projects listed. The CV emphasizes ${ml ? "applied ML and shipping research to production" : manager ? "managing teams and partnering with product" : "shipping production systems and growing inside roles"}. Background is well-aligned to mid-to-senior IC or lead positions in fast-moving teams.

## Years of relevant experience
${years} years — derived from the dated employment entries in the CV. Treat as an estimate; titles and overlapping periods can shift this by ±1 year.

## Top 3 strengths
- Demonstrated end-to-end ownership of meaningful systems — multiple roles describe shipping from prototype to production.
- Cross-functional comfort: the CV references close work with ${manager ? "product and clinical operations" : "design, ops, and other engineering teams"}.
- ${ml ? "Strong applied ML chops with deployment experience (PyTorch / TensorRT or equivalent)." : senior ? "Solid systems thinking and mentorship signal in the most recent role." : "Strong velocity and pragmatic stack choices for a developer at this stage."}

## Top 3 gaps or risks
- Scale claims would benefit from concrete numbers (latency, throughput, headcount, dollars).
- ${manager ? "Limited evidence of working across multiple functions outside engineering (finance, legal, etc.)." : "Limited evidence of ownership beyond the engineering boundary (product calls, on-call rotations, GTM)."}
- The CV does not surface failure or lessons-learned moments; worth probing in interview.

## Suggested roles
- ${role}
- ${ml ? "Applied Research Engineer" : senior ? "Tech Lead" : "Product Engineer (full-stack)"}
- ${manager ? "Director-of-Engineering for a 15-25 person org" : "Founding Engineer at a series-A/B startup"}

## Interview questions
1. Walk through a project where you owned a system end-to-end. What was the biggest tradeoff you made, and what would you do differently now?
2. Tell me about a time you were wrong about a technical or hiring decision. How did you notice, and how did you correct it?
3. ${ml ? "Describe a model you deployed where the offline metric didn't translate to a production win. How did you debug it?" : manager ? "How do you decide whether to coach an underperforming engineer or transition them out?" : "Pick the most complex part of your stack today. What would you change about it given a free week?"}
`;

  return new ReadableStream({
    async start(controller) {
      const chunks = text.match(/[\s\S]{1,6}/g) ?? [text];
      for (const c of chunks) {
        controller.enqueue(enc.encode(c));
        // small jittered delay to feel like a real stream
        await new Promise((r) => setTimeout(r, 12 + Math.random() * 18));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  let cv: string;
  try {
    const body = (await req.json()) as { cv?: unknown };
    if (typeof body.cv !== "string" || body.cv.trim().length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'cv' string." },
        { status: 400 },
      );
    }
    cv = body.cv.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (cv.length > 50_000) {
    return NextResponse.json(
      { error: "CV is too long. Please trim to under 50,000 characters." },
      { status: 413 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true" || !apiKey;

  // ─ Mock streaming path ─────────────────────────────────────────────────
  if (useMock) {
    return new Response(streamMockAnalysis(cv), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-echohire-mode": "mock",
        "cache-control": "no-cache, no-transform",
      },
    });
  }

  // ─ Live Claude streaming ────────────────────────────────────────────────
  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const response = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: `Analyze the following CV.\n\n<cv>\n${cv}\n</cv>`,
            },
          ],
        });

        response.on("text", (delta) => {
          controller.enqueue(enc.encode(delta));
        });
        await response.finalMessage();
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        controller.enqueue(enc.encode(`\n\n**Error:** ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-echohire-mode": "live",
      "cache-control": "no-cache, no-transform",
    },
  });
}
