import { FUNCTIONS, frameworksForFunction } from "./frameworks";
import type { DiagnosticFunction } from "./types";

// ---------------------------------------------------------------------------
// Intent routing — map a client's free-text description of "what they need to
// talk about" to the best-matching diagnostic agent. Pure, client-safe, and
// dependency-free: it scores the phrase against a per-function vocabulary built
// from the function's own probe topics + relevant frameworks, plus a curated
// set of high-signal synonyms so everyday language (e.g. "money", "hiring",
// "hackers") still lands on the right consultant.
// ---------------------------------------------------------------------------

/** Extra colloquial cues per function, on top of the framework/probe vocab. */
const SYNONYMS: Record<DiagnosticFunction, string[]> = {
  finance: [
    "money", "cash", "cashflow", "budget", "budgeting", "cost", "costs",
    "spend", "spending", "revenue", "profit", "margin", "invoice", "invoicing",
    "accounts", "accounting", "forecast", "forecasting", "roi", "pricing",
    "working capital", "payroll cost", "financial",
  ],
  legal: [
    "legal", "contract", "contracts", "compliance", "regulation", "regulatory",
    "gdpr", "privacy", "data protection", "policy", "policies", "dispute",
    "litigation", "ip", "intellectual property", "risk exposure", "counsel",
    "terms", "liability",
  ],
  it: [
    "it", "tech", "technology", "software", "systems", "system", "cyber",
    "security", "hackers", "hacking", "breach", "backup", "recovery", "outage",
    "downtime", "server", "cloud", "infrastructure", "integration", "data",
    "automation", "digital", "shadow it", "ransomware",
  ],
  "operational-delivery": [
    "operations", "operational", "delivery", "process", "processes",
    "workflow", "efficiency", "sla", "project", "projects", "programme",
    "milestone", "capacity", "throughput", "bottleneck", "cadence", "lean",
    "productivity", "resourcing", "handover",
  ],
  sales: [
    "sales", "selling", "pipeline", "revenue growth", "leads", "lead",
    "conversion", "crm", "deals", "deal", "quota", "forecast accuracy",
    "prospects", "customer retention", "churn", "win rate", "commercial",
    "new business",
  ],
  leadership: [
    "leadership", "leaders", "executive", "strategy", "strategic", "vision",
    "direction", "governance", "board", "decisions", "decision", "alignment",
    "execution", "change", "transformation", "succession", "priorities",
    "mission", "goals",
  ],
  culture: [
    "culture", "people", "team", "teams", "staff", "employees", "engagement",
    "morale", "wellbeing", "wellness", "burnout", "hiring", "recruitment",
    "retention", "turnover", "values", "inclusion", "diversity", "dei",
    "recognition", "hr", "talent", "onboarding",
  ],
  presales: [
    "presales", "pre-sales", "solution", "solutioning", "discovery",
    "qualification", "proposal", "proposals", "bid", "bids", "rfp", "tender",
    "demo", "demos", "poc", "scoping", "technical win", "solution design",
  ],
};

/** Normalise once: lowercase, strip punctuation to spaces, collapse spacing. */
function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** Build the weighted keyword bag for a function (memoised at module load). */
const VOCAB: Record<DiagnosticFunction, { term: string; weight: number }[]> =
  Object.fromEntries(
    FUNCTIONS.map((f) => {
      const terms = new Map<string, number>();
      const add = (raw: string, weight: number) => {
        const t = raw.toLowerCase().trim();
        if (t.length < 3) return;
        terms.set(t, Math.max(terms.get(t) ?? 0, weight));
      };

      // Label + agent domain — strongest signal.
      add(f.label, 3);
      // Probe topics — high signal, describe exactly what the agent covers.
      f.probesFor.forEach((p) => add(p, 2));
      // Relevant frameworks — medium signal.
      frameworksForFunction(f.id).forEach((fw) => {
        add(fw.short, 1.5);
        fw.criteria.forEach((c) => add(c, 1));
      });
      // Colloquial synonyms — medium-high so everyday words route well.
      SYNONYMS[f.id].forEach((s) => add(s, 2));

      return [
        f.id,
        Array.from(terms, ([term, weight]) => ({ term, weight })),
      ];
    }),
  ) as Record<DiagnosticFunction, { term: string; weight: number }[]>;

export interface RouteMatch {
  fn: DiagnosticFunction;
  score: number;
  /** The vocabulary terms that fired, for a human-readable "why this match". */
  hits: string[];
}

/**
 * Score a free-text intent against every function and return matches ranked
 * high→low. Only functions that scored above zero are returned. A phrase-level
 * (multi-word) hit counts once; single tokens are matched on word boundaries so
 * "it" doesn't fire on "audit".
 */
export function routeIntent(text: string): RouteMatch[] {
  const haystack = normalise(text);
  if (haystack.trim().length < 2) return [];

  const results: RouteMatch[] = [];

  for (const f of FUNCTIONS) {
    let score = 0;
    const hits: string[] = [];

    for (const { term, weight } of VOCAB[f.id]) {
      const needle = normalise(term).trim();
      if (!needle) continue;
      const matched = needle.includes(" ")
        ? haystack.includes(` ${needle} `) || haystack.includes(` ${needle}`)
        : haystack.includes(` ${needle} `);
      if (matched) {
        score += weight;
        hits.push(term);
      }
    }

    if (score > 0) results.push({ fn: f.id, score, hits });
  }

  return results.sort((a, b) => b.score - a.score);
}

/** The single best match, or null when nothing meaningful matched. */
export function bestRoute(text: string): RouteMatch | null {
  return routeIntent(text)[0] ?? null;
}

/** Ready-made example prompts to seed the intent box (one per common need). */
export const INTENT_SUGGESTIONS: { label: string; fn: DiagnosticFunction }[] = [
  { label: "Our cash flow feels unpredictable", fn: "finance" },
  { label: "I'm worried about a cyber breach", fn: "it" },
  { label: "Deals keep slipping through the pipeline", fn: "sales" },
  { label: "The team feels burnt out lately", fn: "culture" },
  { label: "Projects keep missing their deadlines", fn: "operational-delivery" },
  { label: "We need a clearer strategy", fn: "leadership" },
];
