import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { DraftEmail } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Intent = DraftEmail["intent"];

interface ReqBody {
  candidateName?: string;
  cv?: string;
  jobTitle?: string;
  intent?: Intent;
  recruiterName?: string;
  company?: string;
}

const SYSTEM_PROMPT = `You are EchoHire's outbound writer. You write short, specific, human-sounding recruitment emails that surface why you reached out and respect the candidate's time.

Output JSON only — no markdown fence, no commentary — in this exact shape:
{
  "subject": "<short, specific subject line — under 60 chars>",
  "body": "<plain text email body, 60-140 words, real paragraphs separated by blank lines>"
}

Rules:
- Reference 1-2 concrete details from the CV. No generic "I came across your profile" openings.
- Be honest about the role's stage / level.
- Close with a single low-friction next step (15-min intro, async questions, etc.).
- No emojis. No buzzwords. No "rockstar". No "ninja".
- Sign off as the recruiter, not the company.`;

function mockDraft(name: string, cv: string, jobTitle: string, intent: Intent, recruiter: string, company: string): { subject: string; body: string } {
  const firstName = name.split(/\s+/)[0];
  // Try to pluck a strong line from the CV
  const cvLines = cv.split("\n").map((l) => l.trim()).filter(Boolean);
  const hook = cvLines.find((l) =>
    /(shipped|led|built|grew|cut|scaled|founded|owned)/i.test(l)
  ) ?? cvLines.find((l) => l.length > 25 && l.length < 200) ?? "your background";

  if (intent === "first-outreach") {
    return {
      subject: `${firstName} — quick note about ${jobTitle} at ${company || "our team"}`,
      body: `Hi ${firstName},

I'm ${recruiter}, working with the team hiring a ${jobTitle} at ${company || "us"}. What caught my eye: "${hook}". That maps closely to what this role would own day-to-day.

The role is open right now and on a real timeline (offer in <3 weeks once we find the right fit). I'd love a 15-minute call to walk you through the team, scope, and comp, and to learn what you're looking for next.

Would something this week or next work? Happy to send a few slots.

— ${recruiter}`,
    };
  }
  if (intent === "interview-invite") {
    return {
      subject: `Next step — interview for ${jobTitle}`,
      body: `Hi ${firstName},

Thanks again for the intro chat. The team would like to move forward.

The next round is a 60-minute conversation focused on a real problem the team is currently working through — no algorithm puzzles, no take-home. You can pick the language and stack.

Could you share 3-4 windows that work for you in the next 7 days? I'll match them to the hiring manager's calendar and confirm.

— ${recruiter}`,
    };
  }
  if (intent === "rejection-warm") {
    return {
      subject: `${jobTitle} update`,
      body: `Hi ${firstName},

Thanks for the time you put into the conversations with our team. After comparing the final round candidates, we've decided to move forward with someone else for this specific role.

To be direct: the decision was tight, and it came down to depth in a very narrow area. Your work on ${hook.slice(0, 80)} was genuinely impressive, and I don't want this to be the last conversation.

If you're open to it, I'd like to keep you in mind for a couple of upcoming roles that look closer to your strengths.

— ${recruiter}`,
    };
  }
  // offer
  return {
    subject: `Offer — ${jobTitle}`,
    body: `Hi ${firstName},

I'm thrilled to share an offer for the ${jobTitle} role at ${company || "our team"}. The team is unanimous on you — based on the conversations, your work on ${hook.slice(0, 80)}, and the trajectory in your CV.

The written offer pack will follow this email. Headlines: title, base, equity, sign-on, target start date. Decision window: 7 working days, happy to extend if you need more time.

I'm available today and tomorrow to walk through anything in detail.

— ${recruiter}`,
  };
}

export async function POST(req: Request) {
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const cv = (body.cv ?? "").trim();
  const name = (body.candidateName ?? "Candidate").trim();
  const jobTitle = (body.jobTitle ?? "this role").trim();
  const intent: Intent = (body.intent ?? "first-outreach") as Intent;
  const recruiter = (body.recruiterName ?? "EchoHire").trim();
  const company = (body.company ?? "").trim();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = process.env.USE_MOCK_AI === "true" || !apiKey;

  if (useMock) {
    await new Promise((r) => setTimeout(r, 450));
    return NextResponse.json(
      mockDraft(name, cv, jobTitle, intent, recruiter, company),
      { headers: { "x-echohire-mode": "mock" } }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      thinking: { type: "disabled" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Intent: ${intent}
Candidate: ${name}
Target role: ${jobTitle}
Recruiter: ${recruiter}
Company: ${company || "—"}

<cv>
${cv.slice(0, 6000)}
</cv>

Return JSON only.`,
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as { subject: string; body: string };
    if (!parsed.subject || !parsed.body) {
      throw new Error("Model did not return subject/body.");
    }
    return NextResponse.json(parsed, { headers: { "x-echohire-mode": "live" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ...mockDraft(name, cv, jobTitle, intent, recruiter, company), fallbackReason: msg },
      { headers: { "x-echohire-mode": "mock-fallback" } }
    );
  }
}
