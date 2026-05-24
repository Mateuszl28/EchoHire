import type { Scorecard, ScorecardAxis } from "./types";

/**
 * Lightweight, deterministic scorecard extraction from the analysis markdown.
 * No second LLM call needed — pulls "Years of relevant experience", scores
 * 6 axes from keyword hits in the analysis, and produces a 0-100 overall fit.
 */

interface AxisRule {
  label: string;
  // weighted keyword hits in the analysis
  positive: RegExp[];
  negative: RegExp[];
}

const AXES: AxisRule[] = [
  {
    label: "Technical depth",
    positive: [/architect|scal(e|ing)|throughput|latency|design system|migrat|rewrote|rewrite|production|deploy|distributed|kafka|kubernetes|microservice|database|sql/i],
    negative: [/junior|self-taught|partial|bootcamp|intern$/i],
  },
  {
    label: "Leadership",
    positive: [/lead|led\b|mentor|managed|management|hired|hiring|grew the team|tech lead|head of|director|principal|staff|founded/i],
    negative: [/junior|individual contributor only|no management|first time/i],
  },
  {
    label: "Communication",
    positive: [/cross-functional|partner(ed|ing)? with|stakeholder|wrote|authored|presented|talk|conference|blog|public speak|design partner/i],
    negative: [/struggle communic|limited communic|english is second/i],
  },
  {
    label: "Product sense",
    positive: [/product|ux|user|0-to-1|0 to 1|prototype|figma|design partner|user research|growth|nps|dau|wau|conversion/i],
    negative: [/no product exposure|backend-only|infra-only/i],
  },
  {
    label: "Velocity",
    positive: [/shipped|launched|cut|increased|reduced|10x|5x|30%|40%|50%|grew|scaled|migrated|delivered|achieved/i],
    negative: [/slow|delayed|missed|over.budget/i],
  },
  {
    label: "Domain fit",
    positive: [/fintech|payment|saas|paytech|healthtech|biotech|adtech|robotics|ml|machine learning|computer vision|observability|security|infra|platform/i],
    negative: [/career change|switching domains|new to industry/i],
  },
];

function scoreAxis(text: string, rule: AxisRule): number {
  const lc = text.toLowerCase();
  let raw = 50; // baseline
  for (const r of rule.positive) {
    const m = lc.match(new RegExp(r.source, r.flags + "g"));
    if (m) raw += Math.min(28, m.length * 9);
  }
  for (const r of rule.negative) {
    const m = lc.match(new RegExp(r.source, r.flags + "g"));
    if (m) raw -= m.length * 12;
  }
  return Math.max(15, Math.min(98, Math.round(raw)));
}

export function extractScorecard(analysisMarkdown: string): Scorecard {
  // Years
  const yearsMatch =
    analysisMarkdown.match(/Years of relevant experience[\s\S]*?(\d{1,2})\s*\+?/i) ||
    analysisMarkdown.match(/(\d{1,2})\+?\s*years? of/i);
  const years = yearsMatch ? Math.min(Number(yearsMatch[1]), 30) : 0;

  const axes: ScorecardAxis[] = AXES.map((a) => ({
    label: a.label,
    value: scoreAxis(analysisMarkdown, a),
  }));

  const overallFit = Math.round(
    axes.reduce((s, a) => s + a.value, 0) / axes.length
  );

  // Highlights: pull bullet lines from "Top 3 strengths" section
  const strengthsBlock = analysisMarkdown.match(
    /##+\s*Top 3 strengths\s*\n([\s\S]*?)(?:\n##|\n#|$)/i
  );
  const highlights =
    strengthsBlock?.[1]
      ?.split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 3) ?? [];

  return { yearsExperience: years, overallFit, axes, highlights };
}
