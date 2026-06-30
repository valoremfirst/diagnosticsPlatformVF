# Claude Build Brief: Agentic Diagnostics Platform

## Objective
Build a React-based **Agentic Diagnostics Platform** that acts like an automated management consultant.

The platform should:
1. Run a voice-led diagnostic interview using an ElevenLabs AI Agent.
2. Capture the full transcript from the session.
3. Send the transcript to the Gemini API for structured analysis.
4. Score the organisation against multiple business maturity frameworks.
5. Produce a clear diagnostic dashboard with evidence, scores, risks and recommendations.

## Critical UI Instruction
Before building the frontend, inspect the project `Mocks` folder/file.

**Base the frontend visual direction on the Oracle mock in the `Mocks` file.**

Use it as the reference for:
- Overall layout
- Navigation structure
- Dashboard style
- Card treatments
- Enterprise spacing
- Typography hierarchy
- Data visualisation style
- Professional SaaS feel

Do not create a generic AI chatbot interface. This must look like an enterprise-grade diagnostic and management consulting platform.

## Product Concept
The product combines:
- **ElevenLabs Conversational AI** for human, voice-led discovery interviews.
- **Gemini API** for transcript analysis, scoring and recommendations.
- **React frontend** for dashboards, evidence review and diagnostic reporting.

The user should experience the platform as a structured consulting diagnostic, not a loose AI conversation.

## Target Diagnostic Areas
The platform should support multiple business functions, including:
- Finance
- HR
- Sales
- Operations
- IT
- Leadership / Strategy

Each diagnostic starts with a selected business function and an ElevenLabs agent configured for that domain.

## Diagnostic Frameworks
Gemini must analyse each transcript against these frameworks:

### 1. Lean / Six Sigma
Assess:
- Waste identification
- Process variation
- Standardisation
- Root cause discipline
- Continuous improvement maturity
- DMAIC alignment

### 2. Digital Maturity
Assess:
- Automation level
- System integration
- Data quality
- Workflow digitisation
- AI readiness
- User adoption

### 3. IT Resilience
Assess:
- Availability
- Backup and recovery
- Cyber resilience
- Incident response
- System dependency risk
- Operational continuity

### 4. Balanced Scorecard
Assess:
- Financial performance
- Customer outcomes
- Internal process maturity
- Learning and growth
- Strategic alignment

### 5. Finance / ROI Maturity
Assess:
- Cost visibility
- ROI discipline
- Budget ownership
- Forecasting maturity
- Benefits tracking
- Investment governance

## Recommended Tech Stack
Use this unless the existing project dictates otherwise:

- Frontend: React or Next.js
- Styling: Tailwind CSS
- UI Components: shadcn/ui where suitable
- Icons: lucide-react
- Charts: Recharts
- Backend/API: Next.js API routes or server actions
- Database: Supabase / PostgreSQL
- Voice: ElevenLabs Conversational AI SDK
- Analysis: Gemini API

## Main User Flow
1. User lands on the dashboard.
2. User selects diagnostic type, e.g. Finance, HR, Sales, IT.
3. Platform loads the relevant ElevenLabs Agent.
4. User starts a voice diagnostic interview.
5. Transcript is captured when the session ends.
6. Transcript is cleaned and sent to Gemini.
7. Gemini returns structured JSON scoring.
8. Dashboard displays:
   - Overall maturity score
   - Framework-level scores
   - Evidence-backed findings
   - Risks and gaps
   - Recommended actions
   - Suggested roadmap
9. User can export or save the diagnostic.

## Required Pages
Create the following pages/views:

### 1. Landing / Overview Dashboard
Purpose: show platform value and latest diagnostics.

Include:
- Hero summary area
- Recent diagnostics
- Overall maturity score cards
- Framework summary chart
- Call-to-action to start a new diagnostic

### 2. New Diagnostic
Purpose: start a new diagnostic interview.

Include:
- Business function selector
- Frameworks selected for scoring
- Client/company context fields
- Start voice session button
- ElevenLabs session status

### 3. Live Diagnostic Session
Purpose: manage the active voice interview.

Include:
- Active agent identity
- Live transcript panel
- Session timer
- Current question/status
- End session button
- Processing state after completion

### 4. Diagnostic Results
Purpose: present analysed findings.

