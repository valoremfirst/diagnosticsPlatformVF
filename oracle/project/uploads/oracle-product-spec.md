# Oracle: Product Specification (v0.4)

**Project:** Oracle — a voice-first fractional business consultant for SMEs
**Owner:** Valorem First
**Status:** Product specification for proof-of-concept
**Last updated:** May 2026
**Companion documents:** `oracle-technical-spec.md`, `oracle-design-spec.md`

---

## 1. Product overview

### 1.1 What Oracle is

Oracle is a SaaS platform that acts as a fractional business consultant for SME leaders. It is voice-first: leaders interact primarily by speaking with an AI advisor named George, supported by a team of specialist agents covering strategy, risk, and digital/AI maturity. George remembers the business, surfaces what matters, and produces consultant-grade outputs on demand.

Oracle sits beneath Valorem First's human consulting. When things get complex, the platform recommends a Valorem First engagement.

### 1.2 The proposition

SMEs can't afford a retained strategy consultant, a fractional CFO, a risk advisor, and a digital transformation partner. They can afford one subscription that gives them all four, voice-first, available whenever they have time to think. The dynamic reports and recommendations are the consulting deliverable without the day rate.

### 1.3 Target audience

SME leaders (MD, CEO, COO, Founder) in:

- Construction and subcontracting (primary)
- Manufacturing
- Social housing and adjacent property sectors
- Professional services SMEs (secondary)

Company size: 10–100 employees. Time-poor decision-makers without an in-house strategy, risk, or transformation function.

### 1.4 Core promise

1. It remembers your business and gets smarter about it over time.
2. It surfaces what you should be thinking about, not just what you ask.
3. It produces consultant-grade outputs on demand.

### 1.5 Commercial model (placeholder)

- £149/month per business, single user at launch
- 14-day free trial, gated by an initial onboarding conversation
- Annual discount: TBD

To be validated through user testing during PoC.

---

## 2. Scope

### 2.1 In scope for PoC

- Single-user accounts (one leader per business)
- Voice-first interaction with George + three specialists
- Live updates to a structured business profile during conversation
- Canvas home screen with the orb as visual anchor
- Five business profile sections
- Editorial-style profile pages
- On-demand deep dives via voice
- Monthly Board Pack as narrated vertical-scroll report
- Proactive check-ins (scheduled)
- Valorem First handoff flow
- Web and mobile browser (responsive, no native app)
- Light mode only
- UK English, UK data residency

### 2.2 Out of scope for PoC

- Multi-user / employee access
- Third-party integrations (Xero, HubSpot, Microsoft 365)
- Industry benchmarking dataset
- Native mobile apps
- Dark mode
- PDF export of Board Pack
- Billing (Stripe wired but trial-only)
- Multi-language support
- Internationalisation

### 2.3 Things explicitly not to do

- Do not build a dashboard. Resist the urge.
- Do not give agents cartoonish names or catchphrases.
- Do not use human faces or avatars.
- Do not over-engineer the orb (2D SVG, not Three.js).
- Do not store voice audio unless the user explicitly opts in.
- Do not deploy to a US Firebase region — UK only.

---

## 3. Brand and design

### 3.1 Design principles

- **Calm, focused, conversational.** The opposite of a dashboard.
- **One thing at a time, beautifully presented.** Less on screen, not more.
- **Editorial, not utilitarian.** Reads like a magazine, not a CRM.

Reference points: Linear, Arc browser, Granola, Things 3, the New York Times app, Stripe's marketing site.

### 3.2 Visual system

**Background:** Warm off-white `#FAFAF7` (not stark white).

**Primary accent:** Deep teal `#1E4D5A`. Used sparingly: the orb, key actionable elements, small editorial accents.

**Supporting palette:**
- Surface (cards, elevated content): `#FFFFFF`
- Ink (primary text): `#1A1A1A`
- Ink secondary: `#5C5C5C`
- Muted / borders: `#E8E6E0`
- Secondary teal (hover, subtle gradients): `#2E6B7A`
- Success (sparingly): `#3D7A5C`
- Warning (sparingly): `#B8814A`
- Danger (risk register only): `#A84A3D`

