# Oracle: Technical Specification (v0.5)

**Project:** Oracle — voice-first SME advisory platform
**Companion documents:** `oracle-product-spec.md`, `oracle-design-spec.md`
**Audience:** Claude Code (build agent) and developers
**Last updated:** May 2026

---

## 1. Purpose of this document

This is the buildable technical specification. It assumes the reader has the product spec for context, brand, and design language. Everything here is engineering-focused: architecture, data, integrations, code structure, and constraints.

Where the product spec says "George remembers the business," this document says how.

---

## 2. Architecture overview

### 2.1 High-level

```
[ Browser (React) ]
      |
      |--- Voice via WebRTC ---> [ ElevenLabs Conversational AI ]
      |                                |
      |                                |--- Tool calls (HTTPS) ---> [ Cloud Functions ]
      |                                                                   |
      |--- Reads/writes (Firestore SDK) -------------------------------> [ Firestore ]
      |--- Auth (Firebase SDK) ---------------------------------------> [ Firebase Auth ]
      |
      |--- API calls (HTTPS) --------------------------------------> [ Cloud Functions ]
                                                                          |
                                                                          |--- LLM calls --> [ Anthropic Claude API ]
                                                                          |--- Voice + RAG --> [ ElevenLabs (agents + knowledge base) ]
                                                                          |--- Notifications --> [ FCM / Email service ]
```

### 2.2 Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18+ with Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Component primitives | Shadcn/ui (heavily customised) + Radix |
| Animation | Framer Motion |
| Routing | React Router v6+ |
| Client state | Zustand |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Firebase (Firestore, Auth, Functions Gen 2, Storage, Hosting, FCM) |
| Voice | ElevenLabs Conversational AI |
| LLM | Anthropic Claude API |
| Semantic retrieval | ElevenLabs knowledge base (RAG enabled) — see Section 7 |
| Email | SendGrid (transactional) |
| Analytics | PostHog |
| Errors | Sentry |
| CI/CD | GitHub Actions → Firebase Hosting + Functions |

### 2.3 Hard constraints

- **Firebase only** for data. No Supabase, no Pinecone, no other databases.
- **UK region only.** Firestore and Functions in `europe-west2` (London).
- **No native mobile apps** for PoC. Web and mobile browser only.
- **No dark mode** for PoC.
- **No third-party integrations** for PoC (Xero, HubSpot, etc.).
- **No voice audio retention** unless user explicitly opts in.

---

## 3. Repository structure

Monorepo with the following layout:

```
oracle/
├── apps/
│   └── web/                    # React frontend (Vite)
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── lib/
│       │   ├── pages/
│       │   ├── stores/
│       │   └── types/
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   ├── agents/            # Agent tool endpoints
│   │   ├── extraction/        # Post-session processing
│   │   ├── reports/           # Board Pack generation
│   │   ├── scheduled/         # Cron jobs
│   │   ├── lib/               # Shared utilities
│   │   └── types/             # Shared types with frontend
├── packages/
│   └── shared/                # Shared TypeScript types
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
└── README.md
```

Shared TypeScript types live in `packages/shared` and are imported by both `apps/web` and `functions`.

---

## 4. Data model (Firestore)

### 4.1 Top-level collections

```
/users/{userId}                          # User account data
/businesses/{businessId}                 # Business root document
/businesses/{businessId}/profile/{...}   # Profile sub-collections
/businesses/{businessId}/sessions/{...}  # Session records
/businesses/{businessId}/transcripts/{...} # Transcript records
/businesses/{businessId}/embeddings/{...} # Embedding vectors
/businesses/{businessId}/cards/{...}     # Card of the moment
/businesses/{businessId}/reports/{...}   # Board Packs
/businesses/{businessId}/handoffs/{...}  # Valorem First handoffs
/businesses/{businessId}/commitments/{...} # Tracked commitments
/audit/{eventId}                         # Audit log for tool calls
```

### 4.2 TypeScript schemas

```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string; // matches Firebase Auth UID
  email: string;
  displayName: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  businessIds: string[]; // user can own one business in v0.1, array for future
  onboardingState: 'unverified' | 'verified' | 'intake_complete' | 'onboarding_in_progress' | 'onboarding_complete' | 'active';
  intake?: {
    companyName: string;
    sector: string;
    headcount: string;
    role: string;
    whatBroughtYouHere: string;
    completedAt: Timestamp;
  };
}

// packages/shared/src/types/business.ts
export interface Business {
  id: string;
  name: string;
  ownerId: string; // userId of the leader
  authorisedUsers: string[]; // for future multi-user, contains [ownerId] in v0.1
  createdAt: Timestamp;
  updatedAt: Timestamp;
  context: BusinessContext;
  status: 'trial' | 'active' | 'paused' | 'churned';
  trialEndsAt?: Timestamp;
  usage: {
    sessionsThisMonth: number;
    minutesThisMonth: number;
    monthResetAt: Timestamp;
  };
  // Per-business ElevenLabs resources (see Section 6: Context architecture)
  elevenLabs: {
    agents: {
      george: string;   // ElevenLabs agent ID for this business's George
      margot: string;
      iain: string;
      priya: string;
    };
    knowledgeBaseDocumentId: string;  // The one document containing this business's context
    promptVersion: string;             // Which prompt version these agents are running, e.g. 'george-v3'
    provisionedAt: Timestamp;
    lastSyncedAt: Timestamp;            // When the knowledge base document was last updated
  };
}

export interface BusinessContext {
  sector: string;
  subSector?: string;
  geography: string;
  headcount: string; // band: '10-25', '26-50', '51-100'
  turnoverBand?: string;
  yearFounded?: number;
  keyProductsServices: string[];
  ownershipStructure?: string;
  ambitions?: string; // agent-generated, editable
}

// packages/shared/src/types/profile.ts
export interface StrategicObjective {
  id: string;
  businessId: string;
  horizon: '12_month' | '3_year';
  title: string;
  description: string;
  owner?: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'complete';
  lastReviewedAt: Timestamp;
  agentNotes?: string;
  linkedRiskIds: string[];
  linkedOpportunityIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // 'user:{uid}' or 'agent:george' etc
  lastEditedBy: string;
  sourceSessionId?: string;
}

export interface Risk {
  id: string;
  businessId: string;
  title: string;
  description: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  priorityScore: number; // computed: likelihood * impact
  owner?: string;
  mitigationPlan?: string;
  reviewDate?: Timestamp;
  status: 'open' | 'mitigated' | 'accepted' | 'closed';
  agentCommentary?: string;
  insight?: InsightSchema; // embedded structured insight (see below)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastEditedBy: string;
  sourceSessionId?: string;
}

export interface Opportunity {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: 'growth' | 'efficiency' | 'capability' | 'market';
  estimatedValue: 'low' | 'medium' | 'high' | 'transformative';
  effort: 'low' | 'medium' | 'high';
  status: 'idea' | 'exploring' | 'committed' | 'in_progress' | 'realised' | 'dropped';
  owner?: string;
  linkedObjectiveIds: string[];
  agentCommentary?: string;
  insight?: InsightSchema; // embedded structured insight (see below)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastEditedBy: string;
  sourceSessionId?: string;
}

// The 11-field insight schema, embedded on risks and opportunities.
// Drives the analytical rigour behind Board Pack recommendations.
// See product spec Section 5.4.
export interface InsightSchema {
  observation: string;                                    // The pain point or finding
  evidence: string[];                                     // Specific examples
  impactArea: 'finance' | 'customer' | 'process' | 'people';
  rootCause: 'process' | 'system' | 'skills' | 'culture' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'one_off' | 'repeated' | 'systemic';
  financialImpactEstimate?: {
    type: 'lost_margin' | 'rework' | 'delay' | 'cashflow' | 'growth_foregone';
    magnitude: 'small' | 'meaningful' | 'material' | 'severe';
    annualEstimateGbp?: number; // only when defensible
  };
  strategicRelevance: 'growth' | 'efficiency' | 'resilience' | 'experience';
  recommendedAction: string;
  expectedBenefit: 'cost_saving' | 'revenue_growth' | 'risk_reduction' | 'capability_uplift';
  confidenceLevel: 'low' | 'medium' | 'high'; // based on evidence quality
}

export interface MaturityScore {
  id: string; // composite: businessId_dimension
  businessId: string;
  dimension: 'digital' | 'ai_readiness' | 'operational' | 'strategic_clarity' | 'risk' | 'commercial';
  score: 1 | 2 | 3 | 4;
  narrative: string;
  keyGaps: string[];
  recommendedNextSteps: string[];
  lastAssessedAt: Timestamp;
  updatedAt: Timestamp;
  lastEditedBy: string;
  sourceSessionId?: string;
}

// packages/shared/src/types/session.ts
export interface Session {
  id: string;
  businessId: string;
  userId: string;
  type: 'onboarding' | 'open' | 'scheduled_checkin' | 'deep_dive' | 'board_pack_walkthrough';
  status: 'in_progress' | 'completed' | 'abandoned' | 'errored';
  startedAt: Timestamp;
  endedAt?: Timestamp;
  durationSeconds?: number;
  agentsInvolved: string[]; // ['george', 'iain']
  summary?: string; // generated post-session
  topics: string[]; // extracted
  commitmentsCreated: string[]; // commitment IDs
  elevenLabsConversationId?: string;
  errorDetails?: string;
}

export interface Transcript {
  id: string; // matches sessionId
  businessId: string;
  sessionId: string;
  fullText: string;
  turns: TranscriptTurn[];
  createdAt: Timestamp;
}

export interface TranscriptTurn {
  speaker: 'user' | 'george' | 'margot' | 'iain' | 'priya';
  text: string;
  timestamp: Timestamp;
}

export interface Commitment {
  id: string;
  businessId: string;
  sessionId: string;
  description: string;
  dueDate?: Timestamp;
  status: 'open' | 'completed' | 'cancelled' | 'overdue';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface CardOfTheMoment {
  id: string;
  businessId: string;
  type: 'first_impressions' | 'overdue_commitment' | 'high_priority_risk' | 'stale_section' | 'check_in_prompt' | 'board_pack_ready' | 'handoff_suggestion';
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: string;
  generatedAt: Timestamp;
  expiresAt: Timestamp; // 24 hours after generation
  referencedRecordId?: string; // ID of the risk/commitment/etc it references
}

export interface BoardPack {
  id: string;
  businessId: string;
  generatedAt: Timestamp;
  monthLabel: string; // e.g. "May 2026"
  sections: BoardPackSection[];
  chartData: Record<string, unknown>; // chart-specific data
  status: 'draft' | 'published';
}

export interface BoardPackSection {
  key: 'executive_summary' | 'objectives' | 'top_risks' | 'opportunities' | 'maturity' | 'recommendations' | 'valorem_first';
  heading: string;
  bodyMarkdown: string;
  narrationText: string; // what George says when walking through it
}

export interface ValoremFirstHandoff {
  id: string;
  businessId: string;
  topic: string;
  reason: string;
  contextSummary: string;
  suggestedEngagement: string;
  status: 'flagged' | 'leader_reviewed' | 'callback_requested' | 'contacted' | 'closed';
  flaggedBySessionId: string;
  flaggedByAgent: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// packages/shared/src/types/embedding.ts
export interface EmbeddingChunk {
  id: string;
  businessId: string;
  sessionId: string;
  text: string;
  embedding: number[]; // 1024-dim for voyage-3
  metadata: {
    speaker: string;
    timestamp: Timestamp;
    topic?: string;
  };
}
```

