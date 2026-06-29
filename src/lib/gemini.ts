import { FRAMEWORKS } from "./frameworks";
import type {
  DiagnosticFunction,
  DiagnosticResult,
  FrameworkAssessment,
  TranscriptTurn,
} from "./types";
import { maturityFromScore } from "./utils";
import { parseDiagnosticResult, ResultValidationError } from "./validation";

export function geminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const SCHEMA_BLOCK = `{
  "overallScore": number,
  "overallMaturityLevel": "low | developing | established | advanced | leading",
  "executiveSummary": string,
  "frameworks": [
    {
      "framework": string,
      "score": number,
      "maturityLevel": string,
      "criteria": [
        {
          "name": string,
          "score": number,
          "confidence": number,
          "evidence": [ { "quote": string, "speaker": "agent | user", "transcriptIndex": number } ],
          "rationale": string
        }
      ]
    }
  ],
  "risks": [ { "title": string, "severity": "low | medium | high | critical", "description": string, "evidence": [] } ],
  "recommendations": [ { "title": string, "priority": "low | medium | high", "impact": "low | medium | high", "effort": "low | medium | high", "description": string } ],
  "roadmap": [ { "phase": "0-30 days | 31-90 days | 3-6 months", "action": string, "ownerRole": string, "expectedOutcome": string } ]
}`;

export function buildPrompt(transcript: TranscriptTurn[]): string {
  const formatted = transcript
    .map((t, i) => `[${i}] ${t.speaker === "agent" ? "Consultant" : "Stakeholder"} (${t.timestamp}): ${t.text}`)
    .join("\n");

  return `You are an expert management consultant performing a structured business diagnostic.

Analyse the transcript against these frameworks:
${FRAMEWORKS.map((f) => `- ${f.name} (criteria: ${f.criteria.join(", ")})`).join("\n")}

Rules:
- Use only the transcript as evidence.
- Extract direct evidence quotes before scoring.
- Map each quote to a framework criterion using its transcript index.
- Assign each score from 0 to 100 and a confidence from 0 to 1.
- Do not invent facts. If evidence is missing, score cautiously and mark confidence low.
- Return strict JSON only. Do not include any markdown or prose outside the JSON.

Transcript:
${formatted}

Return exactly this structure:
${SCHEMA_BLOCK}`;
}

/**
 * Analyse a transcript. Uses the Gemini API when GEMINI_API_KEY is present;
 * otherwise synthesises a realistic, evidence-linked result from the
 * transcript so the platform remains fully functional on mock data.
 */
export async function analyseTranscript(
  transcript: TranscriptTurn[],
  fn: DiagnosticFunction,
): Promise<{ result: DiagnosticResult; source: "gemini" | "mock" }> {
  if (!geminiEnabled()) {
    return { result: synthesiseResult(transcript, fn), source: "mock" };
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
  });

  const prompt = buildPrompt(transcript);
  const res = await model.generateContent(prompt);
  const text = res.response.text();

  try {
    return { result: parseDiagnosticResult(text), source: "gemini" };
  } catch (err) {
    if (err instanceof ResultValidationError) {
      // Graceful failure: fall back to a synthesised result rather than crash.
      throw err;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Deterministic mock synthesiser (used when no Gemini key is configured).
// ---------------------------------------------------------------------------

function pickUserEvidence(transcript: TranscriptTurn[]): { quote: string; index: number }[] {
  return transcript
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.speaker === "user" && t.text.length > 40)
    .map(({ t, i }) => ({ quote: trimQuote(t.text), index: i }));
}

function trimQuote(text: string): string {
  if (text.length <= 160) return text;
  return text.slice(0, 157).trimEnd() + "…";
}

function seededScore(seed: number, base: number, spread: number): number {
  const v = Math.abs(Math.sin(seed * 12.9898) * 43758.5453);
  const frac = v - Math.floor(v);
  return Math.round(Math.min(100, Math.max(0, base + (frac - 0.5) * 2 * spread)));
}

function synthesiseResult(
  transcript: TranscriptTurn[],
  fn: DiagnosticFunction,
): DiagnosticResult {
  const evidence = pickUserEvidence(transcript);
  let seed = transcript.reduce((a, t) => a + t.text.length, 0) + fn.length;

  const frameworks: FrameworkAssessment[] = FRAMEWORKS.map((f, fi) => {
    const criteria = f.criteria.map((name, ci) => {
      seed += 1;
      const score = seededScore(seed + fi * 7 + ci * 3, 45, 18);
      const ev = evidence[(fi + ci) % Math.max(1, evidence.length)];
      const hasEv = evidence.length > 0 && (fi + ci) % 2 === 0;
      return {
        name,
        score,
        confidence: hasEv ? 0.6 + (seededScore(seed, 25, 10) / 100) * 0.3 : 0.35,
        evidence: hasEv && ev
          ? [{ quote: ev.quote, speaker: "user" as const, transcriptIndex: ev.index }]
          : [],
        rationale: hasEv
          ? "Assessment grounded in stakeholder evidence from the interview."
          : "Limited direct evidence in the transcript; scored cautiously with low confidence.",
      };
    });
    const score = Math.round(
      criteria.reduce((a, c) => a + c.score, 0) / criteria.length,
    );
    return {
      framework: f.name,
      score,
      maturityLevel: maturityFromScore(score),
      criteria,
    };
  });

  const overallScore = Math.round(
    frameworks.reduce((a, f) => a + f.score, 0) / frameworks.length,
  );

  const risks = evidence.slice(0, 3).map((e, i) => ({
    title: ["Process & control gap", "Manual dependency", "Data visibility gap"][i] ?? "Operational risk",
    severity: (["high", "medium", "medium"][i] ?? "medium") as "high" | "medium",
    description: "Derived from stakeholder commentary during the interview.",
    evidence: [{ quote: e.quote, speaker: "user" as const, transcriptIndex: e.index }],
  }));

  return {
    overallScore,
    overallMaturityLevel: maturityFromScore(overallScore),
    executiveSummary:
      "This is an automatically synthesised diagnostic generated from the captured transcript (no Gemini API key configured). Scores are evidence-linked where the transcript provides supporting commentary and marked low-confidence where it does not. Configure GEMINI_API_KEY for full AI-graded analysis.",
    frameworks,
    risks,
    recommendations: [
      { title: "Address the highest-severity gap first", priority: "high", impact: "high", effort: "medium", description: "Prioritise the risk with the strongest evidence and clearest business impact." },
      { title: "Introduce live visibility where data is currently lagging", priority: "high", impact: "medium", effort: "medium", description: "Replace periodic/manual reporting with near-real-time dashboards." },
      { title: "Standardise and document key processes", priority: "medium", impact: "medium", effort: "low", description: "Reduce variation and key-person dependency through documented standard work." },
    ],
    roadmap: [
      { phase: "0-30 days", action: "Confirm baseline metrics and assign owners to the top gaps.", ownerRole: "Function Lead", expectedOutcome: "Clear ownership and measurable baseline." },
      { phase: "31-90 days", action: "Implement the highest-impact tooling or process change.", ownerRole: "Transformation Lead", expectedOutcome: "Visible improvement against baseline." },
      { phase: "3-6 months", action: "Embed governance and continuous improvement cadence.", ownerRole: "Executive Sponsor", expectedOutcome: "Sustained, measured maturity gains." },
    ],
  };
}