**Typography:**
- Editorial content (Board Pack, profile cards): serif. Starting choice: Tiempos or GT Sectra. Fallback: Source Serif.
- UI: clean sans-serif. Starting choice: Inter. Fallback: system stack.
- Data/numbers: tabular figures.

**Spacing:** Generous whitespace. Soft shadows over hard borders. No card outlines unless necessary.

**Iconography:** Minimal. Outline icons only. Lucide as the set.

### 3.3 The orb

The orb is the visual anchor and primary signal of agent activity.

**Implementation:** 2D SVG with gradients, animated via CSS and Framer Motion. Not Three.js.

**States required:**
- Idle: slow, calm breathing animation
- Listening: subtle reactive ripples
- Speaking: more pronounced animation responding to audio amplitude
- Thinking: gentle pulse, distinct from speaking
- Handing off: transition state between agents

**Agent variants:** Each agent has a distinct treatment of the orb (colour shift, gradient direction, animation pattern). No faces.

### 3.4 Layout

**Desktop:**
- Top: minimal nav (business name, profile menu, settings)
- Centre: the orb when active; a "card of the moment" when idle
- Below the fold: business profile, scroll-accessible

**Mobile:**
- Orb stays centre-stage
- Surrounding content collapses to one card at a time, swipeable
- Profile sections accessible via bottom nav

### 3.5 The Board Pack

Generated as a **vertical scroll narrative**, not slides. Works on both desktop and mobile. George narrates section by section; the leader can interrupt, ask questions, or scroll independently.

Visual style: long-read editorial layout. Charts as exhibits, not decoration.

**Fixed structure:**

1. **Executive summary** (3 paragraphs, narrated)
2. **Strategic objectives status** (visual + narrative)
3. **Top risks** (top 5, with movement since last pack)
4. **Opportunities to consider** (top 3)
5. **Maturity snapshot** (radar chart + commentary)
6. **George's recommendations** (3 specific actions)
7. **Suggested Valorem First conversation** (if applicable)

---

## 4. Personas and agent design

### 4.1 George — the Advisor / orchestrator

- **Role:** Primary relationship. Handles all incoming sessions, routes to specialists when depth is needed, synthesises across domains, presents reports.
- **Personality:** Warm, calm, experienced. The senior consultant who's seen a lot and doesn't panic. Measured, considered, occasional dry humour. Slight British cadence.
- **Voice profile:** Male, 50s, warm British baritone, measured pace, slight gravitas. Not RP-posh, not regional-strong. The "trusted family GP" register.
- **Orb treatment:** Warm teal gradient with soft amber inner glow during speaking.

### 4.2 Margot — Strategy specialist

- **Role:** Strategic objectives, growth, competitive positioning, decision-making.
- **Personality:** Ambitious, forward-leaning. Pushes the leader to think bigger. Asks "what would have to be true for that to work?"
- **Voice profile:** British female, mid-30s to 40s. Sharper, more deliberate pacing than George.
- **Orb treatment:** Teal base with subtle warm gold gradient overlay.

### 4.3 Iain — Risk specialist

- **Role:** Risk identification, prioritisation, mitigation, resilience planning.
- **Personality:** Measured, slightly sceptical, thorough. Never alarmist. Calmly points out what you didn't want to hear.
- **Voice profile:** Male, 50s, subtle Scottish accent (professional). Ties to Valorem First's Glasgow base.
- **Orb treatment:** Teal base with deeper indigo shift during active states.

### 4.4 Priya — Digital & AI specialist

- **Role:** Digital maturity, AI readiness, tooling, automation opportunities.
- **Personality:** Curious, pragmatic, allergic to jargon. Translates tech into business outcomes.
- **Voice profile:** British female, 30s, neutral accent, conversational.
- **Orb treatment:** Teal base with cool pale-mint highlight during active states.

