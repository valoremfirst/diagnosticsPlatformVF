// Core domain models for the Agentic Diagnostics Platform.
// Mirrors the data model in the build brief.

export type DiagnosticFunction =
  | "finance"
  | "hr"
  | "sales"
  | "operations"
  | "it"
  | "leadership";

export type DiagnosticStatus =
  | "draft"
  | "in_progress"
  | "processing"
  | "complete"
  | "failed";

export type MaturityLevel =
  | "low"
  | "developing"
  | "established"
  | "advanced"
  | "leading";

export type Speaker = "agent" | "user";

export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "medium" | "high";
export type Effort = "low" | "medium" | "high";
export type Impact = "low" | "medium" | "high";
export type RoadmapPhase = "0-30 days" | "31-90 days" | "3-6 months";

export interface TranscriptTurn {
  speaker: Speaker;
  text: string;
  timestamp: string;
}

export interface EvidenceItem {
  quote: string;
  speaker: Speaker;
  transcriptIndex?: number;
}

export interface CriteriaScore {
  name: string;
  score: number; // 0-100
  confidence: number; // 0-1
  evidence: EvidenceItem[];
  rationale: string;
}

export interface FrameworkAssessment {
  framework: string;
  score: number; // 0-100
  maturityLevel: string;
  criteria: CriteriaScore[];
}

export interface RiskFinding {
  title: string;
  severity: Severity;
  description: string;
  evidence: EvidenceItem[];
}

export interface Recommendation {
  title: string;
  priority: Priority;
  impact: Impact;
  effort: Effort;
  description: string;
}

export interface RoadmapItem {
  phase: RoadmapPhase;
  action: string;
  ownerRole: string;
  expectedOutcome: string;
}

export interface DiagnosticResult {
  overallScore: number; // 0-100
  overallMaturityLevel: MaturityLevel;
  executiveSummary: string;
  frameworks: FrameworkAssessment[];
  risks: RiskFinding[];
  recommendations: Recommendation[];
  roadmap: RoadmapItem[];
}

export interface Company {
  id: string;
  name: string;
  /** Short label for avatars / compact UI, e.g. "VF". */
  shortName: string;
  /** User-editable brand colour (hex), used to theme the company dashboard. */
  brandColor: string;
  sector?: string;
  tagline?: string;
  /** URL to the company logo / profile picture. */
  profilePicture?: string;
  /** Longer description of the company shown on the dashboard hero. */
  description?: string;
  /**
   * Per-function ElevenLabs agent ids. Each company runs its own agents, so
   * auto-import resolves the agent id from here (falling back to env defaults).
   */
  agentIds?: Partial<Record<DiagnosticFunction, string>>;
  /** Random token enabling a public, read-only share link for this company. */
  shareToken?: string;
  createdAt: string;
}

export interface DiagnosticSession {
  id: string;
  /** Owning company. Optional for legacy/ad-hoc sessions. */
  companyId?: string;
  companyName: string;
  function: DiagnosticFunction;
  /** Optional label for the uploaded transcript, e.g. "CFO interview". */
  title?: string;
  /** Source ElevenLabs conversation id, set when auto-imported (dedup key). */
  sourceConversationId?: string;
  status: DiagnosticStatus;
  // Optional contextual metadata captured at creation.
  clientContact?: string;
  sector?: string;
  notes?: string;
  selectedFrameworks: string[];
  transcript: TranscriptTurn[];
  result?: DiagnosticResult;
  createdAt: string;
  completedAt?: string;
}