Include:
- Overall score
- Radar chart across frameworks
- Bar chart by framework criteria
- Evidence-backed scorecards
- Risk heatmap
- Recommendations
- Prioritised roadmap

### 5. Evidence Review
Purpose: build user trust in the AI scoring.

Include:
- Transcript viewer
- Highlighted quotes used as evidence
- Clickable links from score criteria to transcript evidence
- Confidence score per finding

### 6. Diagnostic History
Purpose: show previous diagnostic reports.

Include:
- Table of completed diagnostics
- Filters by function, date, company and score
- View details button
- Trend comparison where historical data exists

## Core Components
Build reusable components for:

- `AppShell`
- `SidebarNav`
- `TopBar`
- `MetricCard`
- `FrameworkScoreCard`
- `RadarScoreChart`
- `CriteriaBarChart`
- `RiskHeatmap`
- `TranscriptPanel`
- `EvidenceQuote`
- `RecommendationList`
- `RoadmapTimeline`
- `DiagnosticStatusBadge`
- `AgentSelector`
- `VoiceSessionControls`

## Data Model
Use these TypeScript-style models as a guide.

```ts
type DiagnosticFunction =
  | 'finance'
  | 'hr'
  | 'sales'
  | 'operations'
  | 'it'
  | 'leadership';

type DiagnosticSession = {
  id: string;
  companyName: string;
  function: DiagnosticFunction;
  status: 'draft' | 'in_progress' | 'processing' | 'complete' | 'failed';
  transcript: TranscriptTurn[];
  result?: DiagnosticResult;
  createdAt: string;
  completedAt?: string;
};

type TranscriptTurn = {
  speaker: 'agent' | 'user';
  text: string;
  timestamp: string;
};

type DiagnosticResult = {
  overallScore: number;
  overallMaturityLevel: 'low' | 'developing' | 'established' | 'advanced' | 'leading';
  executiveSummary: string;
  frameworks: FrameworkAssessment[];
  risks: RiskFinding[];
  recommendations: Recommendation[];
  roadmap: RoadmapItem[];
};

type FrameworkAssessment = {
  framework: string;
  score: number;
  maturityLevel: string;
  criteria: CriteriaScore[];
};

type CriteriaScore = {
  name: string;
  score: number;
  confidence: number;
  evidence: EvidenceItem[];
  rationale: string;
};

type EvidenceItem = {
  quote: string;
  speaker: 'agent' | 'user';
  transcriptIndex?: number;
};

type RiskFinding = {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: EvidenceItem[];
};

type Recommendation = {
  title: string;
  priority: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  description: string;
};

type RoadmapItem = {
  phase: '0-30 days' | '31-90 days' | '3-6 months';
  action: string;
  ownerRole: string;
  expectedOutcome: string;
};
```

## Gemini Structured Output Requirement
Do not ask Gemini for loose prose.

The API response must be strict JSON matching the diagnostic result shape.

Gemini must be instructed to:
1. Use only evidence found in the transcript.
2. Extract direct evidence quotes before scoring.
3. Map each quote to a framework criterion.
4. Assign a score from 0 to 100.
5. Provide a confidence score from 0 to 1.
6. Avoid inventing facts.
7. Mark unknown or unsupported criteria as low confidence.

## Gemini Prompt Template
Use a prompt similar to this in the backend.

```md
You are an expert management consultant performing a structured business diagnostic.

Analyse the transcript against these frameworks:
- Lean / Six Sigma
- Digital Maturity
- IT Resilience
- Balanced Scorecard
- Finance / ROI Maturity

Rules:
- Use only the transcript as evidence.
- Do not invent facts.
- Every score must include supporting evidence quotes.
- If evidence is missing, score cautiously and mark confidence low.
- Return strict JSON only.
- Do not include markdown outside the JSON.

Transcript:
{{TRANSCRIPT}}

Return this structure:
{
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
          "evidence": [
            {
              "quote": string,
              "speaker": "agent | user",
              "transcriptIndex": number
            }
          ],
          "rationale": string
        }
      ]
    }
  ],
  "risks": [
    {
      "title": string,
      "severity": "low | medium | high | critical",
      "description": string,
      "evidence": []
    }
  ],
  "recommendations": [
    {
      "title": string,
      "priority": "low | medium | high",
      "impact": "low | medium | high",
      "effort": "low | medium | high",
      "description": string
    }
  ],
  "roadmap": [
    {
      "phase": "0-30 days | 31-90 days | 3-6 months",
      "action": string,
      "ownerRole": string,
      "expectedOutcome": string
    }
  ]
}
```