### 4.5 Agent behaviour rules

- George always opens and closes every session.
- Specialists are invoked by George with an explicit verbal handoff ("Let me bring in Margot for this").
- On handoff, the orb visually shifts to the specialist's treatment.
- Specialists hand back to George before the session ends.
- All agents can read the full business profile; only George and the relevant specialist can write to their domain section.
- Agents refuse to give legal, medical, HR firing/disciplinary, or financial advice. They defer to qualified professionals and offer to capture the question for follow-up.

---

## 5. The methodology behind Oracle (frameworks as hidden method)

Oracle's value comes from the rigour of the consulting frameworks embedded in its agents and outputs. These frameworks are the *hidden method*: they drive what questions agents ask, how scores are calculated, how risks are assessed, how recommendations are weighted. They are never shown to the leader by name. The leader sees plain-language outputs — diagnostics, priorities, investment cases, a strategy roadmap — not "OGSM" or "Balanced Scorecard" or "Hedgehog Concept" labels.

### 5.1 Frameworks driving the agents (question sets and scoring)

| Agent | Frameworks running in the background |
|---|---|
| Margot (Strategy) | OGSM, Hedgehog Concept (Good to Great), Ansoff Matrix, Business Model Canvas, Boston Matrix |
| Iain (Risk) | IT Risk Assessment, Cyber Assessment, operational risk, legal/compliance exposure |
| Priya (Digital & AI) | Digital Maturity Assessment, Rapid AI Assessment, Lean/Six Sigma (process maturity), IT Resiliency |
| Finance specialist (v1, not PoC) | DuPont Analysis, Economic Value Analysis, financial ratio analysis, Bill Power Financial Maturity, Valorem First Digital ROI |
| George (orchestrator) | Cross-references all of the above, plus Balanced Scorecard for synthesis |

Each framework contributes a tagged set of structured questions that the agent uses to elicit and score information during conversation.

### 5.2 Frameworks driving the outputs (structure and reporting)

| Output | Frameworks behind it |
|---|---|
| Business Health Score | Composite of Balanced Scorecard pillars, weighted by sector |
| The Board Pack | Balanced Scorecard structure (rendered as "Money / Customers / How You Run Things / Your People") |
| Strategic Gap Analysis | OGSM (goals vs reality), Hedgehog, Ansoff |
| Growth & Investment Roadmap | Ansoff, Boston Matrix, Valorem First Digital ROI |
| Risk and Resilience Register | IT Risk, Cyber, operational, legal exposure consolidated |
| ROI-backed Action Plan | Insight schema (see 5.4) prioritised by financial impact and confidence |

### 5.3 What the leader actually sees

The leader never sees framework names in the product. They see:

- A Business Health Score (a single number with breakdown)
- A Board Pack organised by four plain-language pillars
- A list of strategic gaps and recommended moves
- A prioritised action plan with "what, why, expected return, effort, owner"
- A risk register with severity and mitigation
- A growth roadmap

If a leader directly asks "what framework are you using?", George can explain in plain terms: "We're drawing on the same kind of structured approach a senior consultant would use — covering money, customers, operations, and people in a coordinated way. Happy to go into more detail if it's useful."

### 5.4 The insight schema (the common data structure)

Every observation, risk, opportunity, or recommendation captured by any agent is structured using a common 11-field schema. This is what gives Oracle's outputs their analytical credibility.

| Field | Example |
|---|---|
| Observation / pain point | "Sales-to-delivery handover is inconsistent" |
| Evidence | "Three projects started without full scope agreed" |
| Impact area | Finance / Customer / Process / People |
| Root cause | Process gap, system gap, skills gap, culture issue |
| Severity | Low / Medium / High / Critical |
| Frequency | One-off / repeated / systemic |
| Financial impact (estimate) | Lost margin, rework cost, delay value |
| Strategic relevance | Growth, efficiency, resilience, client experience |
| Recommended action | Fix process, invest in system, train staff, automate |
| Expected benefit | Cost saving, revenue growth, risk reduction |
| Confidence level | Based on evidence quality |