### 4.3 Firestore indexes

Required composite indexes (defined in `firestore.indexes.json`):

```
businesses/{businessId}/risks      → (status, priorityScore desc, updatedAt desc)
businesses/{businessId}/opportunities → (status, estimatedValue, updatedAt desc)
businesses/{businessId}/commitments  → (status, dueDate asc)
businesses/{businessId}/sessions     → (status, startedAt desc)
businesses/{businessId}/cards        → (expiresAt desc, generatedAt desc)
```

### 4.4 Security rules

Multi-tenant from day one. Every business document carries `authorisedUsers`. Rules enforced:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /businesses/{businessId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.authorisedUsers;
      allow write: if request.auth != null
        && request.auth.uid in resource.data.authorisedUsers
        && request.auth.uid == resource.data.ownerId;
    }

    match /businesses/{businessId}/{document=**} {
      allow read: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/businesses/$(businessId)).data.authorisedUsers;
      allow write: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/businesses/$(businessId)).data.authorisedUsers;
    }

    match /audit/{eventId} {
      allow read, write: if false; // only Cloud Functions write to audit
    }
  }
}
```

Cloud Functions write via Admin SDK and bypass these rules where needed.

---

## 5. Authentication and onboarding state machine

### 5.1 User states

```
unverified → verified → intake_complete → agents_provisioning → agents_provisioned
                                                                       ↓
              onboarding_in_progress → onboarding_complete → active
```

State transitions:
- `unverified` → `verified`: user clicks email verification link
- `verified` → `intake_complete`: user submits 5-question intake form
- `intake_complete` → `agents_provisioning`: triggered automatically; Cloud Function calls `provisionAgentsForBusiness` (see Section 7.8)
- `agents_provisioning` → `agents_provisioned`: ElevenLabs agents and knowledge base document created; IDs written to Business document
- `agents_provisioning` → `intake_complete`: provisioning failed; can retry
- `agents_provisioned` → `onboarding_in_progress`: user starts onboarding session
- `onboarding_in_progress` → `onboarding_complete`: session ends successfully and post-processing completes
- `onboarding_in_progress` → `agents_provisioned`: session abandoned (user can resume)
- `onboarding_complete` → `active`: user opens Oracle for second time

### 5.2 What's permitted per state

| State | Can do | Cannot do |
|---|---|---|
| unverified | Resend verification email | Anything else |
| verified | Complete intake | Start session |
| intake_complete | Wait for provisioning | Start session, view profile |
| agents_provisioning | Wait (UI shows "Just a moment...") | Start session, navigate elsewhere |
| agents_provisioned | Start onboarding session | View profile (it's empty), manually edit |
| onboarding_in_progress | Resume session | Manually edit profile, generate Board Pack |
| onboarding_complete | View profile, start sessions | (none) |
| active | Everything | (none) |

### 5.3 Auth implementation

- Firebase Auth with Email/Password + Google SSO
- Email verification required before `verified` state
- Session timeout: 30 days
- `onAuthStateChanged` listener in React updates Zustand store

---

## 6. Voice layer (ElevenLabs Conversational AI)

### 6.1 Agent configuration

Four agents configured in ElevenLabs:

| Agent | Voice ID (TBD) | Underlying LLM | Tools |
|---|---|---|---|
| George | TBD (mature British male) | Claude Sonnet 4.6 | See 6.3 |
| Margot | TBD (British female 30s-40s) | Claude Haiku 4.5 | See 6.3 |
| Iain | TBD (Scottish male 50s) | Claude Haiku 4.5 | See 6.3 |
| Priya | TBD (British female 30s) | Claude Haiku 4.5 | See 6.3 |

**Model choice rationale:** George does the heavy reasoning (orchestration, synthesis), so Sonnet. Specialists are domain-focused with narrower scope, so Haiku for cost control.

### 6.2 Agent system prompt structure

Each agent's system prompt must include the following sections (Claude Code to draft full prompts; this is the required structure):

```
1. Persona description
   - Name, role, personality, voice character

2. Context loaded dynamically
   - Business profile summary (injected at session start)
   - Recent session summaries (last 3)
   - Open commitments
   - Top 3 risks, top 3 opportunities

3. Domain boundaries
   - What this agent will and won't discuss
   - When to defer to another specialist
   - When to defer to a human (Valorem First)

4. Refusal patterns
   - Legal advice: "I'd want you to talk to a solicitor on that one, but I can capture the question and we can come back to it."
   - Medical advice: similar pattern
   - HR firing/disciplinary: defer to qualified HR support
   - Specific financial/tax advice: defer to accountant

5. Tool usage rules
   - When to call tools vs when to just respond
   - Explicit confirmation before destructive operations
   - "I'm just going to add this to your risk register" style narration

6. Handoff rules
   - When to hand back to George (specialists)
   - When to invoke a specialist (George)
   - Exact handoff phrasing

7. Tone guidelines
   - Conversation style
   - What to do when leader is hesitant or quiet
   - Pacing
```

### 6.3 Tool definitions

All tools are HTTPS-callable Cloud Functions at `/api/agents/tools/{toolName}`. Authentication: JWT signed by Cloud Functions, validated on each call.

**George's tools:**
```typescript
- getBusinessProfile(businessId: string)
- getOpenCommitments(businessId: string)
- recordCommitment(businessId: string, description: string, dueDate?: string)
- flagForValoremFirst(businessId: string, topic: string, reason: string, suggestedEngagement: string)
- transferToSpecialist(specialistName: 'margot' | 'iain' | 'priya', context: string)
- endSession(summary: string, topics: string[])
- updateBusinessContext(businessId: string, updates: Partial<BusinessContext>)
```

**Margot (Strategy) tools:**
```typescript
- getStrategicObjectives(businessId: string)
- createObjective(businessId: string, objective: Partial<StrategicObjective>)
- updateObjective(objectiveId: string, updates: Partial<StrategicObjective>)
- linkObjectiveToRisk(objectiveId: string, riskId: string)
- transferBackToGeorge(handoffNote: string)
```

**Iain (Risk) tools:**
```typescript
- getRiskRegister(businessId: string)
- createRisk(businessId: string, risk: Partial<Risk>)
- updateRisk(riskId: string, updates: Partial<Risk>)
- closeRisk(riskId: string, reason: string)
- transferBackToGeorge(handoffNote: string)
```

**Priya (Digital & AI) tools:**
```typescript
- getMaturityScores(businessId: string)
- updateMaturityScore(businessId: string, dimension: string, score: number, narrative: string, gaps: string[], nextSteps: string[])
- createOpportunity(businessId: string, opportunity: Partial<Opportunity>)
- recommendValoremFirstEngagement(businessId: string, type: string)
- transferBackToGeorge(handoffNote: string)
```

### 6.4 Tool call authentication

Every ElevenLabs → Cloud Function call must include:
- `Authorization: Bearer {JWT}` header
- JWT signed by Cloud Functions when session starts
- JWT payload: `{ sessionId, businessId, userId, exp }` (expires 90 mins after session start)
- Shared secret: `ELEVENLABS_TOOL_SECRET` environment variable

Cloud Function validates the JWT and enforces that data access matches `businessId` in token.

### 6.5 Voice loop architecture

```
1. User taps orb → frontend requests session start
2. Cloud Function authenticates user (Firebase Auth)
3. Cloud Function loads business record, including elevenLabs.agents map
4. Cloud Function calls verifyAgentConfiguration(businessId) — see Section 7.8
   - If verification fails: session is NOT started; ops alert fires; user sees graceful error