## ElevenLabs Agent Behaviour
Create agent prompt templates for each business function.

### Finance Agent
Acts like a senior finance transformation consultant.

Probe for:
- Revenue visibility
- Cost control
- EBITDA awareness
- Forecasting
- Accounts receivable
- Budget ownership
- ROI governance
- Manual finance processes

### HR Agent
Acts like a senior people and operations consultant.

Probe for:
- Turnover
- Recruitment workflow
- Onboarding
- Culture issues
- Compliance
- Skills gaps
- HR system maturity
- Manual admin burden

### Sales Agent
Acts like a sales operations consultant.

Probe for:
- Pipeline visibility
- CRM usage
- Conversion rates
- Sales process consistency
- Forecast accuracy
- Lead sources
- Customer retention

### IT Agent
Acts like an IT resilience and digital maturity consultant.

Probe for:
- System availability
- Cyber controls
- Backup and recovery
- Incident response
- Integration gaps
- Manual workarounds
- Shadow IT

## Backend/API Requirements
Implement API routes or server actions for:

- `POST /api/diagnostics/start`
- `POST /api/diagnostics/:id/transcript`
- `POST /api/diagnostics/:id/analyse`
- `GET /api/diagnostics/:id`
- `GET /api/diagnostics`
- `POST /api/diagnostics/:id/export`

Use environment variables for:

```env
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID_FINANCE=
ELEVENLABS_AGENT_ID_HR=
ELEVENLABS_AGENT_ID_SALES=
ELEVENLABS_AGENT_ID_IT=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Never hardcode secrets.

## UI Requirements
The UI must feel:
- Enterprise
- Analytical
- Polished
- Consulting-grade
- Similar in structure and visual language to the Oracle mock in `Mocks`

Use:
- Sidebar navigation
- Top-level KPI cards
- Dense but readable dashboards
- Radar charts for framework maturity
- Bar charts for criteria scores
- Status badges
- Evidence panels
- Clear empty/loading/error states

Avoid:
- Toy chatbot design
- Overly playful colours
- Generic AI landing page style
- Unstructured text dumps

## States To Implement
Every major page must handle:
- Empty state
- Loading state
- Error state
- Success state

For Gemini processing, show staged loading messages:
- Cleaning transcript
- Extracting evidence
- Scoring frameworks
- Building recommendations
- Generating roadmap

## Mock Data Requirement
If APIs are not wired yet, create realistic mock data.

Mock data should include:
- At least 3 previous diagnostics
- One completed Finance diagnostic
- One HR diagnostic
- One IT diagnostic
- Full sample transcript
- Full sample Gemini result JSON

## Quality Requirements
- TypeScript preferred.
- Components should be modular.
- Keep API logic separate from UI components.
- Add validation around Gemini JSON parsing.
- Add graceful failure if the AI response is invalid.
- Ensure scores are always evidence-backed.
- Use UK English in UI copy.

## Acceptance Criteria
The build is complete when:

- The app has an Oracle-inspired enterprise dashboard look based on the `Mocks` file.
- A user can start a new diagnostic flow.
- A mock or live ElevenLabs voice session can produce a transcript.
- The transcript can be sent to Gemini for structured scoring.
- Results render across all five frameworks.
- Each score links back to transcript evidence.
- Recommendations and a 6-month roadmap are generated.
- Diagnostic history is available.
- The app works with mock data even before live API keys are configured.

## Suggested Build Order
1. Inspect the `Mocks` file and reproduce the Oracle-inspired layout language.
2. Build the app shell, navigation and dashboard pages.
3. Create mock diagnostic data.
4. Build the diagnostic results dashboard.
5. Add transcript and evidence review.
6. Add ElevenLabs integration wrapper.
7. Add Gemini analysis route.
8. Add database persistence.
9. Add export/reporting.
10. Polish states, validation and responsive behaviour.

## Final Instruction
Build this as a credible SaaS product for senior business users.

The platform should feel like a digital consulting diagnostic system: structured, evidence-led, analytical and commercially polished.