The schema lives behind the scenes. In the Board Pack it shows up as editorial prose, not as a table. But every recommendation in Oracle can answer "so what, and why now?" because the underlying data is always present.

---

## 6. The business profile (data structure)

Five sections per business, designed for both machine reasoning and editorial display.

### 6.1 Business context
- Sector, sub-sector, geography
- Headcount, structure
- Annual turnover band
- Year founded
- Key products/services
- Ownership structure
- Stated ambitions (short paragraph, agent-generated and editable)

### 6.2 Strategic objectives
- 12-month objectives
- 3-year objectives
- Each objective: title, description, owner, status, last reviewed, agent notes
- Linked risks and opportunities

### 6.3 Risk register
- Title, description
- Likelihood (1–5)
- Impact (1–5)
- Calculated priority score
- Owner
- Mitigation plan (agent-drafted, editable)
- Review date
- Status (open / mitigated / accepted / closed)
- Agent commentary
- Linked to insight schema (severity, frequency, financial impact, confidence)

### 6.4 Opportunity pipeline
- Title, description
- Category (growth, efficiency, capability, market)
- Estimated value (low / medium / high / transformative)
- Effort (low / medium / high)
- Status (idea / exploring / committed / in progress / realised / dropped)
- Owner
- Linked strategic objectives
- Agent commentary
- Linked to insight schema

### 6.5 Maturity scores

Six dimensions, each scored 1–4, mapped to the four Balanced Scorecard pillars:

| Pillar (leader-facing) | Underlying dimensions |
|---|---|
| Money | Financial maturity (placeholder until Finance specialist ships in v1) |
| Customers | Strategic clarity, commercial maturity |
| How You Run Things | Operational maturity, risk maturity |
| Your People | Capability and culture (placeholder until People specialist ships in v1) |

Cross-cutting dimensions that touch multiple pillars:
- Digital maturity
- AI readiness

Each scored dimension carries: score, narrative summary, key gaps, recommended next steps, last assessed.

*Note: Final framework definition (specific question sets, scoring rubrics, weightings) to be provided by Valorem First before Phase 3 of build. Placeholder rubrics used until then.*

---

## 7. User flows

### 6.1 Sign-up and onboarding

1. Leader signs up (email or Google SSO)
2. Verifies email
3. Brief written intake (5 questions, see 6.2)
4. Lands on canvas — George introduces himself by voice, offers to start onboarding
5. Onboarding session (30–45 minutes)
6. George introduces each specialist briefly during the session
7. Specialists are invoked to populate their domains
8. Post-processing: profile populated, summary generated
9. Leader sees populated profile and a "first impressions" card from George
10. Follow-up scheduled for 7 days later

### 6.2 Intake flow (the 5 questions)

The intake is the leader's first impression of Oracle's design language. It must feel like a quiet, considered conversation, not a registration form.

**Structure:** one question per screen, no progress bar, no "step 1 of 5" counter. The questions advance as the leader answers; back navigation available but not encouraged.

**The five questions, in order:**

1. **"What's the name of your company?"** Single text input. Auto-advance not enabled (avoid feeling rushed).
2. **"What does your business do?"** Sector picker with search; "Other" allowed with free text. Pre-loaded with construction sub-sectors, manufacturing, social housing, professional services.
3. **"Roughly how many people work there?"** Three buttons: 10–25, 26–50, 51–100. No exact number requested.
4. **"And your role?"** Single text input with common suggestions (MD, CEO, COO, Founder, Director, Other).
5. **"What brought you to Oracle?"** Free text, longer field, prompt placeholder: "A sentence or two is plenty."

**Tone of each screen:** display serif question, small ink-3 sub-line offering context only where useful, generous whitespace, no surrounding chrome beyond a tiny Oracle wordmark top-left. The transition between questions is a cross-fade, not a slide.

