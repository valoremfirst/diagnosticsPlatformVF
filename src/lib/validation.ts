import type {
  CriteriaScore,
  DiagnosticResult,
  EvidenceItem,
  FrameworkAssessment,
  MaturityLevel,
  Recommendation,
  RiskFinding,
  RoadmapItem,
  Speaker,
} from "./types";
import { maturityFromScore } from "./utils";

/**
 * Defensive parsing of the Gemini response. Models occasionally wrap JSON in
 * markdown fences or add stray prose; we strip those, then coerce the payload
 * into a well-formed DiagnosticResult. Throws ResultValidationError on
 * unrecoverable input so callers can surface a graceful failure state.
 */
export class ResultValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResultValidationError";
  }
}

const MATURITY_VALUES: MaturityLevel[] = [
  "low",
  "developing",
  "established",
  "advanced",
  "leading",
];

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip ```json ... ``` fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;

  // Try parsing as-is first (most common case).
  try {
    return JSON.parse(candidate);
  } catch {
    // Fallback: extract from first { to matching }, accounting for nesting.
    const start = candidate.indexOf("{");
    if (start === -1) {
      throw new ResultValidationError("No JSON object found in model response.");
    }

    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let end = -1;

    for (let i = start; i < candidate.length; i++) {
      const ch = candidate[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (ch === "\\") {
        escapeNext = true;
        continue;
      }

      if (ch === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
    }

    if (end === -1) {
      throw new ResultValidationError("No valid JSON object found in model response.");
    }

    const slice = candidate.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch (err) {
      throw new ResultValidationError(
        `Model response was not valid JSON: ${(err as Error).message}`,
      );
    }
  }
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function speaker(v: unknown): Speaker {
  return v === "user" ? "user" : "agent";
}

function evidenceArr(v: unknown): EvidenceItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e) => e && typeof e === "object")
    .map((e) => {
      const o = e as Record<string, unknown>;
      const item: EvidenceItem = {
        quote: str(o.quote),
        speaker: speaker(o.speaker),
      };
      if (o.transcriptIndex != null) item.transcriptIndex = num(o.transcriptIndex);
      return item;
    })
    .filter((e) => e.quote.length > 0);
}

function criteriaArr(v: unknown): CriteriaScore[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c) => c && typeof c === "object")
    .map((c) => {
      const o = c as Record<string, unknown>;
      return {
        name: str(o.name, "Unnamed criterion"),
        score: clamp(num(o.score), 0, 100),
        confidence: clamp(num(o.confidence), 0, 1),
        evidence: evidenceArr(o.evidence),
        rationale: str(o.rationale),
      } satisfies CriteriaScore;
    });
}

function frameworksArr(v: unknown): FrameworkAssessment[] {
  if (!Array.isArray(v)) {
    throw new ResultValidationError("`frameworks` was missing or not an array.");
  }
  const out = v
    .filter((f) => f && typeof f === "object")
    .map((f) => {
      const o = f as Record<string, unknown>;
      const criteria = criteriaArr(o.criteria);
      const score = clamp(num(o.score, avg(criteria.map((c) => c.score))), 0, 100);
      return {
        framework: str(o.framework, "Framework"),
        score,
        maturityLevel: str(o.maturityLevel) || maturityFromScore(score),
        criteria,
      } satisfies FrameworkAssessment;
    });
  if (out.length === 0) {
    throw new ResultValidationError("No valid frameworks present in response.");
  }
  return out;
}

function risksArr(v: unknown): RiskFinding[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      const o = r as Record<string, unknown>;
      const sev = str(o.severity).toLowerCase();
      return {
        title: str(o.title, "Risk"),
        severity: (["low", "medium", "high", "critical"].includes(sev)
          ? sev
          : "medium") as RiskFinding["severity"],
        description: str(o.description),
        evidence: evidenceArr(o.evidence),
      } satisfies RiskFinding;
    });
}

function level3(v: unknown): "low" | "medium" | "high" {
  const s = str(v).toLowerCase();
  return s === "high" || s === "low" ? s : "medium";
}

function recommendationsArr(v: unknown): Recommendation[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      const o = r as Record<string, unknown>;
      return {
        title: str(o.title, "Recommendation"),
        priority: level3(o.priority),
        impact: level3(o.impact),
        effort: level3(o.effort),
        description: str(o.description),
      } satisfies Recommendation;
    });
}

const PHASES = ["0-30 days", "31-90 days", "3-6 months"] as const;

function roadmapArr(v: unknown): RoadmapItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      const o = r as Record<string, unknown>;
      const phase = str(o.phase);
      return {
        phase: (PHASES.includes(phase as (typeof PHASES)[number])
          ? phase
          : "0-30 days") as RoadmapItem["phase"],
        action: str(o.action),
        ownerRole: str(o.ownerRole),
        expectedOutcome: str(o.expectedOutcome),
      } satisfies RoadmapItem;
    })
    .filter((r) => r.action.length > 0);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function parseDiagnosticResult(raw: string): DiagnosticResult {
  const data = extractJson(raw) as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new ResultValidationError("Response root was not an object.");
  }

  const frameworks = frameworksArr(data.frameworks);
  const overallScore = clamp(
    num(data.overallScore, avg(frameworks.map((f) => f.score))),
    0,
    100,
  );
  const ml = str(data.overallMaturityLevel).toLowerCase() as MaturityLevel;

  return {
    overallScore,
    overallMaturityLevel: MATURITY_VALUES.includes(ml)
      ? ml
      : maturityFromScore(overallScore),
    executiveSummary: str(data.executiveSummary),
    frameworks,
    risks: risksArr(data.risks),
    recommendations: recommendationsArr(data.recommendations),
    roadmap: roadmapArr(data.roadmap),
  };
}
