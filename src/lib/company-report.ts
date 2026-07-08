import { functionById } from "./frameworks";
import { askGeminiJson, geminiEnabled } from "./gemini";
import type {
  Company,
  CompanyReport,
  DiagnosticSession,
  MaturityLevel,
  Priority,
  ReportRecommendation,
  ReportRisk,
  ReportRoadmapItem,
  ReportTheme,
  RoadmapPhase,
  Severity,
} from "./types";
import { maturityFromScore } from "./utils";

const MAX_TURNS_PER_TRANSCRIPT = 24;

const REPORT_SCHEMA = `{
  "headline": string,                 // one punchy strategic sentence
  "overallScore": number,             // 0-100, holistic across all functions
  "overallMaturity": "low | developing | established | advanced | leading",
  "executiveSummary": string,         // 2-3 tight paragraphs, board-ready
  "strengths": [ string ],            // 3-5 cross-cutting strengths
  "crossCuttingThemes": [ { "theme": string, "detail": string, "functions": [ string ] } ],
  "priorityRisks": [ { "title": string, "severity": "low | medium | high | critical", "functions": [ string ], "description": string } ],
  "strategicRecommendations": [ { "title": string, "priority": "low | medium | high", "rationale": string } ],
  "roadmap": [ { "phase": "0-30 days | 31-90 days | 3-6 months", "focus": string, "actions": [ string ] } ]
}`;