**On submission:** brief loading state ("Just a moment…"), then lands on the canvas. The first thing the leader sees is the orb appearing, doing the first-contact animation (specified in the design spec), and George speaking.

### 6.3 The first 60 seconds of onboarding (George's opening)

**George:** "Hello [Name], good to meet you. I'm George — I'll be your main point of contact here at Oracle. Think of me as your fractional advisor: I'm here whenever you want to talk through your business, work out what's going well, and figure out what to focus on next.

We'll spend about 30 to 45 minutes today getting to know each other. I'll ask about your company, where you're trying to take it, what's keeping you up at night, and where you think there might be opportunities. There's no right or wrong here — just talk to me like you'd talk to a trusted advisor. I'll capture the important things as we go, and at the end you'll have a clear picture of where things stand.

Before we get going, is now a good time? We can pause and pick up later if you'd prefer."

**If the leader says yes:** George asks them to start with a quick story — "tell me about the business. How did it start, where is it today, and what does success look like in three years?"

**If the leader hesitates:** George offers to reschedule or to do a shorter 10-minute version focused on one area.

**If the leader is silent for more than 8 seconds:** George rephrases the question more concretely. "Maybe start with what your company does and how big the team is."

**If the leader denies microphone permission:** George shifts to text mode for the session. The orb still appears and animates, but the leader types responses and George's words appear as transcript text.

### 6.4 Open session (returning user)

1. Leader opens Oracle
2. Card of the moment shows the most important thing right now
3. Leader taps the orb or speaks to start a session
4. George greets, references recent context, asks what's on their mind
5. Conversation proceeds, specialists invoked as needed
6. Profile updates animate in peripherally
7. Session ends, post-processing runs

### 6.5 Proactive check-in

1. Scheduled job identifies businesses with outstanding commitments or stale areas
2. Notification sent ("George wants to check in")
3. Leader opens Oracle — card of the moment is the check-in
4. Session begins with George referencing the specific item

### 6.6 Board Pack generation

1. Monthly cron triggers (or leader requests on demand)
2. Cloud Function assembles data, Claude drafts content
3. Claude returns structured content per the fixed Board Pack structure
4. Frontend renders as vertical scroll narrative
5. Leader gets notification
6. On open, George offers to walk through it; leader can listen or read

### 6.7 Valorem First handoff

1. Agent identifies a topic beyond Oracle's remit
2. Tool call: `flagForValoremFirst(businessId, topic, reason)`
3. A handoff card appears in the canvas
4. Leader can review and request a callback
5. Internal notification to Valorem First team (email + Slack webhook) with context summary

### 6.8 Support and help

When a leader needs help with the platform itself (not their business):

1. A "Help" link in the settings menu opens a slide-out panel
2. Panel offers: contact support (mailto link to `support@oracle.app`), report a bug, view product status
3. Critical errors surface inline with a "Tell us what went wrong" affordance
4. The leader can also ask George directly ("George, how do I export my data?") — George recognises platform questions and either answers from a small product knowledge base or hands off to support

Support response target during PoC: same-day acknowledgement, 48-hour resolution for non-critical issues. Handled by the Valorem First team.

---

## 8. Data, privacy, and trust

Oracle holds sensitive business information. Trust is the product. The following principles are non-negotiable.

### 7.1 What we collect

- Conversation transcripts (text only by default; audio only if the leader explicitly opts in)
- Structured business profile data the leader and agents enter
- Usage data (sessions started, features used) for product improvement
- Account data (email, name, role) for authentication

### 7.2 What we do with it

- Generate the leader's profile, reports, and recommendations
- Improve the leader's experience over time through memory
- Aggregate anonymised data for benchmarking (post-PoC, with explicit consent)

### 7.3 What we don't do

- Sell data to third parties, ever
- Use a leader's data to train models
- Share data between businesses without explicit aggregation and anonymisation
- Retain data after a leader requests deletion

### 7.4 Data residency

All data stored in UK (Firebase `europe-west2`, London). No data leaves the UK or EEA without legal basis.

### 7.5 Leader controls

