import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are EchoHire's recruitment analyst. You evaluate candidate CVs and produce a concise, structured assessment for a hiring manager.

For each CV, return:

1. **Summary** (2–3 sentences) — the candidate's profile in plain language.
2. **Years of relevant experience** — your best estimate, with reasoning.
3. **Top 3 strengths** — concrete, derived from the CV (e.g. "shipped X at Y", not "team player").
4. **Top 3 gaps or risks** — what a recruiter should probe in an interview.
5. **Suggested roles** — 2–3 role titles this candidate fits today.
6. **Interview questions** — 3 sharp, role-specific questions tailored to verify the strengths and probe the risks.

Rules:
- Cite evidence from the CV when possible (job titles, projects, durations).
- Do not invent facts. If something isn't in the CV, say so.
- Be direct and useful. Skip filler and hedging language.
- Output well-structured Markdown.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

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

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      thinking: { type: "disabled" },
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

    const analysis = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return NextResponse.json({
      analysis,
      usage: response.usage,
      stopReason: response.stop_reason,
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again in a moment." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