/** Compact, evidence-dense context block from every analysed diagnostic. */
function buildContext(completed: DiagnosticSession[]): string {
  return completed
    .map((s) => {
      const fn = functionById(s.function);
      const r = s.result!;
      const frameworks = r.frameworks
        .map((f) => `      · ${f.framework}: ${f.score}/100 (${f.maturityLevel})`)
        .join("\n");
      const risks = r.risks
        .map((x) => `      - [${x.severity}] ${x.title}: ${x.description}`)
        .join("\n");
      const recs = r.recommendations
        .map((x) => `      - [${x.priority}] ${x.title}: ${x.description}`)
        .join("\n");
      const transcript = s.transcript
        .slice(0, MAX_TURNS_PER_TRANSCRIPT)
        .map(
          (t, i) =>
            `      [${i}] ${t.speaker === "agent" ? "Consultant" : "Stakeholder"}: ${t.text}`,
        )
        .join("\n");
      return [
        `### ${fn.label} — overall ${r.overallScore}/100 (${r.overallMaturityLevel})`,
        `   Summary: ${r.executiveSummary}`,
        `   Frameworks:\n${frameworks || "      (none)"}`,
        `   Risks:\n${risks || "      (none)"}`,
        `   Recommendations:\n${recs || "      (none)"}`,
        `   Transcript excerpt:\n${transcript}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildReportPrompt(
  company: Company,
  completed: DiagnosticSession[],
): string {
  return `You are a senior management consultant writing a single, company-wide executive diagnostic report for ${company.name}${
    company.sector ? ` (${company.sector})` : ""
  }.

You are given the per-function diagnostic results (scores, frameworks, risks, recommendations and transcript excerpts) for every business function assessed so far. Synthesise them into ONE strategic report that a board or executive team would read.

Rules:
- Think across functions: surface themes that recur in more than one area, and tensions between areas.
- Ground every claim in the supplied diagnostics. Do not invent findings.
- Be specific and concise. Name the business function(s) behind each theme, risk and recommendation.
- Prioritise ruthlessly: the priority risks and strategic recommendations should be the few that matter most across the whole business, not a restatement of every per-function item.
- Return strict JSON only, no markdown or prose outside the JSON.

PER-FUNCTION DIAGNOSTICS:
${buildContext(completed)}

Return exactly this structure:
${REPORT_SCHEMA}`;
}

// --- Defensive parsing -----------------------------------------------------

const MATURITY_VALUES: MaturityLevel[] = [
  "low",
  "developing",
  "established",
  "advanced",
  "leading",
];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];
const PHASES: RoadmapPhase[] = ["0-30 days", "31-90 days", "3-6 months"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}
function oneOf<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  const s = str(v).toLowerCase() as T;
  return allowed.includes(s) ? s : fallback;
}

function extractJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("No JSON object found in model response.");
    }
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  }
}

function parseReport(raw: string): Omit<
  CompanyReport,
  "basedOnFunctions" | "basedOnSessions" | "generatedAt" | "source"
> {
  const d = extractJson(raw);

  const themes: ReportTheme[] = Array.isArray(d.crossCuttingThemes)
    ? d.crossCuttingThemes
        .filter((t) => t && typeof t === "object")
        .map((t) => {
          const o = t as Record<string, unknown>;
          return {
            theme: str(o.theme, "Theme"),
            detail: str(o.detail),
            functions: strArr(o.functions),
          };
        })
    : [];

  const risks: ReportRisk[] = Array.isArray(d.priorityRisks)
    ? d.priorityRisks
        .filter((r) => r && typeof r === "object")
        .map((r) => {
          const o = r as Record<string, unknown>;
          return {
            title: str(o.title, "Risk"),
            severity: oneOf(o.severity, SEVERITIES, "medium"),
            functions: strArr(o.functions),
            description: str(o.description),
          };
        })
    : [];

  const recs: ReportRecommendation[] = Array.isArray(d.strategicRecommendations)
    ? d.strategicRecommendations
        .filter((r) => r && typeof r === "object")
        .map((r) => {
          const o = r as Record<string, unknown>;
          return {
            title: str(o.title, "Recommendation"),
            priority: oneOf(o.priority, PRIORITIES, "medium"),
            rationale: str(o.rationale),
          };
        })
    : [];

  const roadmap: ReportRoadmapItem[] = Array.isArray(d.roadmap)
    ? d.roadmap
        .filter((r) => r && typeof r === "object")
        .map((r) => {
          const o = r as Record<string, unknown>;
          return {
            phase: oneOf(o.phase, PHASES, "0-30 days"),
            focus: str(o.focus),
            actions: strArr(o.actions),
          };
        })
    : [];

  const overallScore = num(d.overallScore);

  return {
    headline: str(d.headline, `${""}Executive diagnostic summary`).trim(),
    overallScore,
    overallMaturity: MATURITY_VALUES.includes(
      str(d.overallMaturity).toLowerCase() as MaturityLevel,
    )
      ? (str(d.overallMaturity).toLowerCase() as MaturityLevel)
      : maturityFromScore(overallScore),
    executiveSummary: str(d.executiveSummary),
    strengths: strArr(d.strengths),
    crossCuttingThemes: themes,
    priorityRisks: risks,
    strategicRecommendations: recs,
    roadmap,
  };
}

// --- Deterministic mock fallback ------------------------------------------

function synthesise(
  company: Company,
  completed: DiagnosticSession[],
): Omit<CompanyReport, "basedOnFunctions" | "basedOnSessions" | "generatedAt" | "source"> {
  const avg = Math.round(
    completed.reduce((a, s) => a + (s.result?.overallScore ?? 0), 0) /
      Math.max(1, completed.length),
  );

  // Rank functions by score to find weakest / strongest.
  const byScore = [...completed].sort(
    (a, b) => (a.result?.overallScore ?? 0) - (b.result?.overallScore ?? 0),
  );
  const weakest = byScore.slice(0, 3);
  const strongest = [...byScore].reverse().slice(0, 3);

  const allRisks = completed.flatMap((s) =>
    (s.result?.risks ?? []).map((r) => ({ fn: functionById(s.function).label, r })),
  );
  const sevRank: Record<Severity, number> = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0,
  };
  const topRisks = allRisks
    .sort((a, b) => sevRank[b.r.severity] - sevRank[a.r.severity])
    .slice(0, 5);

  const allRecs = completed.flatMap((s) =>
    (s.result?.recommendations ?? []).map((r) => ({
      fn: functionById(s.function).label,
      r,
    })),
  );
  const prioRank: Record<Priority, number> = { high: 2, medium: 1, low: 0 };
  const topRecs = allRecs
    .sort((a, b) => prioRank[b.r.priority] - prioRank[a.r.priority])
    .slice(0, 5);

  return {
    headline: `${company.name} is operating at ${maturityFromScore(avg)} maturity across ${completed.length} assessed function${completed.length === 1 ? "" : "s"}.`,
    overallScore: avg,
    overallMaturity: maturityFromScore(avg),
    executiveSummary: `This report synthesises ${completed.length} completed diagnostic${completed.length === 1 ? "" : "s"} for ${company.name}. The strongest areas are ${strongest
      .map((s) => functionById(s.function).label)
      .join(", ")}, while ${weakest
      .map((s) => functionById(s.function).label)
      .join(", ")} show the most headroom. (Generated without a Gemini API key — this is a deterministic aggregate of the underlying per-function results; configure GEMINI_API_KEY for a fully AI-synthesised narrative.)`,
    strengths: strongest.map(
      (s) =>
        `${functionById(s.function).label}: ${s.result?.overallScore}/100 (${s.result?.overallMaturityLevel})`,
    ),
    crossCuttingThemes: [
      {
        theme: "Maturity spread across functions",
        detail: `Scores range from ${byScore[0]?.result?.overallScore ?? 0} to ${
          byScore[byScore.length - 1]?.result?.overallScore ?? 0
        }/100, indicating uneven capability that warrants targeted investment.`,
        functions: completed.map((s) => functionById(s.function).label),
      },
    ],
    priorityRisks: topRisks.map(({ fn, r }) => ({
      title: r.title,
      severity: r.severity,
      functions: [fn],
      description: r.description,
    })),
    strategicRecommendations: topRecs.map(({ r }) => ({
      title: r.title,
      priority: r.priority,
      rationale: r.description,
    })),
    roadmap: [
      {
        phase: "0-30 days",
        focus: "Stabilise the highest-severity gaps",
        actions: topRisks
          .slice(0, 2)
          .map((x) => `Address: ${x.r.title} (${x.fn})`),
      },
      {
        phase: "31-90 days",
        focus: "Lift the weakest functions",
        actions: weakest.map(
          (s) => `Targeted improvement plan for ${functionById(s.function).label}`,
        ),
      },
      {
        phase: "3-6 months",
        focus: "Embed governance and continuous improvement",
        actions: [
          "Establish a cross-functional maturity review cadence",
          "Re-run diagnostics to measure movement against this baseline",
        ],
      },
    ],
  };
}

/**
 * Generate the company-wide executive report from every analysed diagnostic.
 * Uses Gemini when a key is present, otherwise a deterministic synthesis so the
 * feature works fully on mock data.
 */
export async function generateCompanyReport(
  company: Company,
  completed: DiagnosticSession[],
): Promise<CompanyReport> {
  const basedOnFunctions = Array.from(
    new Set(completed.map((s) => functionById(s.function).label)),
  );
  const base = {
    basedOnFunctions,
    basedOnSessions: completed.length,
    generatedAt: new Date().toISOString(),
  };

  if (!geminiEnabled()) {
    return { ...synthesise(company, completed), ...base, source: "mock" };
  }

  const raw = await askGeminiJson(buildReportPrompt(company, completed));
  return { ...parseReport(raw), ...base, source: "gemini" };
}