Every leader can, via settings:

- Export all their data as JSON (within 24 hours of request)
- Delete their account and all associated data (hard-deleted within 30 days)
- Pause memory retention for a session ("incognito mode" — voice still works, no transcript stored)
- Opt out of audio retention (default)
- Opt out of anonymised benchmarking (default off; opt-in only post-PoC)

### 7.6 Automated decision-making disclosure

Oracle uses AI to make recommendations. The Privacy Policy will explicitly state:

- Oracle's recommendations are advisory, not binding
- Leaders are not subject to decisions made solely by automated processing
- Any leader can request human review by Valorem First of any recommendation

This addresses GDPR Article 22 requirements and is reviewed by legal counsel before launch.

---

## 9. Email and external touchpoints

Oracle exists beyond the app. Emails, the landing page, and any external communications carry the same design language.

### 8.1 Transactional emails

Three templates needed for PoC:

1. **Email verification:** simple, short, single CTA button ("Verify your email"). Subject: "Confirm your email for Oracle".
2. **Board Pack ready:** short message from George ("Your May read is ready"), single CTA ("Read it now"), preview text shows the headline.
3. **Proactive check-in:** short message referencing the specific item ("Iain's been thinking about supplier risk"), single CTA ("Pick up the conversation").

**Design treatment:**
- White background, no header image, no footer noise
- Oracle wordmark top-left
- Serif for the message body, sans-serif for the button and footer
- Single accent of teal on the CTA button
- Footer: a single line of small text with unsubscribe + support link
- Maximum width 560px
- Works in dark mode and light mode email clients

### 8.2 Landing page and marketing site

Out of scope for PoC build but worth flagging:

- Same design language as the app
- Imagery permitted (in app it is not; on marketing it is)
- The orb appears, interactive, as the hero
- Tone: same warm, considered voice as George
- Single goal: drive a trial sign-up

---

## 10. Success criteria for PoC

### 10.1 Qualitative measures

After testing with 5 SME leaders:

- 4 of 5 complete the full onboarding session without abandoning
- 4 of 5 say the resulting profile "knows my business better than my accountant does" or similar
- 3 of 5 say they would pay for it at the proposed price point
- At least 1 generates a Board Pack and rates it as "consulting-grade"
- The voice loop feels natural (no major latency or handoff complaints)
- At least 1 leads to a Valorem First engagement enquiry

### 10.2 Quantitative measures

- Average onboarding session completion: 80% or higher
- Average return rate within 14 days: 60% or higher
- Average sessions per active user in first month: 4 or more
- Cost per active user per month: under £40 (target: under £30)
- No security incidents
- No data loss incidents
- Voice loop latency: agent response time under 2.5s p90

### 10.3 What "ready for v1" looks like

If PoC measures are met:

- All Tier 1 technical gaps closed (see technical spec)
- Multi-user access designed and prototyped
- At least one third-party integration (Xero or HubSpot) scoped
- Stripe billing wired and tested
- Three new pilot businesses signed up at full price
- 12-month roadmap published internally

If met, proceed to v1 build.

---

## 11. Open decisions

### 11.1 Placeholders to validate
1. Accent colour `#1E4D5A` — may refine during design
2. Specialist names (Margot, Iain, Priya) — revisit before launch
3. ElevenLabs voice selection per agent — audition during Phase 2
4. Maturity framework — Valorem First to finalise before Phase 3
5. Pricing (£149/month) — validate in user testing
6. Trial length (14 days) — validate

### 11.2 Still genuinely undecided
- Final brand name (Oracle is a working name; trademark conflict with Oracle Corp likely means rename before launch)
- Logo and wordmark
- Legal: Terms of Service, Privacy Policy, DPA template
- Domain and hosting

---

## 12. Realistic timeline

The technical spec assumes 7 weeks for a full-time experienced developer. Realistic stretch: 9 to 12 weeks. If built part-time alongside other commitments, double those numbers and plan accordingly.

---

*End of product specification.*