5. Cloud Function assembles dynamic variables (see Section 7.5) — Tier B context
6. Cloud Function creates Session record (status: initiating)
7. Cloud Function signs JWT containing { sessionId, businessId, userId, agentIds, exp }
8. Cloud Function returns to frontend: { agentId (this business's George), dynamic_variables, jwt }
9. Frontend connects to ElevenLabs via WebRTC, targeting THIS business's George specifically
10. ElevenLabs runs the session: agent has only this business's knowledge base document attached
11. Conversation occurs; tool calls fire to Cloud Functions with JWT
12. Cloud Functions validate JWT on every call, enforce businessId scoping
13. Frontend listens for tool call results, animates profile updates
14. Agent handoffs (George → Margot etc.) target this business's Margot, not a shared one
15. User ends session or session times out
16. Frontend signals session end → Cloud Function marks session as completing
17. Post-session processing queued (see Section 8), which updates the knowledge base document
```

**Key isolation properties enforced by this architecture:**

- The agent ID Sarah's session targets is always Sarah's own George. It's looked up from Sarah's user record, not derived from any session parameter.
- That agent has only Sarah's knowledge base document attached. Even if the lookup somehow returned the wrong agent ID, the worst case is connecting to a different business's agent that has its own document attached — never a multi-tenant blended state.
- The pre-session verification step provides an additional check that the agent's current ElevenLabs configuration matches expectations.
- The JWT scopes all tool calls to Sarah's businessId. Even if ElevenLabs sent a tool call mentioning a different businessId, the Cloud Function would reject it.

### 6.6 Session limits (PoC)

Hard-coded limits to control cost during PoC while not constraining real engagement:

- **Maximum session length:** 60 minutes (hard cap, ElevenLabs auto-terminates)
- **Maximum sessions per business per month:** 12 (revised from 5; 5 was unrealistic for an engaged leader)
- **Soft warning at 8 sessions:** leader sees a non-blocking notice ("You've had a busy month with Oracle — let us know if you'd like to extend")
- **After 12 sessions:** card explains the limit, "Request more sessions" CTA contacts support; sessions can be granted on a per-business basis
- **Cooldown between sessions:** 5 minutes minimum (prevents accidental double-sessions)

Enforced in Cloud Function `startSession()` before voice loop initiates. Updates `business.usage` on session start, decrements on session error (so failures don't count).

### 6.7 Session lifecycle and resumption

Sessions have explicit states tracked in the `Session` document.

**Session state machine:**

```
initiating → in_progress → completing → completed
                ↓
              paused → in_progress
                ↓
              errored (terminal)
                ↓
              abandoned (terminal)
```

**Transitions:**

- `initiating → in_progress`: ElevenLabs confirms WebRTC connection established
- `in_progress → paused`: voice disconnection detected; frontend signals pause
- `paused → in_progress`: voice reconnection within 30s; resume same session
- `paused → abandoned`: 30s reconnection window exceeded; session marked abandoned
- `in_progress → completing`: leader or agent signals end; post-processing triggered
- `completing → completed`: post-processing finished successfully
- `in_progress → errored`: unrecoverable failure (Claude API down, Firestore failure)

**Resumption rules:**

- A `paused` session can be resumed within 30 seconds. After that, it becomes `abandoned` and a fresh session is created if the leader returns.
- Resumed sessions retain the same `sessionId`, transcript, tool calls, and any data already created
- A leader cannot have two `in_progress` sessions simultaneously; starting a new one closes any stale `paused` session

**Data integrity during pause:**

- The Cloud Function stores a checkpoint of the conversation state (last 5 transcript turns, active agent, last tool call) at the moment of disconnection
- On resume, ElevenLabs receives the checkpoint as part of the context pack so the agent has continuity
- Tool calls made before the pause persist; they're not rolled back

### 6.8 Tool call idempotency and concurrency

Every write tool call (create, update, delete) must be idempotent to handle ElevenLabs retries and network races.

**Pattern:**

- Every tool call from ElevenLabs includes an `idempotencyKey` in the request body (generated client-side by ElevenLabs SDK)
- Cloud Function checks if a `tool_call_{idempotencyKey}` document exists in Firestore
- If exists: return the cached result, do not re-execute the write
- If not: execute the write, then store the result keyed by `idempotencyKey` with 24h TTL
- TTL cleanup via scheduled job

**Concurrency:**

- Use Firestore transactions for any tool call that reads-then-writes (e.g. `updateRisk` reads current state, applies updates, writes back)
- Use Firestore document-level locks via `runTransaction` to prevent lost updates when an agent and leader edit the same record simultaneously
- Last-write-wins is acceptable for fields the leader explicitly edited (see Section 8.2 conflict resolution); agent writes never overwrite leader edits

### 6.9 Error and failure handling

| Failure | Handling |
|---|---|
| Voice connection drops mid-session | Frontend attempts reconnect for 30 seconds, shows "reconnecting" state via orb error state. Session transitions to `paused`. If reconnect succeeds: resume same session. If fails: session becomes `abandoned`, do not deduct from session count, leader sees recovery card on next visit. |
| Tool call fails (transient) | Agent receives error response, apologises naturally, retries once with exponential backoff (500ms, 1500ms). If retry succeeds: continue. If retry fails: continue conversation without the update, error logged to audit, surfaces in next card. |
| Tool call fails (permanent) | E.g. validation error — agent receives structured error, acknowledges to leader ("I couldn't capture that — can you say it differently?"), does not retry. |
| Claude returns malformed JSON during extraction | Retry once with stricter prompt explicitly stating the schema. If still fails: log error to `audit/{eventId}`, mark session as `completed` but set `extractionStatus: 'failed_manual_review'`. Pipeline continues with embeddings; profile changes that occurred via tool calls during session are preserved. |
| Claude API rate limited / unavailable | Tool calls return a friendly error; agent says "Give me a moment" and Cloud Function retries with exponential backoff. If down for >2 minutes: session enters degraded mode where George can continue conversation but cannot write to profile. |
| ElevenLabs unavailable | Show error state on canvas: "George is briefly unavailable. We'll let you know when he's back." Email user when service restored (via scheduled health check). |
| Microphone permission denied | Show inline help with browser-specific instructions. Offer text-input fallback for the session — orb still animates, leader types responses, George responds via voice. |
| Firestore unavailable | Frontend reads from local cache (TanStack Query); writes queue and retry on reconnect. Cloud Functions return 503; ElevenLabs tool calls retry per their backoff. |
| Webhook from ElevenLabs (session end) fails | Cloud Function exposes a manual completion endpoint as fallback; frontend signals session end if no webhook within 10s of disconnect. |

---

## 7. Context architecture

This section defines how each business's data reaches the voice agents. It is the most important architectural decision in the system. Get this wrong and you risk data leakage between businesses; get it right and the system is structurally safe.

### 7.1 The core principle: per-business agents

Each business has its own dedicated set of four ElevenLabs agents (their George, Margot, Iain, Priya) and their own dedicated knowledge base document. These resources are provisioned at onboarding and remain bound to that business for its lifetime.

A business's agents *only ever* have that business's knowledge base document attached. There is no document swapping per session, no concurrent multi-tenant sharing, no shared agents handling multiple businesses' sessions.

This is structural isolation. Even if a bug in Cloud Function code tried to route Sarah's session to Marcus's agents, the agents would still only have Marcus's document attached and the worst case is a failed session, not a data leak. The agent-to-document binding is the safety net beneath all the procedural safeguards.

### 7.2 The four context tiers

Each tier feeds the agents in a different way, used for different purposes:

| Tier | Mechanism | Capacity | Used for |
|---|---|---|---|
| Tier A: Persona and methodology | Base system prompt (~1,500 tokens) | Fixed per agent | Who the agent is, how it behaves, refusal rules, tool descriptions, framework methodology |
| Tier B: Per-session orientation | Dynamic variables at session start (~500 tokens) | Per conversation | Leader name, current date, today's priority item, opening context |
| Tier C: Per-business knowledge | RAG-indexed knowledge base document (20-50KB per business) | Per business | Full business profile, recent session summaries, top risks/objectives/opportunities, maturity scores |
| Tier D: Specific data lookups | Tool calls to Cloud Functions | Unbounded | Detailed transcripts, full registers, writes to profile |

The combined effect: the agent has a stable persona (Tier A), a fresh orientation each session (Tier B), comprehensive business knowledge available via RAG (Tier C), and the ability to look up anything specific on demand (Tier D).

### 7.3 ElevenLabs scaling notes

ElevenLabs' RAG-indexed knowledge base storage is roughly 100MB total per workspace on standard tiers. At 20-50KB per business document, this comfortably supports 2,000-5,000 businesses before reaching the enterprise plan conversation. The standard knowledge base limit (20MB / 300k characters) does not apply when RAG is enabled.

ElevenLabs does not charge per-agent fees. Creating four agents per business has no marginal cost — charges happen on voice minutes used.

The concurrency limit on the Pro tier is 20 simultaneous calls; higher on Scale and Business tiers. Account for this as the product scales.

### 7.4 The base system prompt (Tier A)

Lives in the agent definition. Versioned in code at `functions/src/agents/prompts/{agent}.v{n}.ts`. Contains:

- Persona description
- Voice and tone guidance
- Methodology references (frameworks the agent draws on, with explicit instruction never to name them to the leader)
- Domain boundaries
- Refusal patterns
- Tool descriptions and usage rules
- Handoff rules (when to invoke another specialist, when to hand back to George)
- Hard constraints

Target size: under 1,500 tokens. ElevenLabs documents that prompts over 2,000 tokens increase latency and cost; staying well under that headroom leaves budget for dynamic variable interpolation.

The base prompt is identical for every business running the same prompt version. It does NOT contain business-specific information. Business specifics come from Tier B and Tier C.

### 7.5 Dynamic variables (Tier B)

Passed at session start via the ElevenLabs SDK's `dynamic_variables` object. Interpolated into placeholders in the base system prompt.

**Required variables for every session:**

```typescript
{
  leader_name: string;            // "Sarah"
  leader_role: string;            // "Managing Director"
  business_name: string;          // "McTaggart Construction"
  business_one_liner: string;     // "A 45-person construction subcontractor in Glasgow specialising in social housing."
  current_date: string;           // "Friday, 22 May 2026"
  session_type: string;           // "open" | "scheduled_checkin" | "deep_dive" | "board_pack_walkthrough"
  todays_priority_item: string;   // The card of the moment as a one-sentence summary, or empty for routine sessions
  weeks_since_last_session: number;
}
```

**Optional variables (included when relevant):**

```typescript
{
  outstanding_commitment_count: number;
  open_high_priority_risk_count: number;
  recent_handoff_topic: string;   // If a Valorem First handoff was recently flagged
}
```

Budget: 500 tokens maximum total for all variables combined. The values must be pre-compressed. The Cloud Function that assembles them does the compression — long business descriptions become one-liners, lists become counts.

### 7.6 The knowledge base document (Tier C)

The primary mechanism for the agent knowing the business. One document per business, named by business ID. Updated continuously to reflect current state.

**Document structure:**

The document is structured prose, not JSON, optimised for RAG retrieval. ElevenLabs' retrieval performs better against natural language than structured data. Sections:

```markdown
# Business: {business_name}

## Overview
{one-paragraph summary of who they are, what they do, where they are, key products/services, headcount, ownership, geography}

## Ambitions and direction
{the leader's stated ambitions, 3-year objectives, where they want the business to go}

## Strategic objectives — 12 month
{for each 12-month objective: title, description, owner, status, agent notes, last reviewed date}

## Strategic objectives — 3 year
{same structure}

## Risks currently tracked
{for each open risk: title, description, likelihood and impact, owner, mitigation plan, status, severity from insight schema, evidence, recommended action, last reviewed date}

## Opportunities being explored
{for each opportunity: title, description, category, estimated value, effort, status, owner, linked objectives, agent commentary}

## Maturity assessment
{for each scored dimension: dimension name, score 1-4, narrative, key gaps, next steps, last assessed}

## Recent conversations
{for each of the last 12 session summaries, most recent first: date, summary in 50-100 words, topics, key decisions, commitments made}

## Open commitments
{list with description, who said it, when, due date if any, current status}

## Recent Valorem First handoffs
{any flagged handoffs in the last 90 days, with topic and context}

## How the leader prefers to be advised
{any captured preferences about communication style, frequency, what they want from these sessions}
```

**Sizing:**

- Minimum 500 bytes for RAG to be enabled. Initial documents for brand new businesses are padded with intake answers, the structured profile (even if empty fields), and an introductory paragraph about the business to clear the minimum.
- Typical size: 20-50KB depending on maturity. A leader with 6 months of sessions and a full profile sits around 30-40KB.
- Maximum practical size: keep under 100KB even for very active businesses. Compress older session summaries aggressively when the document grows; ancient commitments and closed risks can be dropped from the document entirely (Firestore retains them, but they don't need to be in the agent's working knowledge).

**Update triggers:**

The document is regenerated and pushed to ElevenLabs after any of these events:

1. A session ends (post-session processing updates the document with the new summary and any structural changes)
2. The leader manually edits the profile (Firestore trigger fires the update)
3. A scheduled job nightly (catches any missed updates and ensures freshness)
4. Onboarding completes (first real document replaces the padded placeholder)

**Indexing delay:**

ElevenLabs indexes RAG documents after upload. Indexing typically completes within seconds but may take longer for large updates. Two implications:

- A session starting immediately after a document update may not see the update if indexing isn't complete. Mitigation: Tier B (dynamic variables) carries the most critical recent context, so the agent never relies solely on Tier C for "what happened most recently".
- For mission-critical recent items (a commitment just made, a risk just flagged), the post-session pipeline pushes the update and waits for index confirmation before completing.

### 7.7 Tool calls (Tier D)

For everything Tier C doesn't cover — specific historical transcripts, the full risk register beyond what's in the document, writes to profile data. Defined in Section 6.3.

The agent decides when a tool call is needed. Typical pattern: "Let me have a look at that for you" → tool call → response → continues conversation.

### 7.8 The agent provisioning subsystem

A dedicated Cloud Functions module manages the lifecycle of per-business agents and knowledge base documents.

**Module:** `functions/src/elevenlabs/provisioning.ts`

**Functions:**

```typescript
// Called when a business completes intake
async function provisionAgentsForBusiness(businessId: string): Promise<void>

// Called whenever business data changes
async function syncKnowledgeBaseDocument(businessId: string): Promise<void>

// Called when account is deleted
async function deprovisionAgentsForBusiness(businessId: string): Promise<void>

// Called when George's (or any agent's) prompt version is updated globally
async function rolloutPromptUpdate(agentRole: AgentRole, newPromptVersion: string, businessIds?: string[]): Promise<void>

// Pre-session sanity check
async function verifyAgentConfiguration(businessId: string): Promise<{ ok: boolean; issues: string[] }>
```

**Provisioning flow (called from `provisionAgentsForBusiness`):**

1. Generate the initial knowledge base document from intake answers, padded to clear 500-byte minimum
2. Call ElevenLabs API to create the knowledge base document → store returned `documentId`
3. For each of the four agent roles (George, Margot, Iain, Priya):
   - Render the current prompt version for that role
   - Call ElevenLabs API to create the agent with: the rendered prompt, the document attached, the chosen voice, the LLM config, the tool definitions
   - Store the returned `agentId`
4. Write all five IDs (one document, four agents) to the Business document in Firestore in a single transaction
5. Mark business as `agents_provisioned` and ready for first session

**Idempotency and failure handling:**

- The function is idempotent: if it's called twice for the same business, it checks Firestore first. If agents are already provisioned, it returns the existing IDs.
- If provisioning fails partway through (e.g. 2 agents created, then ElevenLabs API errors), the function attempts to clean up the partial state on retry. If cleanup fails, manual intervention is logged and an alert fires.
- Provisioning runs asynchronously after intake completion. The leader sees a "Just a moment, getting things ready..." state while it completes (usually 5-10 seconds).

**Sync flow (called from `syncKnowledgeBaseDocument`):**

1. Read full business profile from Firestore
2. Generate the markdown document per the structure in 7.6
3. Call ElevenLabs API to update the document for this business (PATCH on the document ID)
4. Wait for index confirmation (with timeout — if not confirmed in 30s, log warning but continue)
5. Update `lastSyncedAt` on the Business document

Triggered by:
- Firestore triggers on changes to risks, objectives, opportunities, maturity scores, commitments
- Post-session processing pipeline
- Nightly scheduled job (catch-up)

To avoid hammering ElevenLabs' API on rapid changes, sync calls are debounced — multiple triggers within 60 seconds collapse to a single sync.

**Deprovisioning flow:**

1. Delete the knowledge base document
2. Delete each of the four agents
3. Clear the elevenLabs section of the Business document (preserved for audit)
4. Part of the GDPR data deletion workflow (Section 13.4)

**Pre-session verification:**

Before each session, `verifyAgentConfiguration(businessId)` is called as a safety check:

1. Fetches the business's expected `agentIds` and `knowledgeBaseDocumentId` from Firestore
2. Calls ElevenLabs API to fetch the actual configuration of each agent
3. Verifies: each agent exists, each agent has exactly one document attached, that document matches the expected ID
4. Returns `{ ok: true }` or `{ ok: false, issues: [...] }`

If verification fails, the session is not started. An alert is logged and ops are notified. This catches the rare case where the system has drifted from expected state due to a partial sync, manual edit, or other unexpected change.

### 7.9 Prompt versioning across the agent fleet

Because each business has their own agents, a prompt update isn't a single config change — it's an operation across the entire fleet.

**Version strategy:**

- Prompts are versioned in code: `george.v1.ts`, `george.v2.ts`
- The `promptVersion` field on each Business records which version their agents are running
- New businesses always get the latest version
- Existing businesses don't get updated automatically

**Rollout strategy:**

The `rolloutPromptUpdate` function:

1. Takes a target version and optionally a list of business IDs (default: all)
2. For each business: calls ElevenLabs API to update the agent with the new prompt
3. Updates `promptVersion` in Firestore
4. Runs with rate limiting to avoid hammering the API
5. Reports progress and any failures

Recommended rollout pattern for production:
1. Update the prompt for one internal test business first
2. Manually verify behaviour
3. Roll out to a 10% canary of real businesses
4. Wait 48 hours, monitor sessions for regressions
5. Roll out to the rest

For PoC: roll out to all at once is acceptable since the user base is small.

### 7.10 Memory layers (summary)

Pulling it all together:

| Layer | Stored in | Used for |
|---|---|---|
| Structured memory | Firestore profile collections | The authoritative current state of the business |
| Conversational memory | Firestore transcripts | Verbatim history, queryable post-session |
| Working knowledge for agents | ElevenLabs knowledge base document (per business) | What George knows about this business going into any session |
| Commitment memory | Firestore commitments collection | Things the leader said they'd do, tracked for follow-up |

There is no separate vector store or semantic search infrastructure. ElevenLabs' RAG layer handles semantic retrieval within the knowledge base document. For older conversations not in the current document, the structured profile and session summaries provide the lookup path.

### 7.11 Card of the moment generation

Generated by Cloud Function on login or via scheduled job. Cached for 24 hours per business.

**Priority cascade (return first match):**

1. If `onboarding_complete` and no previous card: `first_impressions` card
2. If any overdue commitment exists: `overdue_commitment` card referencing the most overdue
3. If any open risk with priority score >= 16 (4x4 or 5x5): `high_priority_risk` card referencing it
4. If any profile section has not been updated in >30 days: `stale_section` card
5. If 14+ days since last session: `check_in_prompt` card
6. If a Board Pack was generated in last 7 days and not yet viewed: `board_pack_ready` card
7. If any Valorem First handoff is in `flagged` status: `handoff_suggestion` card
8. Default: generic "Anything on your mind today?" card

Implementation: single Cloud Function `generateCardOfTheMoment(businessId)` returns the card. Cached for 24 hours; invalidated on relevant data changes (new commitment overdue, new risk created, etc.) via Firestore triggers.

---

## 8. Post-session processing

Triggered by session completion. Cloud Function pipeline:

### 8.1 Pipeline steps

```
1. Load full transcript from ElevenLabs API
2. Save transcript to Firestore
3. Generate session summary (Claude Sonnet)
   - 100-word summary
   - List of topics covered
   - Notable quotes (optional)
4. Extract structured updates (Claude Sonnet)
   - New risks created during session
   - New opportunities created
   - New objectives created or updated
   - Maturity score updates
   - Commitments stated by leader
5. Validate extractions against schema
   - If malformed: retry once with stricter prompt
   - If still malformed: log to audit, skip this extraction
6. Apply extractions to Firestore
   - Skip if record already created during session via tool calls (dedupe by sourceSessionId + similarity)
7. Generate embeddings for transcript chunks
8. Store embeddings in Firestore
9. Update business.usage stats
10. Trigger card-of-the-moment refresh
11. If first session: trigger 7-day check-in scheduling
12. Mark session as fully processed
```

### 8.2 Conflict resolution

When the same record is touched by tool call during session AND by post-session extraction:

- Tool call writes win for fields they touched
- Extraction can only add to fields tool calls didn't touch
- Track this via `lastEditedBy` and timestamps
- For risks/objectives/opportunities created via tool calls, extraction can append to `agentCommentary` but cannot modify other fields

When leader manually edits a field during a live session that an agent later tries to update:

- Leader edits win (last-write-wins on the field)
- Agent's intended update logged to audit but not applied
- Card surfaces this in next session: "I noticed you updated X — want to talk through that?"

### 8.3 Extraction prompt structure

Stored in `functions/src/extraction/prompts/`. Versioned in code. Schema:

```
SYSTEM: You are an extraction model. Given a transcript between an SME leader
and AI advisors, extract structured updates. Return ONLY valid JSON matching
the schema. No prose, no markdown, no commentary.

CONTEXT:
- Business profile summary: {summary}
- Existing risks: {risks_brief}
- Existing objectives: {objectives_brief}
- Existing opportunities: {opportunities_brief}

TRANSCRIPT:
{full_transcript}

SCHEMA:
{json_schema}

Return JSON.
```

If response is not valid JSON matching schema: retry once with `Your previous response was malformed. Return ONLY valid JSON. Here is the schema again: ...`

If second retry fails: log to audit, return empty extraction.

---

## 9. Board Pack generation

### 9.1 Trigger

Two paths:
- **Monthly cron:** 1st of each month at 06:00 UTC, generates for all active businesses
- **On-demand:** leader requests via voice ("George, can you generate a Board Pack for me?") or via UI button

### 9.2 Generation pipeline

```
1. Cloud Function loads:
   - Business profile (full)
   - Last 3 session summaries
   - Risk register snapshot (current + 30 days ago for movement)
   - Strategic objectives (current state)
   - Top opportunities
   - Maturity scores (current + previous if available)
   - Open Valorem First handoffs

2. Call Claude Sonnet with structured prompt:
   - Returns BoardPackSection[] with bodyMarkdown and narrationText per section
   - Returns chartData for radar chart and risk movement chart

3. Validate response against schema

4. Save BoardPack to Firestore (status: draft)

5. Promote to published

6. Trigger notification to leader (in-app card + email)
```

### 9.3 Fixed section structure

The Board Pack is structured around the Balanced Scorecard's four pillars, rendered as plain-language headings (see product spec Section 5 and design spec Section 7.1).

```typescript
const BOARD_PACK_SECTIONS = [
  { key: 'executive_summary', heading: 'The headline',                  bscPillar: null },
  { key: 'money',             heading: 'Money',                         bscPillar: 'financial' },
  { key: 'customers',         heading: 'Customers',                     bscPillar: 'customer' },
  { key: 'operations',        heading: 'How you run things',            bscPillar: 'internal_process' },
  { key: 'people',            heading: 'Your people',                   bscPillar: 'learning_growth' },
  { key: 'focus_this_month',  heading: 'What I\'d focus on this month', bscPillar: null }, // ROI-backed action plan
  { key: 'valorem_first',     heading: 'Where we might want help',      bscPillar: null }  // omitted if no handoffs
];
```

For PoC, the `money` and `people` sections render lighter content because the Finance specialist and People/Culture specialist are deferred to v1. Both sections should still appear in the structure, with placeholder content acknowledging the gap: "We'll get deeper into the financials when our finance specialist joins. For now, here's what we know." This keeps the Board Pack structurally complete and signals the v1 roadmap to the leader.

### 9.4 The "what I'd focus on this month" section (ROI-backed action plan)

This is the killer feature: a prioritised list of 3-5 specific moves the leader could make, with structured fields surfaced as editorial prose.

Each recommendation drawn from the insight schema fields on the relevant risks and opportunities:
- What to do (recommendedAction)
- Why now (severity, frequency)
- Expected benefit (expectedBenefit, financialImpactEstimate)
- Effort required (effort)
- Owner (suggested)
- Confidence (confidenceLevel)

Ranked by a composite score: `severity * confidenceLevel * (1/effort) * financialImpactWeight`.

### 9.5 Generation prompt

Stored in `functions/src/reports/prompts/board-pack.ts`. Versioned. Critical instructions:

- "Write in George's voice: warm, considered, direct, slightly British."
- "Each narrationText should be 2-3 sentences. The bodyMarkdown can be longer."
- "Lead with the most important thing. Do not bury the headline."
- "Organise content into four pillars: Money, Customers, How You Run Things, Your People. Use these plain-language labels — never reference 'Balanced Scorecard' or any framework name."
- "For recommendations: weave the insight schema fields into editorial prose. Never show the schema as a table. Each recommendation should answer 'what, why now, expected benefit, what it takes, confidence level' — but as a paragraph, not a checklist."
- "Never invent data. Only use what's in the context. If a pillar has thin data, acknowledge the gap honestly."
- "Never invent financial figures. If financialImpactEstimate has no annual estimate, describe impact qualitatively (e.g. 'material' rather than '£25k')."

---

## 10. Proactive check-ins

### 10.1 Scheduled job

Daily cron at 09:00 UTC (Cloud Scheduler triggering Cloud Function).

For each active business:

```
Identify triggers:
- Overdue commitments (any in 'open' status past dueDate)
- Stale critical sections (top risk not reviewed in 45+ days)
- 21+ days since last session
- Board Pack generated but not viewed in 7+ days
- Handoff flagged but not reviewed in 7+ days

For each trigger:
- Generate notification text (Claude Sonnet, short)
- Send via FCM (browser push) if enabled
- Send via SendGrid (email) as fallback
- Update card of the moment

Frequency limits:
- Maximum 1 notification per business per day
- Maximum 3 notifications per business per week
- If leader explicitly silences notifications: respect for 14 days
```

### 10.2 Notification preferences

User can set:
- Browser push: on/off
- Email: on/off (default on)
- "Pause for 7 days" quick action
- "Pause for 30 days" quick action

Stored on `user.notificationPreferences`.

---

## 11. Valorem First handoff

### 11.1 Trigger

Any agent calls `flagForValoremFirst()`. Cloud Function:

1. Creates `ValoremFirstHandoff` record (status: `flagged`)
2. Generates a context summary (Claude Sonnet, 200 words):
   - Why this was flagged
   - Relevant business context
   - What the agent suggests
3. Creates card of the moment for next leader login
4. Sends internal notification to Valorem First team:
   - Email to `handoffs@valoremfirst.com` (placeholder)
   - Slack webhook to `#oracle-handoffs` channel
   - Includes business name, topic, context summary, leader contact

### 11.2 Leader review flow

1. Leader sees handoff card on next login
2. Taps to view full handoff: agent reasoning, context, suggested engagement
3. Two actions: "Request a callback" or "Not now"
4. If callback: status → `callback_requested`, Valorem First notified again with urgency flag
5. If not now: status → `closed`, can be re-flagged later

---

## 12. Frontend implementation notes

### 12.1 Routing

```
/                          → Landing / login (unauthenticated)
/signup                    → Sign-up flow
/verify                    → Email verification waiting room
/intake                    → 5-question intake form
/welcome                   → First view post-intake; George introduces himself
/                          → Authenticated home (canvas)
/profile                   → Full business profile view
/profile/strategy          → Strategic objectives
/profile/risks             → Risk register
/profile/opportunities     → Opportunities
/profile/maturity          → Maturity scores
/profile/context           → Business context
/sessions                  → Session history
/sessions/:id              → Session detail with transcript
/reports/board-packs       → All Board Packs
/reports/board-packs/:id   → Single Board Pack
/handoffs                  → Valorem First handoffs
/settings                  → Account settings
```

### 12.2 Component organisation

```
apps/web/src/
├── components/
│   ├── ui/                # Shadcn primitives (button, card, dialog, etc.)
│   ├── orb/               # Orb + states + agent variants
│   ├── canvas/            # Canvas layout
│   ├── cards/             # Card of the moment, Board Pack cards
│   ├── profile/           # Profile section components
│   ├── reports/           # Board Pack renderer
│   └── voice/             # ElevenLabs WebRTC wrapper
├── features/
│   ├── auth/              # Sign-up, login, verification
│   ├── onboarding/        # Intake, welcome, onboarding session
│   ├── session/           # Active session UI
│   ├── profile/           # Profile views and editing
│   ├── reports/           # Board Pack views
│   └── handoffs/          # Valorem First handoff cards
├── lib/
│   ├── firebase.ts        # Firebase init
│   ├── elevenlabs.ts      # ElevenLabs client wrapper
│   ├── api.ts             # Cloud Functions client
│   └── utils.ts
├── stores/
│   ├── authStore.ts       # Zustand: auth state
│   ├── businessStore.ts   # Zustand: current business
│   └── sessionStore.ts    # Zustand: active session state
└── pages/
    └── ...
```

### 12.3 Orb implementation

Single component `<Orb agent={agent} state={state} />` where:
- `agent`: `'george' | 'margot' | 'iain' | 'priya'`
- `state`: `'idle' | 'listening' | 'speaking' | 'thinking' | 'handing_off'`

Built with:
- Two SVG circles (outer glow, inner core)
- Radial gradient per agent (predefined)
- Framer Motion controls scale and opacity per state
- For `speaking` state: subscribes to audio amplitude data from ElevenLabs SDK and animates scale based on amplitude
- For `handing_off`: cross-fade between agent gradients over 800ms

Performance: should run at 60fps on a 2019 MacBook Air and a mid-range Android browser. No Three.js, no WebGL.

### 12.4 Mobile voice handling

Specific constraints to handle:

- **iOS Safari mic permission:** must be requested from a user gesture. Tapping the orb counts; ensure the request fires on tap, not on page load.
- **Autoplay:** Safari blocks audio autoplay. ElevenLabs audio playback must be initiated from a user gesture.
- **Background tabs:** if user backgrounds the tab during a session, pause the session (don't continue recording). On return, prompt to resume or end.
- **Lock screen:** session pauses automatically when device locks. On unlock: resume prompt.

---

## 13. Observability

### 13.1 PostHog events

Required events (minimum viable set for PoC):

| Event | Properties |
|---|---|
| `user_signed_up` | method (email/google) |
| `user_verified_email` | - |
| `intake_completed` | sector, headcount |
| `onboarding_session_started` | - |
| `onboarding_session_completed` | duration_minutes |
| `onboarding_session_abandoned` | duration_minutes, reason |
| `session_started` | type, agent |
| `session_completed` | duration_minutes, agents_involved, topics |
| `session_errored` | error_type |
| `agent_handoff` | from_agent, to_agent |
| `profile_edited_manually` | section, field |
| `card_of_moment_clicked` | card_type |
| `board_pack_generated` | trigger (cron/on_demand) |
| `board_pack_viewed` | - |
| `board_pack_walkthrough_completed` | - |
| `valorem_first_handoff_flagged` | topic |
| `valorem_first_callback_requested` | - |
| `voice_permission_denied` | platform |

User properties: `business_sector`, `headcount`, `subscription_status`, `days_since_signup`.

### 13.2 Sentry

- Frontend: capture all unhandled errors, network failures, voice connection failures
- Cloud Functions: capture all exceptions, tag with `businessId` and `sessionId`
- Source maps uploaded on deploy

### 13.3 Audit log

**Audit log writes must NOT go to Firestore.** Firestore costs and quotas make this infeasible at the volume Oracle will produce (hundreds of writes per session). Use Google Cloud Logging with structured payloads.

**Implementation:**

```typescript
// functions/src/lib/audit.ts
import { Logging } from '@google-cloud/logging';
const log = new Logging().log('oracle-audit');

export async function auditLog(entry: AuditEntry): Promise<void> {
  const metadata = {
    resource: { type: 'cloud_function', labels: { function_name: process.env.K_SERVICE } },
    severity: entry.error ? 'ERROR' : 'INFO',
    labels: {
      businessId: entry.businessId,
      sessionId: entry.sessionId ?? '',
      type: entry.type,
      actor: entry.actor,
    },
  };
  await log.write(log.entry(metadata, entry));
}

interface AuditEntry {
  businessId: string;
  sessionId?: string;
  type: 'tool_call' | 'llm_call' | 'extraction' | 'board_pack' | 'session_event';
  actor: string;        // 'agent:george' | 'system' | 'user:{uid}'
  input?: object;       // PII-redacted (see 13.5)
  output?: object;      // PII-redacted
  durationMs: number;
  cost?: { tokensIn: number; tokensOut: number; estimatedUsd: number };
  error?: string;
  createdAt: string;    // ISO 8601
}
```

**Why Cloud Logging:**

- Free tier covers ~50GB/month (sufficient for PoC)
- Logs queryable via Logs Explorer with structured queries
- Native sinks to BigQuery for analytics, Pub/Sub for streaming, Cloud Storage for archive
- 30-day default retention; longer retention configured per requirement

**Retention:**

- Default: 30 days in Cloud Logging
- High-value events (security, errors, costs) sinked to BigQuery for 90-day retention
- Compliance archive: monthly export to Cloud Storage, 7-year retention, encrypted

### 13.4 Data retention policies (full table)

| Data | Default retention | User-controlled | Notes |
|---|---|---|---|
| Account data (User document) | While account active | Deletable on request | Hard-deleted within 30 days of deletion request |
| Business profile data | While account active | Deletable on request | Same as above |
| Transcripts (text) | 13 months rolling | User can delete per session | Allows for year-over-year context |
| Voice audio | Not retained by default | User can opt-in to retention (90 days) | Stored in Cloud Storage with encryption |
| Embeddings | While linked transcript exists | Inherits transcript retention | Auto-deleted with transcript |
| Audit logs (Cloud Logging) | 30 days | Not user-controlled (system) | Required for security/debugging |
| Audit logs (BigQuery archive) | 90 days | Not user-controlled | For analytics |
| Compliance archive (Cloud Storage) | 7 years | Not user-controlled | Encrypted, access-controlled |
| Session metadata | While account active | Deleted with account | Lightweight, used for usage tracking |
| Board Packs | While account active | User can delete per pack | Stored as Firestore documents |
| Cards of the moment | 24h expiry, auto-deleted | Not user-controlled | Ephemeral |
| Commitments | While `open`; 90 days after `completed/cancelled` | User can delete | Used for memory and follow-up |

User-initiated deletion processes via Cloud Function `requestDataDeletion(userId)`:
- Sets `User.deletionRequestedAt`
- Disables account login immediately
- Scheduled job (daily) hard-deletes all data 30 days after request
- Sends confirmation email at request and on completion
- Provides JSON export via `requestDataExport(userId)` within 24h

### 13.5 PII handling in transcripts and logs

Transcripts and audit logs may contain sensitive business information: client names, financial figures, employee names, personal details.

**Redaction in audit logs:**

- The full transcript is never written to audit logs
- Tool call inputs/outputs: PII fields (employee names, client names) are redacted to `[REDACTED]` before logging
- LLM call inputs/outputs: prompts logged with token counts only, content logged only at SHA-256 hash level for debugging
- Errors that include user input are sanitised before logging

**Redaction implementation:**

```typescript
// functions/src/lib/redact.ts
const PII_FIELDS = ['ownerName', 'employeeName', 'clientName', 'email', 'phone'];
export function redact<T>(obj: T): T {
  // Deep clone and replace PII field values with [REDACTED]
  // Plus regex-based redaction of email patterns, UK phone patterns
}
```

**Encrypted at rest:**

- Firestore: default encryption
- Cloud Storage (voice audio): customer-managed encryption keys (CMEK) for opt-in retained audio
- Cloud Logging: Google-managed encryption

**Access controls:**

- No human at Valorem First can read another business's transcripts without an explicit data access request from that business
- Internal Oracle team access is logged separately in a `data_access_log` (Cloud Logging) with reason and ticket reference
- Support team can read truncated audit logs for debugging, never transcripts

Retention of Cloud Logging entries: 30 days (default), with key entries sinked to BigQuery for 90 days as defined in 13.4.

### 13.6 Cost tracking

Cloud Function tags every Claude API call, ElevenLabs minute, and embedding generation with `businessId` and `sessionId` in the structured log entry.

Daily aggregation via a scheduled Cloud Function reads Cloud Logging entries (via Logs Explorer API or BigQuery sink), aggregates costs, writes a summary to Firestore at `/cost_aggregates/{date}/businesses/{businessId}`.

Metrics tracked:
- Cost per business per day
- Cost per session
- Cost per minute of voice
- Cost per Board Pack
- Cost per extraction
- Cumulative cost per business per month

**Internal admin dashboard** (not user-facing) at `/admin/costs`:
- Per-business cost breakdown
- Top 10 most expensive businesses
- Cost trend over time
- Cost-per-revenue ratio (when billing is wired)

### 13.7 Cost alert runbook

When a business exceeds cost thresholds, defined automatic actions:

| Threshold | Automatic action | Manual action required |
|---|---|---|
| Single session > £3 | Sentry warning, no user action | Investigate within 24h |
| Single session > £8 | Sentry error, no user action | Investigate same-day; review prompt efficiency |
| Daily cost > £15 | Sentry error, ops Slack ping | Investigate same-day |
| Daily cost > £30 | **Auto-disable session start for this business**; leader sees "We need to look into your account" card | Manual review and re-enable required |
| Monthly cost > £80 | Auto-disable + ops escalation | Conversation with leader; possible plan change |

Auto-disable does not affect read-only access (profile viewing, Board Pack reading); only new session creation is blocked.

---

## 14. Deployment and environments

### 14.1 Environments

| Env | Firebase project | Branch | URL |
|---|---|---|---|
| local | emulators only | local | localhost:5173 |
| dev | `oracle-dev` | `develop` | dev.oracle.app (placeholder) |
| staging | `oracle-staging` | `main` | staging.oracle.app |
| prod | `oracle-prod` | tagged releases | oracle.app |

### 14.2 CI/CD

GitHub Actions:
- On PR: lint, typecheck, run tests, build frontend, build functions
- On merge to `develop`: deploy to dev
- On merge to `main`: deploy to staging
- On tagged release `v*.*.*`: deploy to prod (manual approval gate)

### 14.3 Required environment variables

```
# Frontend
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ELEVENLABS_PUBLIC_KEY
VITE_SENTRY_DSN              # optional; Cloud Error Reporting used by default

# Cloud Functions
ANTHROPIC_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_TOOL_SECRET       # for JWT signing
SLACK_HANDOFF_WEBHOOK_URL
JWT_SIGNING_SECRET
SENTRY_DSN                   # optional
```

Notes:
- No Voyage AI key needed (RAG handled by ElevenLabs knowledge base)
- No SendGrid key needed for PoC (using Firebase Auth's built-in email for verification; proactive notification emails deferred)
- No PostHog key needed for PoC (using Cloud Logging events for the 5-user PoC scale)

Stored in Firebase Functions config and GitHub Actions secrets.

---

## 15. Testing strategy

Without explicit testing requirements, Claude Code will skip or improvise. This section defines what's mandatory.

### 15.1 Test layers

| Layer | Tool | Scope | When run |
|---|---|---|---|
| Unit (frontend) | Vitest + React Testing Library | Component logic, utilities, hooks | On save (watch), pre-commit, CI |
| Unit (functions) | Vitest | Pure functions, tool endpoint logic | Same |
| Integration (functions) | Vitest + Firebase emulators | Cloud Functions with real Firestore behaviour | CI only |
| E2E | Playwright | Critical user journeys | CI on PR, nightly on staging |
| Visual regression | Playwright + Percy (or Chromatic) | Design-system page snapshots | CI on PR |

### 15.2 Coverage requirements

- Tool endpoints: 80%+ coverage, including all error paths
- Extraction logic: 70%+ coverage with golden-file tests for prompt outputs
- Frontend components: 60%+ for shared components (orb, card of the moment, transcript), 40%+ overall
- E2E: at minimum these journeys covered:
  - Sign-up → email verify → intake → first session start
  - Onboarding session completion with at least 2 tool calls
  - Board Pack generation and walkthrough
  - Manual profile edit and verification it persists
  - Session reconnection after simulated disconnect

### 15.3 Mocking strategy

Voice and LLM calls are expensive. Tests must mock them.

**Mock layer for tests:**

```typescript
// functions/src/lib/llm.ts
export interface LLMClient {
  complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}

// Real implementation
export class AnthropicLLMClient implements LLMClient { ... }

// Test implementation
export class MockLLMClient implements LLMClient {
  responses: Map<string, LLMResponse> = new Map();
  setResponse(promptHash: string, response: LLMResponse): void { ... }
  async complete(prompt, options) {
    const hash = sha256(prompt);
    return this.responses.get(hash) ?? this.defaultResponse;
  }
}
```

Same pattern for ElevenLabs and email. Inject the client into functions via a factory; tests inject the mock.

**Determinism:**

- LLM responses in tests are fixed (not generated)
- Embeddings in tests are deterministic stubs (e.g. all-zero vectors with specific dimensions tagged)
- Timestamps controlled via clock-mocking (`@sinonjs/fake-timers`)
- IDs generated by injectable ID factory; tests use predictable IDs

### 15.4 Golden-file tests for prompts

Extraction and Board Pack generation prompts are critical and brittle. Use golden-file pattern:

- For each prompt: a fixture transcript + an expected JSON output
- Test runs the real prompt against the real LLM (in a dedicated CI job, not on every commit)
- Compares output structure against the golden file
- Fails if structure changes; manual review required to update the golden file

This catches regression in prompts during iteration.

### 15.5 CI gates

A PR cannot be merged unless:
- All unit and integration tests pass
- Coverage thresholds met
- TypeScript compiles with strict mode, no errors
- ESLint passes with no errors (warnings allowed but reported)
- Visual regression diffs reviewed (Percy/Chromatic)
- Build succeeds for both frontend and functions

Golden-file LLM tests run nightly, not per-PR, to avoid blocking on LLM API issues.

---

## 16. Local development setup

The first day of building should not be wasted on environment setup.

### 16.1 Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Firebase CLI (`npm i -g firebase-tools`)
- Google Cloud CLI (`gcloud`)
- Docker (for Firestore emulator's Java requirement, or use Java 11+ directly)

### 16.2 Setup script

Repo includes `scripts/setup.sh` that:
1. Installs pnpm dependencies in root, `apps/web`, `functions`, `packages/shared`
2. Copies `.env.example` to `.env` in each app
3. Pulls real env vars from 1Password or Doppler (developer adds vault access)
4. Initialises Firebase emulators with seed data
5. Builds shared types
6. Verifies all services start

Single command after clone: `pnpm setup`

### 16.3 Running locally

```bash
# Start all services
pnpm dev

# This runs:
# - Firebase emulators (Firestore, Auth, Functions, Storage)
# - Vite dev server on :5173
# - Functions watch mode
# - Shared types watch mode
```

### 16.4 Real vs mocked services in local dev

| Service | Local default | Override |
|---|---|---|
| Firebase | Emulators (free, offline) | Connect to `oracle-dev` project if testing real network behaviour |
| ElevenLabs | Real with dev credit cap | Mock via `MOCK_ELEVENLABS=true` env var (uses pre-recorded responses) |
| Claude API | Real with low rate limit | Mock via `MOCK_LLM=true` (returns fixtures) |
| Email (Firebase Trigger Email or simple SMTP) | Mailpit (local SMTP catcher) | Real only on staging+ |
| Error reporting | Cloud Error Reporting (free) or Sentry free tier | Active in staging+ |

`MOCK_LLM=true` is the default in `.env.example` to keep development costs at zero. Developers turn on real services when testing voice loops.

### 16.5 Data seeding

Script: `scripts/seed.ts` populates the local Firestore emulator with realistic data:

- 3 demo businesses (one construction SME, one manufacturer, one professional services)
- Each with 5-15 risks, 3-8 objectives, 4-10 opportunities, full maturity scores
- 5-10 historical sessions per business with transcripts and embeddings (deterministic stubs)
- A draft Board Pack ready to view
- One pending Valorem First handoff
- Realistic timestamps spanning 6 months of history

Run: `pnpm seed`

Re-seeding clears existing emulator data and starts fresh. Production seeding is separately gated and requires explicit approval.

### 16.6 Test users

Seed creates three test users with known credentials (documented in repo README):
- `sarah@demoshipping.test` — onboarding completed, active for 3 months
- `marcus@maker.test` — onboarded yesterday, no follow-up sessions
- `priya@professional.test` — abandoned during intake, partial state

These cover the three main UX states to test against.

---

## 17. Sample George system prompt (template)

Claude Code should not invent the system prompts from scratch. This is the template for George's prompt; specialists follow the same structure with domain-specific replacements.

```
You are George, a fractional business advisor working with the leader of a small or medium-sized enterprise. You speak with warmth, calm, and considered care. You are a senior advisor — think a trusted family GP, not an excited startup founder.

# Your role

You orchestrate conversations across three specialists: Margot (Strategy), Iain (Risk), and Priya (Digital & AI). You handle every conversation's opening and close. When a topic needs depth, you bring in the relevant specialist with a clear handoff. When they're done, they hand back to you.

# Who you're talking to

- Name: {{leaderName}}
- Role: {{leaderRole}}
- Business: {{businessName}}, a {{businessSector}} company with {{headcount}} people.

# What you already know

You have a running understanding of this business. Below is the current context:

## Business summary
{{businessSummary}}

## Recent sessions
{{recentSessionSummaries}}

## Open commitments from the leader
{{openCommitments}}

## Top risks currently tracked
{{topRisks}}

## Top opportunities currently being explored
{{topOpportunities}}

## Items needing the leader's attention
{{flaggedItems}}

The current date is {{currentDate}}.

# How you behave

- Speak in measured, warm, conversational British English. Avoid Americanisms ("awesome", "reach out", "let me circle back").
- Keep sentences medium length and well-formed. You don't rush.
- Use the leader's name occasionally, not constantly.
- When you don't know something, say so. Never invent business facts.
- When the leader mentions something concrete (a number, a name, a date), capture it via a tool call.
- Before adding something to their records, narrate what you're doing briefly: "I'll add that to your risk register — supplier concentration with Acme."

# The methodology behind you (never named to the leader)

You and the specialists draw on established consulting frameworks to structure how you think and what you ask. Behind the scenes you reference:
- OGSM and Hedgehog Concept (for strategy and direction)
- Balanced Scorecard (for synthesis across money, customers, operations, people)
- Ansoff Matrix and Boston Matrix (for growth options)
- Business Model Canvas (for understanding the business)
- The 11-field insight schema (for structuring every observation: pain point, evidence, impact area, root cause, severity, frequency, financial impact, strategic relevance, recommended action, expected benefit, confidence level)

You NEVER mention these by name to the leader. They are your hidden method. The leader hears you ask thoughtful, structured questions and offer considered observations. They do not hear "let's apply the Hedgehog Concept" or "based on the Balanced Scorecard...". The frameworks make you rigorous; the conversation stays plain-spoken.

If a leader explicitly asks "what framework are you using?", you can say something like: "We're drawing on the same kind of structured approach a senior consultant would use, covering money, customers, how you run things, and your people in a coordinated way. Happy to go into more detail if it's useful."

# When to bring in a specialist

- For strategic objectives, growth questions, decision frameworks: bring in Margot.
- For risk identification, mitigation, or resilience: bring in Iain.
- For technology, AI, digital maturity, automation: bring in Priya.

Use this phrasing: "Let me bring in {{name}} for this." Then call `transferToSpecialist({{specialistName}}, {{context}})`.

# When to refuse

You decline to give:
- Specific legal advice (defer to solicitor): "I'd want you to talk to a solicitor on that one, but I can capture the question and we can come back to it."
- Medical advice (defer to qualified professional)
- HR firing/disciplinary advice (defer to HR support): "That's the sort of thing where you'd want proper HR support — happy to flag it for follow-up."
- Specific financial or tax advice (defer to accountant)

When declining, always offer to capture the question for follow-up so the leader doesn't feel dismissed.

# When to flag for Valorem First

When a topic exceeds your remit (implementation work, change management, technical delivery, deep domain consulting), flag it. Use `flagForValoremFirst()` with a clear reason. Examples:
- Procore or ERP implementation
- Change management for a transformation programme
- Technical due diligence
- Detailed financial modelling beyond high-level advisory

Phrasing: "This is past where I can help on my own. Worth a proper conversation with the Valorem First team. I'll flag it for them."

# Tone guidelines

- Calm: nothing is urgent enough to panic.
- Considered: pause before answering. It's okay to take a beat.
- Warm: the leader is a person, not a user.
- Honest: don't pretend to know things you don't.
- Concise: respect their time. Long answers are rarely better.

# Conversation patterns

- Opening (first message): warm greeting, brief reference to context if relevant, open question.
- During: ask follow-up questions. Don't lecture.
- When silent (3+ seconds): rephrase or offer a new angle, don't fill silence with filler.
- Closing: summarise what was covered, mention any commitments captured, hand off cleanly.

# Tools available

{{toolDefinitions}}

# Hard constraints

- Never disclose the underlying LLM, vendor names, or technical implementation.
- Never claim to be human if directly asked.
- Never invent business facts not in your context.
- Never give a strong opinion that contradicts the leader without humility.
- Never end a session without a closing acknowledgement.
```

**Notes for Claude Code:**

- The `{{placeholders}}` are filled by the context pack assembly function (Section 7.2)
- The prompt is versioned in `functions/src/agents/prompts/george.v1.ts`
- Iteration on the prompt happens by versioning (v2, v3, etc.), not in-place edits
- A/B testing of prompts is supported via the feature flag system (Section 20)

---

## 18. Data seeding and migrations

### 19.1 Migration framework

Even at PoC scale, schemas evolve. A migration framework is required from day one.

**Implementation:**

```
functions/src/migrations/
├── 001-initial-schema.ts
├── 002-add-business-status.ts
├── 003-rename-objective-fields.ts
└── registry.ts
```

Each migration:
- Has an ordered ID (`001`, `002`, ...)
- Exports an `up()` function that performs the migration
- Idempotent: can run multiple times safely
- Tracked in Firestore `/migrations/{migrationId}` (records when it ran)

Migrations run on Cloud Function deploy. The `runMigrations()` function:
1. Loads all migrations from the registry
2. Checks which have already run (per environment)
3. Executes pending ones in order
4. Records success/failure

**Migrations are forward-only for PoC.** No rollbacks. If a migration goes wrong, restore from backup (Section 21).

### 19.2 Backfill scripts

Schema changes that need backfilling existing data:

```typescript
// functions/src/migrations/004-backfill-priority-scores.ts
export const id = '004';
export const description = 'Compute priorityScore for existing risks';
export async function up() {
  const businesses = await getAllBusinesses();
  for (const business of businesses) {
    const risks = await getRisks(business.id);
    for (const risk of risks) {
      if (!risk.priorityScore) {
        await updateRisk(risk.id, { priorityScore: risk.likelihood * risk.impact });
      }
    }
  }
}
```

Backfills run in batches with rate limiting to avoid quota issues.

---

## 19. Feature flags

### 20.1 Why flags from day one

Without feature flags from the start, every change is binary on/off. Bad for safe rollout, A/B testing, and gradual feature ramp.

### 20.2 Implementation

Use **GrowthBook** (self-hostable, free tier, no external dependency to lock in) or **Firebase Remote Config** (native to Firebase, simpler).

**Recommendation for PoC:** Firebase Remote Config. It's integrated, requires no additional vendor, and is sufficient for PoC needs. Migrate to GrowthBook if A/B testing complexity grows.

### 20.3 Flag pattern

```typescript
// Shared between frontend and functions
import { getFlag } from '@oracle/shared/flags';

// Server-side
const enableBoardPackV2 = await getFlag('board_pack_v2', businessId);

// Client-side
const { value: showHandoffCard } = useFeatureFlag('show_handoff_card');
```

Flags follow a naming convention: `feature_name`, lowercase with underscores. Each flag has:
- Default value (off, until explicitly turned on)
- Targeting rules (per business, per user, percentage rollout)
- Owner and description in code
- Expected removal date (no zombie flags)

### 20.4 Initial flags for PoC

| Flag | Purpose | Default |
|---|---|---|
| `agent_handoff_enabled` | Allow George to invoke specialists | On |
| `board_pack_auto_monthly` | Auto-generate monthly Board Packs | On |
| `proactive_checkins_enabled` | Allow scheduled check-in notifications | On |
| `voice_audio_retention_opt_in` | Show audio retention opt-in setting | Off |
| `valorem_first_handoff_enabled` | Enable VF handoff flow | On |
| `text_input_fallback` | Allow text input when mic denied | On |
| `george_prompt_version` | Which George prompt version to use | `v1` |
| `extraction_strict_mode` | Use stricter extraction prompt | Off (A/B test) |

---

## 20. Reliability: rate limiting, backup, disaster recovery

### 21.1 Rate limiting

Cloud Functions are exposed and need protection.

**Per-user limits (enforced in Cloud Functions via Firestore counters):**

- Session start: 1 per 5 minutes (cooldown)
- Tool calls: 60 per minute per session (well above legitimate use)
- Profile edits: 30 per minute (manual UI edits)
- Board Pack generation: 1 per hour (on-demand)
- Data export: 1 per 24 hours
- Data deletion: 1 per account lifetime (rate not relevant)

**Per-business limits:**

- Total cost: see cost runbook (Section 13.7)
- Session count: see session limits (Section 6.6)

**Global limits (across all users):**

- Firebase Functions concurrency: max 100 instances during PoC
- Claude API: bound by Anthropic's account-level rate limits

When a limit is hit, return HTTP 429 with `Retry-After` header. Frontend handles gracefully with appropriate error state.

### 21.2 Backup

**Firestore:**
- Daily scheduled exports to Cloud Storage bucket `oracle-{env}-backups`
- Exports stored encrypted with CMEK
- Retention: 30 days for daily, plus monthly snapshots retained 12 months
- Restoration tested quarterly (documented runbook required)

**Cloud Storage (voice audio if retained):**
- Cross-region replication to a backup bucket
- Same encryption and retention

**Cloud Functions code:**
- Source of truth is the GitHub repo; tagged releases for prod deploys
- Container images cached in Artifact Registry for 90 days

### 21.3 Disaster recovery

**Defined recovery scenarios:**

| Scenario | Recovery time objective | Recovery point objective | Process |
|---|---|---|---|
| Firestore data corruption (single business) | 1 hour | 24 hours (last backup) | Restore single business document tree from backup |
| Firestore data corruption (broad) | 4 hours | 24 hours | Restore from latest backup to a new project, swap |
| ElevenLabs prolonged outage | N/A (no recovery) | N/A | Graceful degradation: read-only profile access, email notification to leaders |
| Anthropic API prolonged outage | N/A | N/A | Same as above |
| Region-wide GCP outage | Wait for restoration | N/A | Status page communication; UK-only deployment so no multi-region failover for PoC |

**Recovery testing:**
- Quarterly drill: restore from backup to a sandbox project, verify integrity
- Documented runbook updated with each drill

### 21.4 SLA targets (internal, not customer-promised)

For PoC, no formal SLA. Internal targets:

- Frontend availability: 99.5%
- Cloud Functions availability: 99.5%
- Voice loop availability (depends on ElevenLabs): 99%
- Mean time to acknowledge incident: 1 hour during business hours
- Mean time to recovery: 4 hours during business hours

After PoC and with paying customers: formal SLA defined.

---

## 21. Design-system-to-Tailwind bridge

The design spec defines tokens; this section defines how they reach Tailwind.

### 22.1 Token source of truth

```
packages/shared/src/design-tokens.css
```

All CSS custom properties (colours, type, spacing, radius, shadow, motion) live here as the single source of truth. The file is imported into both the frontend and the email templates.

### 22.2 Tailwind config

`apps/web/tailwind.config.js` consumes the CSS variables:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        'ink-2': 'var(--color-ink-2)',
        teal: 'var(--color-teal)',
        // etc
      },
      fontFamily: {
        display: 'var(--font-display)',
        text: 'var(--font-text)',
        ui: 'var(--font-ui)',
      },
      spacing: {
        // generated from --space-* tokens
      },
      borderRadius: {
        // generated from --radius-* tokens
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        s: 'var(--shadow-s)',
        m: 'var(--shadow-m)',
        // etc
      },
      transitionTimingFunction: {
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'organic': 'var(--ease-organic)',
      },
    },
  },
  // Disable default Tailwind palette to force token usage
  corePlugins: {
    // selectively keep utility classes that don't conflict
  },
};
```

### 22.3 Component documentation

Storybook (`apps/web/.storybook/`) renders every component with all states. Required:
- Each component has a `.stories.tsx` file alongside it
- Stories cover idle, hover, focus, disabled, error states
- Each story includes accessibility checks via `@storybook/addon-a11y`
- Storybook deployed to a static URL on each commit (Vercel or Netlify free tier)

This replaces the `/dev/design` route from the design spec — Storybook is more powerful and is the standard for component documentation.

---

## 22. Build phases (revised)

### Phase 0: Foundations (Week 1, with stretch into Week 2)
- Repo setup (monorepo, TypeScript strict, ESLint, Prettier, pnpm)
- Local dev setup script (`scripts/setup.sh`)
- Firebase projects created (dev, staging, prod) in `europe-west2`
- Frontend skeleton with routing, Tailwind, Shadcn
- Cloud Functions skeleton with shared types and DI pattern for LLM/ElevenLabs clients
- Firestore data model + security rules deployed
- Migration framework scaffolded (Section 18)
- Feature flag system wired (Section 19)
- Design tokens CSS file and Tailwind config bridge (Section 21)
- Storybook initialised
- CI/CD with unit test gates
- Mock services for local development (`MOCK_LLM=true` etc.)
- Seed script with 3 demo businesses (Section 16.5)
- Auth flows (sign-up, verify, login, intake form)

### Phase 1: Design system and orb (Week 2)
- All design tokens implemented and visible in Storybook
- Orb component with all states and agent variants (highest-risk component)
- Card of the moment renderer (all 7 types as stories)
- Buttons (3 variants), profile section nav, transcript display
- Visual regression baseline established (Percy/Chromatic)
- Canvas layout (desktop + mobile)
- Profile shell pages (empty states)

### Phase 2: Voice loop foundation and agent provisioning (Week 3)
- Agent provisioning subsystem (Section 7.8): create per-business agents and knowledge base documents via ElevenLabs API
- Knowledge base sync subsystem: regenerate and push per-business document on data changes
- Pre-session verification check
- George agent template prompt finalised and provisionable
- Session start/stop from orb with state machine
- Live transcript display with STT-reality handling
- JWT auth for tool calls with businessId scoping
- Tool call idempotency layer (Section 6.8)
- One tool working end-to-end (`createRisk`)
- Session resumption logic (Section 6.7)
- Audit logging via Cloud Logging (Section 13.3)

### Phase 3: Business profile and full agent network (Week 4)
- All 5 profile sections built with editorial design
- All agent tools implemented with idempotency
- Margot, Iain, Priya prompt templates finalised and provisioned per business
- Agent handoffs working with visual orb transitions
- Manual edit flows with conflict resolution
- "Expand with AI" actions on text fields
- Profile update micro-animations during voice

### Phase 4: Memory, post-processing, retention (Week 5)
- Session transcript storage with PII redaction in logs
- Post-session extraction pipeline with golden-file tests
- Knowledge base document update pipeline (post-session sync)
- Card of the moment logic (full priority cascade)
- Commitment tracking and overdue detection
- Data retention policies implemented (Section 13.4)
- Data export and deletion endpoints (GDPR compliance) including ElevenLabs agent and document deletion

### Phase 5: Reports, proactive layer, notifications (Week 6)
- Board Pack generation pipeline with structured prompt
- Vertical scroll narrative renderer with walkthrough sync
- Scheduled check-in job with frequency limits
- Browser push notifications (FCM)
- Email notifications (basic Firebase Auth verification email plus Board Pack ready email)
- Email design implementation per design spec Section 10.6

### Phase 6: Reliability and polish (Week 7)
- Valorem First handoff flow
- Onboarding session script implementation
- Comprehensive error states (Modes A, B, C from design spec)
- Loading states across all async operations
- Empty/pre-onboarding canvas state
- Observability complete (Cloud Logging events, error monitoring, structured logs)
- Cost tracking admin dashboard
- Cost alert runbook implemented (Section 13.7)
- Rate limiting on all endpoints (Section 20.1)
- Session limits enforcement
- Mobile voice handling (iOS Safari, Chrome Android)
- Print styles for Board Pack
- Favicon, OG image, app meta

### Phase 7: Testing and hardening (Week 8)
- E2E test suite for critical journeys
- Visual regression coverage for key components
- Golden-file tests for extraction and Board Pack prompts
- Multi-tenant isolation test suite: verify per-business agent isolation, knowledge base isolation, JWT scoping
- Disaster recovery drill (restore from backup to sandbox)
- Security audit of Firestore rules with negative tests
- Load test of Cloud Functions (modest target: 10 concurrent sessions)
- Documentation in repo README and ops runbooks

### Phase 8: UAT (Week 9+)
- 3–5 SME leaders tested
- Bug fixes and iteration
- Cost model validation
- Success criteria evaluation

**Realistic total: 9-12 weeks full-time.** Part-time alongside other work: double or triple.

---

## 23. Definition of done

For PoC ship:

**Functional:**
- [ ] All Phase 0–7 items complete
- [ ] 5 SME leaders successfully onboarded end to end
- [ ] Average session duration tracked and within cost model
- [ ] Cost per user per month measured and reported (under £40 target)
- [ ] Mobile voice tested on iOS Safari and Chrome Android
- [ ] Board Pack generation tested with 3 different business profiles
- [ ] Valorem First handoff tested with internal team
- [ ] Email templates rendered correctly across Gmail, Apple Mail, Outlook
- [ ] Print styles work for Board Pack on A4

**Technical:**
- [ ] All listed PostHog events firing
- [ ] Sentry capturing errors with zero uncaught exceptions in 24h smoke test
- [ ] Security rules tested with negative cases (user A cannot read user B's data)
- [ ] All session limits enforced and tested
- [ ] Rate limiting verified with abuse testing
- [ ] Backup restoration tested via DR drill
- [ ] Cost alerts trigger correctly at all thresholds
- [ ] Audit log queryable in Cloud Logging
- [ ] Data export and deletion endpoints tested

**Quality:**
- [ ] Unit test coverage meets thresholds (Section 15.2)
- [ ] E2E tests passing for all critical journeys
- [ ] Visual regression baseline established
- [ ] No outstanding P0 or P1 bugs
- [ ] Storybook published with all components
- [ ] Design spec visual-quality checklist passes for all screens shipped

**Documentation:**
- [ ] README in repo covers setup, dev, deploy
- [ ] Architecture decisions documented (ADRs)
- [ ] Ops runbooks: incident response, cost alerts, DR
- [ ] User-facing help content drafted for support inbox

---

## 24. Pre-build checklist (do before Claude Code starts)

These tasks are blockers for Claude Code beginning Phase 0. Complete them first:

1. [ ] Create Anthropic API account, request appropriate rate limits
2. [ ] Create ElevenLabs account, audition voices for George, Margot, Iain, Priya. Verify the workspace plan provides sufficient RAG knowledge base capacity (target 100MB+) and adequate concurrency for PoC use
3. [ ] Create Sentry account (or confirm using GCP Cloud Error Reporting; both work)
4. [ ] Create three Firebase projects (`oracle-dev`, `oracle-staging`, `oracle-prod`) in `europe-west2`
5. [ ] Provision a GCP billing account with budget alerts at £100, £500, £2000
6. [ ] Acquire commercial font licences (Tiempos, Söhne) or commit to high-quality free fallbacks (Source Serif Pro, Inter)
7. [ ] Register a placeholder domain (Oracle is not the final brand name)
8. [ ] Create a GitHub repo with branch protection rules
9. [ ] Set up 1Password or Doppler vault for shared secrets
10. [ ] Create internal Slack channel for handoff notifications
11. [ ] Identify 5 SME leaders willing to do UAT in week 9+
12. [ ] Engage legal counsel for ToS, Privacy Policy, DPA review before launch

**Deferred from PoC:** Voyage AI account (RAG handled by ElevenLabs), SendGrid (using Firebase Auth's built-in email plus deferred proactive emails), PostHog (using Cloud Logging events for 5-user PoC scale)

---

*End of technical specification.*
