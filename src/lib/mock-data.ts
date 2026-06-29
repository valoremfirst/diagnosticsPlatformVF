import { FRAMEWORKS } from "./frameworks";
import type {
  DiagnosticResult,
  DiagnosticSession,
  FrameworkAssessment,
  TranscriptTurn,
} from "./types";
import { maturityFromScore } from "./utils";

// ---------------------------------------------------------------------------
// Sample transcripts
// ---------------------------------------------------------------------------

export const FINANCE_TRANSCRIPT: TranscriptTurn[] = [
  { speaker: "agent", text: "Thanks for making the time. To set the scene — how clear is your real-time visibility over revenue across the group right now?", timestamp: "00:00:12" },
  { speaker: "user", text: "Honestly it's patchy. We close the month around working day eight, so leadership is effectively steering on numbers that are three to four weeks old. The board pack is always a scramble.", timestamp: "00:00:31" },
  { speaker: "agent", text: "That lag matters. When you say it's a scramble — is the consolidation manual?", timestamp: "00:01:02" },
  { speaker: "user", text: "Very. We pull three ledgers into a master spreadsheet by hand. One analyst owns that workbook and frankly if she's on leave, close slips by days. There's no single source of truth.", timestamp: "00:01:20" },
  { speaker: "agent", text: "Let's talk cost control. Do budget holders see their spend against budget during the month, or only after close?", timestamp: "00:02:05" },
  { speaker: "user", text: "Only after close. Department heads get a PDF once a month. There's no live dashboard, so overspend is usually discovered after the fact. We've had a couple of nasty surprises this year.", timestamp: "00:02:28" },
  { speaker: "agent", text: "Understood. How confident are you in your cash forecast — say the next thirteen weeks?", timestamp: "00:03:10" },
  { speaker: "user", text: "We do a thirteen-week cash flow, but it's a static model refreshed monthly. It doesn't flex with actuals automatically, so by week three it's drifted. Forecast accuracy is maybe sixty percent.", timestamp: "00:03:34" },
  { speaker: "agent", text: "And on the receivables side — what does debtor days look like?", timestamp: "00:04:15" },
  { speaker: "user", text: "Debtor days crept up to about sixty-two. Collections are reactive — we chase when cash gets tight rather than running a disciplined dunning process. There's no automated reminders.", timestamp: "00:04:40" },
  { speaker: "agent", text: "When the business invests — new systems, headcount, capex — is there a standard way you evaluate and then track the return?", timestamp: "00:05:20" },
  { speaker: "user", text: "We build a business case to get sign-off, but nobody goes back to check whether the benefits landed. Benefits realisation just isn't tracked. Once it's approved, it's approved.", timestamp: "00:05:48" },
  { speaker: "agent", text: "Do budget holders genuinely own their numbers, or does finance carry it for them?", timestamp: "00:06:30" },
  { speaker: "user", text: "Finance carries it. Budget ownership is weak — most managers couldn't tell you their run-rate. We've started monthly reviews with the two biggest cost centres though, and that's helping a little.", timestamp: "00:06:55" },
  { speaker: "agent", text: "Last area — EBITDA. How well understood is the margin bridge across the leadership team?", timestamp: "00:07:40" },
  { speaker: "user", text: "The CFO and I understand it, but it doesn't cascade. Most of the exec team look at revenue, not margin. We don't have a clean walk from gross margin to EBITDA that we publish.", timestamp: "00:08:05" },
  { speaker: "agent", text: "That's really useful. To summarise what I've heard: slow manual close with a key-person dependency, no in-month cost visibility, a static cash forecast, rising debtor days, no benefits tracking and weak budget ownership — with margin understanding concentrated at the top. Does that land?", timestamp: "00:08:50" },
  { speaker: "user", text: "That's a fair summary. The appetite to fix it is there — we just haven't had the structure or tooling.", timestamp: "00:09:20" },
];

export const HR_TRANSCRIPT: TranscriptTurn[] = [
  { speaker: "agent", text: "Let's start with retention. What's your voluntary turnover looking like over the last twelve months?", timestamp: "00:00:10" },
  { speaker: "user", text: "It's high — around twenty-four percent, and worse in our frontline operations roles where it's closer to thirty-five. We're constantly rehiring for the same positions.", timestamp: "00:00:33" },
  { speaker: "agent", text: "Do you understand the why? Is there structured exit data?", timestamp: "00:01:05" },
  { speaker: "user", text: "We run exit interviews but the notes just sit in a folder. Nobody themes them or reports trends. The signals are probably all there, we just don't analyse them.", timestamp: "00:01:28" },
  { speaker: "agent", text: "Walk me through onboarding — what happens in a new starter's first week?", timestamp: "00:02:00" },
  { speaker: "user", text: "It's inconsistent. Some managers have a great induction, others sit people in front of a laptop with no plan. There's no standard onboarding checklist across sites. IT access alone can take a week.", timestamp: "00:02:30" },
  { speaker: "agent", text: "How much of your HR team's time goes on manual administration versus value-adding work?", timestamp: "00:03:12" },
  { speaker: "user", text: "Far too much — I'd say sixty percent is chasing paper. Holiday requests are on email, contracts are manual, and we key the same data into three systems. The HRIS we bought is barely adopted.", timestamp: "00:03:40" },
  { speaker: "agent", text: "On compliance — right-to-work, mandatory training, certifications — how confident are you that you'd pass an audit tomorrow?", timestamp: "00:04:20" },
  { speaker: "user", text: "Nervous, honestly. Training records are in spreadsheets and we don't get automated expiry alerts. We'd probably find gaps if someone looked hard.", timestamp: "00:04:48" },
  { speaker: "agent", text: "And skills — do you have a clear picture of capability gaps against where the business is heading?", timestamp: "00:05:25" },
  { speaker: "user", text: "Not really. There's no skills matrix. We react to gaps when someone leaves rather than planning succession. Leadership bench strength is thin.", timestamp: "00:05:52" },
  { speaker: "agent", text: "So to play it back: high frontline turnover with unused exit insight, inconsistent onboarding, heavy manual admin on an under-adopted HRIS, shaky compliance tracking and no structured skills or succession planning. Fair?", timestamp: "00:06:30" },
  { speaker: "user", text: "Painfully fair. The team is firefighting and we know it isn't sustainable.", timestamp: "00:06:58" },
];

export const IT_TRANSCRIPT: TranscriptTurn[] = [
  { speaker: "agent", text: "Let's begin with availability. How would you describe uptime of your core systems over the past year?", timestamp: "00:00:11" },
  { speaker: "user", text: "Generally okay, but we've had two significant outages — one took the order system down for most of a day. We don't publish an SLA internally and there's no real-time monitoring on some of the older apps.", timestamp: "00:00:38" },
  { speaker: "agent", text: "On backups — when did you last successfully restore from one, end to end?", timestamp: "00:01:15" },
  { speaker: "user", text: "We take nightly backups but, being honest, we've never done a full restore test. We assume they work. There's no documented recovery runbook.", timestamp: "00:01:42" },
  { speaker: "agent", text: "Talk to me about cyber controls. MFA, patching cadence, endpoint protection?", timestamp: "00:02:20" },
  { speaker: "user", text: "MFA is on email but not everywhere. Patching is ad-hoc — when someone remembers. We had a phishing incident last quarter that got further than it should have. Endpoint cover is decent though.", timestamp: "00:02:52" },
  { speaker: "agent", text: "If a serious incident hit tomorrow, is there a tested incident response plan?", timestamp: "00:03:30" },
  { speaker: "user", text: "There's a document, but it's two years old and we've never run a tabletop exercise. People wouldn't know their roles. It would be chaotic, frankly.", timestamp: "00:03:58" },
  { speaker: "agent", text: "How integrated is your systems landscape — or are teams bridging gaps manually?", timestamp: "00:04:35" },
  { speaker: "user", text: "Lots of manual bridges. Finance re-keys data from the warehouse system. There are several spreadsheets acting as integration glue, and a fair bit of shadow IT — teams buying their own SaaS without telling us.", timestamp: "00:05:04" },
  { speaker: "agent", text: "Is there a single point of failure that keeps you up at night?", timestamp: "00:05:45" },
  { speaker: "user", text: "Our legacy ERP. One contractor understands it, it's unsupported, and if it fell over we'd be in serious trouble. It's the biggest dependency risk we have.", timestamp: "00:06:12" },
  { speaker: "agent", text: "So in summary: decent endpoint cover but untested backups, patchy MFA and ad-hoc patching, a stale untested incident plan, manual integration with shadow IT, and a critical single point of failure in an unsupported ERP. Does that reflect reality?", timestamp: "00:06:50" },
  { speaker: "user", text: "Yes, that's the honest picture. We've been lucky more than good.", timestamp: "00:07:18" },
];

// ---------------------------------------------------------------------------
// Result builders
// ---------------------------------------------------------------------------

type CriteriaSeed = [name: string, score: number, confidence: number, rationale: string, evidence?: Array<[string, "agent" | "user", number]>];

function buildFramework(
  name: string,
  seeds: CriteriaSeed[],
): FrameworkAssessment {
  const criteria = seeds.map(([n, score, confidence, rationale, ev]) => ({
    name: n,
    score,
    confidence,
    rationale,
    evidence: (ev ?? []).map(([quote, speaker, transcriptIndex]) => ({
      quote,
      speaker,
      transcriptIndex,
    })),
  }));
  const score = Math.round(
    criteria.reduce((a, c) => a + c.score, 0) / criteria.length,
  );
  return { framework: name, score, maturityLevel: maturityFromScore(score), criteria };
}

// --- Finance (fully detailed, evidence-linked) ---
const FINANCE_RESULT: DiagnosticResult = {
  overallScore: 41,
  overallMaturityLevel: "developing",
  executiveSummary:
    "Finance operates with capable people but limited tooling and structure. Month-end close is slow, manual and carries a key-person dependency, while in-month cost visibility is absent. Cash forecasting is static and drifts quickly, debtor days are rising, and there is no benefits-realisation discipline after investment sign-off. Margin understanding is concentrated in the CFO and finance lead rather than cascaded across the executive. The appetite to improve is clear; the priority is to industrialise close, introduce live cost and cash visibility, and instil ownership and ROI tracking.",
  frameworks: [
    buildFramework("Finance / ROI Maturity", [
      ["Cost visibility", 28, 0.86, "Budget holders only see spend post-close via a monthly PDF; no live in-month visibility.", [["Only after close. Department heads get a PDF once a month. There's no live dashboard, so overspend is usually discovered after the fact.", "user", 5]]],
      ["ROI discipline", 30, 0.82, "Business cases are built for sign-off but returns are never revisited.", [["We build a business case to get sign-off, but nobody goes back to check whether the benefits landed.", "user", 11]]],
      ["Budget ownership", 38, 0.78, "Ownership is weak; finance carries the numbers, though reviews with top cost centres have begun.", [["Budget ownership is weak — most managers couldn't tell you their run-rate. We've started monthly reviews with the two biggest cost centres.", "user", 13]]],
      ["Forecasting maturity", 40, 0.8, "A 13-week cash model exists but is static and drifts to ~60% accuracy.", [["It's a static model refreshed monthly. It doesn't flex with actuals automatically... Forecast accuracy is maybe sixty percent.", "user", 7]]],
      ["Benefits tracking", 22, 0.84, "No benefits realisation tracking after approval.", [["Benefits realisation just isn't tracked. Once it's approved, it's approved.", "user", 11]]],
      ["Investment governance", 45, 0.6, "Sign-off process exists but lacks post-investment governance.", [["We build a business case to get sign-off.", "user", 11]]],
    ]),
    buildFramework("Lean / Six Sigma", [
      ["Waste identification", 35, 0.7, "Manual consolidation and re-keying indicate significant process waste.", [["We pull three ledgers into a master spreadsheet by hand.", "user", 3]]],
      ["Process variation", 30, 0.72, "Close timing varies with staff availability — high variation.", [["if she's on leave, close slips by days.", "user", 3]]],
      ["Standardisation", 32, 0.75, "No single source of truth; reliant on one analyst's workbook.", [["There's no single source of truth.", "user", 3]]],
      ["Root cause discipline", 38, 0.5, "Surprises discovered after the fact suggest reactive problem-solving.", [["overspend is usually discovered after the fact.", "user", 5]]],
      ["Continuous improvement maturity", 42, 0.55, "Some improvement initiatives (cost-centre reviews) emerging.", [["We've started monthly reviews with the two biggest cost centres.", "user", 13]]],
      ["DMAIC alignment", 30, 0.45, "Little evidence of structured measure/analyse discipline.", []],
    ]),
    buildFramework("Digital Maturity", [
      ["Automation level", 25, 0.85, "Core consolidation and collections are manual.", [["We pull three ledgers into a master spreadsheet by hand.", "user", 3]]],
      ["System integration", 28, 0.8, "Three ledgers are bridged manually with no integration.", [["We pull three ledgers into a master spreadsheet by hand.", "user", 3]]],
      ["Data quality", 40, 0.65, "Single source of truth absent; spreadsheet-driven.", [["There's no single source of truth.", "user", 3]]],
      ["Workflow digitisation", 30, 0.7, "Reporting distributed as static PDFs.", [["Department heads get a PDF once a month.", "user", 5]]],
      ["AI readiness", 35, 0.4, "Foundational data not yet structured enough for analytics/AI.", []],
      ["User adoption", 45, 0.5, "Limited tooling means limited adoption to assess.", []],
    ]),
    buildFramework("Balanced Scorecard", [
      ["Financial performance", 48, 0.7, "Profitability understood at the top but not transparently managed.", [["We don't have a clean walk from gross margin to EBITDA that we publish.", "user", 15]]],
      ["Customer outcomes", 50, 0.35, "Limited evidence captured in this interview.", []],
      ["Internal process maturity", 33, 0.78, "Manual, key-person-dependent close.", [["if she's on leave, close slips by days.", "user", 3]]],
      ["Learning and growth", 45, 0.45, "Some appetite and emerging reviews, but capability thin.", [["The appetite to fix it is there — we just haven't had the structure or tooling.", "user", 17]]],
      ["Strategic alignment", 40, 0.6, "Margin focus not cascaded; exec watches revenue.", [["Most of the exec team look at revenue, not margin.", "user", 15]]],
    ]),
    buildFramework("IT Resilience", [
      ["Availability", 50, 0.3, "Not directly in scope for this finance interview.", []],
      ["Backup and recovery", 50, 0.25, "Not assessed in this session.", []],
      ["Cyber resilience", 50, 0.25, "Not assessed in this session.", []],
      ["Incident response", 50, 0.25, "Not assessed in this session.", []],
      ["System dependency risk", 40, 0.6, "Key-person dependency on the consolidation workbook.", [["One analyst owns that workbook and frankly if she's on leave, close slips by days.", "user", 3]]],
      ["Operational continuity", 42, 0.5, "Close continuity at risk from single-person reliance.", [["if she's on leave, close slips by days.", "user", 3]]],
    ]),
  ],
  risks: [
    { title: "Key-person dependency on month-end close", severity: "high", description: "A single analyst owns the manual consolidation workbook; their absence delays close and the board pack, with no documented process or backup.", evidence: [{ quote: "One analyst owns that workbook and frankly if she's on leave, close slips by days.", speaker: "user", transcriptIndex: 3 }] },
    { title: "No in-month cost control", severity: "high", description: "Budget holders only see spend after close, leading to overspend discovered after the fact and 'nasty surprises'.", evidence: [{ quote: "overspend is usually discovered after the fact. We've had a couple of nasty surprises this year.", speaker: "user", transcriptIndex: 5 }] },
    { title: "Cash forecast drift", severity: "medium", description: "A static 13-week model refreshed monthly drifts to ~60% accuracy, weakening liquidity decisions.", evidence: [{ quote: "by week three it's drifted. Forecast accuracy is maybe sixty percent.", speaker: "user", transcriptIndex: 7 }] },
    { title: "Rising debtor days with reactive collections", severity: "medium", description: "Debtor days at ~62 with reactive, manual chasing and no automated dunning.", evidence: [{ quote: "Debtor days crept up to about sixty-two. Collections are reactive.", speaker: "user", transcriptIndex: 9 }] },
    { title: "No benefits realisation after investment", severity: "medium", description: "Investments are approved but returns are never tracked, undermining capital discipline.", evidence: [{ quote: "Benefits realisation just isn't tracked. Once it's approved, it's approved.", speaker: "user", transcriptIndex: 11 }] },
  ],
  recommendations: [
    { title: "Stand up a live cost & cash control dashboard", priority: "high", impact: "high", effort: "medium", description: "Connect the three ledgers into a single reporting layer and give budget holders in-month spend-vs-budget visibility, replacing the monthly PDF." },
    { title: "Industrialise and de-risk month-end close", priority: "high", impact: "high", effort: "medium", description: "Document the close, cross-train a second owner, and automate consolidation to cut the working-day-eight close and remove the key-person dependency." },
    { title: "Move to a rolling, actuals-driven cash forecast", priority: "high", impact: "medium", effort: "medium", description: "Replace the static 13-week model with a rolling forecast that ingests actuals automatically to lift accuracy above 85%." },
    { title: "Introduce automated collections / dunning", priority: "medium", impact: "medium", effort: "low", description: "Automate reminders and a disciplined dunning ladder to bring debtor days down from 62." },
    { title: "Establish benefits realisation governance", priority: "medium", impact: "medium", effort: "low", description: "Add a mandatory post-investment review at 6 and 12 months tied to the original business case." },
  ],
  roadmap: [
    { phase: "0-30 days", action: "Document the close process and cross-train a backup owner.", ownerRole: "Financial Controller", expectedOutcome: "Removed single-person dependency; close resilient to absence." },
    { phase: "0-30 days", action: "Define cost-centre reporting requirements with the top five budget holders.", ownerRole: "FP&A Lead", expectedOutcome: "Agreed metrics and ownership for in-month control." },
    { phase: "31-90 days", action: "Implement consolidated live cost & cash dashboard across the three ledgers.", ownerRole: "Finance Systems Lead", expectedOutcome: "In-month visibility; overspend caught before period end." },
    { phase: "31-90 days", action: "Deploy automated AR dunning workflow.", ownerRole: "Credit Control Manager", expectedOutcome: "Debtor days trending toward 45." },
    { phase: "3-6 months", action: "Roll out rolling actuals-driven cash forecast and benefits-realisation reviews.", ownerRole: "CFO", expectedOutcome: "Forecast accuracy >85% and capital discipline embedded." },
  ],
};

// --- HR (lighter but complete) ---
const HR_RESULT: DiagnosticResult = {
  overallScore: 37,
  overallMaturityLevel: "developing",
  executiveSummary:
    "The people function is firefighting. Frontline turnover is high and the exit data that could explain it is collected but never analysed. Onboarding is inconsistent across sites, the HRIS is under-adopted leaving the team buried in manual admin, compliance tracking is fragile, and there is no structured skills or succession planning. Quick wins exist in standardising onboarding and activating the existing HRIS; the strategic priority is turning retention and capability data into action.",
  frameworks: [
    buildFramework("Digital Maturity", [
      ["Automation level", 28, 0.85, "Holiday, contracts and data entry are manual across three systems.", [["Holiday requests are on email, contracts are manual, and we key the same data into three systems.", "user", 7]]],
      ["System integration", 30, 0.8, "Same data re-keyed into multiple systems; no integration.", [["we key the same data into three systems.", "user", 7]]],
      ["Data quality", 38, 0.7, "Records fragmented across spreadsheets and folders.", [["Training records are in spreadsheets.", "user", 9]]],
      ["Workflow digitisation", 32, 0.75, "Core HR workflows remain email/paper based.", [["Holiday requests are on email.", "user", 7]]],
      ["AI readiness", 30, 0.4, "Data not structured enough for analytics.", []],
      ["User adoption", 25, 0.82, "Purchased HRIS is barely used.", [["The HRIS we bought is barely adopted.", "user", 7]]],
    ]),
    buildFramework("Lean / Six Sigma", [
      ["Waste identification", 35, 0.7, "~60% of HR time lost to manual admin.", [["I'd say sixty percent is chasing paper.", "user", 7]]],
      ["Process variation", 30, 0.8, "Onboarding quality varies dramatically by manager.", [["Some managers have a great induction, others sit people in front of a laptop with no plan.", "user", 5]]],
      ["Standardisation", 28, 0.82, "No standard onboarding checklist across sites.", [["There's no standard onboarding checklist across sites.", "user", 5]]],
      ["Root cause discipline", 30, 0.78, "Exit interview signals never themed or actioned.", [["We run exit interviews but the notes just sit in a folder.", "user", 3]]],
      ["Continuous improvement maturity", 38, 0.5, "Limited structured improvement evident.", []],
      ["DMAIC alignment", 32, 0.4, "No measurement discipline around people metrics.", []],
    ]),
    buildFramework("Balanced Scorecard", [
      ["Financial performance", 45, 0.4, "Rehiring cost implied by high turnover, not quantified.", [["We're constantly rehiring for the same positions.", "user", 1]]],
      ["Customer outcomes", 48, 0.3, "Not directly assessed.", []],
      ["Internal process maturity", 30, 0.8, "Manual, inconsistent core processes.", [["It's inconsistent.", "user", 5]]],
      ["Learning and growth", 28, 0.82, "No skills matrix or succession planning.", [["There's no skills matrix. We react to gaps when someone leaves rather than planning succession.", "user", 11]]],
      ["Strategic alignment", 35, 0.6, "Capability planning not aligned to business direction.", [["Leadership bench strength is thin.", "user", 11]]],
    ]),
    buildFramework("Finance / ROI Maturity", [
      ["Cost visibility", 42, 0.45, "Turnover cost not tracked explicitly.", []],
      ["ROI discipline", 35, 0.55, "HRIS investment not realising return.", [["The HRIS we bought is barely adopted.", "user", 7]]],
      ["Budget ownership", 45, 0.4, "Not assessed in detail.", []],
      ["Forecasting maturity", 40, 0.4, "No workforce planning forecast.", []],
      ["Benefits tracking", 32, 0.6, "HRIS benefits not realised or tracked.", [["barely adopted.", "user", 7]]],
      ["Investment governance", 40, 0.4, "Limited evidence.", []],
    ]),
    buildFramework("IT Resilience", [
      ["Availability", 50, 0.25, "Not in scope.", []],
      ["Backup and recovery", 50, 0.25, "Not in scope.", []],
      ["Cyber resilience", 40, 0.5, "Compliance gaps imply control weakness.", [["We'd probably find gaps if someone looked hard.", "user", 9]]],
      ["Incident response", 50, 0.25, "Not in scope.", []],
      ["System dependency risk", 45, 0.4, "Manual reliance creates fragility.", []],
      ["Operational continuity", 40, 0.5, "Onboarding delays (IT access) impact continuity.", [["IT access alone can take a week.", "user", 5]]],
    ]),
  ],
  risks: [
    { title: "High frontline turnover", severity: "critical", description: "Voluntary turnover ~24% overall and ~35% frontline, driving constant rehiring and instability.", evidence: [{ quote: "around twenty-four percent, and worse in our frontline operations roles where it's closer to thirty-five.", speaker: "user", transcriptIndex: 1 }] },
    { title: "Compliance audit exposure", severity: "high", description: "Training and certification tracking sits in spreadsheets with no expiry alerts, risking audit failure.", evidence: [{ quote: "Training records are in spreadsheets and we don't get automated expiry alerts.", speaker: "user", transcriptIndex: 9 }] },
    { title: "Unused retention insight", severity: "medium", description: "Exit interviews are conducted but never themed, so root causes of attrition go unaddressed.", evidence: [{ quote: "the notes just sit in a folder. Nobody themes them or reports trends.", speaker: "user", transcriptIndex: 3 }] },
    { title: "Thin leadership bench", severity: "high", description: "No skills matrix or succession planning leaves the organisation exposed to key departures.", evidence: [{ quote: "Leadership bench strength is thin.", speaker: "user", transcriptIndex: 11 }] },
  ],
  recommendations: [
    { title: "Standardise onboarding across all sites", priority: "high", impact: "high", effort: "low", description: "Roll out a single onboarding checklist with day-one IT access SLAs to lift early retention and consistency." },
    { title: "Activate the existing HRIS", priority: "high", impact: "high", effort: "medium", description: "Drive adoption of the purchased HRIS for holidays, contracts and records to reclaim the ~60% lost to admin." },
    { title: "Build a compliance tracker with expiry alerts", priority: "high", impact: "medium", effort: "low", description: "Move training/certification records into the HRIS with automated expiry alerts to close audit gaps." },
    { title: "Theme exit data and act on drivers", priority: "medium", impact: "high", effort: "low", description: "Introduce a monthly attrition review that themes exit interviews and tracks interventions." },
    { title: "Create a skills matrix and succession plan", priority: "medium", impact: "high", effort: "medium", description: "Map capability against strategy and build a succession plan for critical roles." },
  ],
  roadmap: [
    { phase: "0-30 days", action: "Publish a standard onboarding checklist and day-one access SLA.", ownerRole: "HR Operations Lead", expectedOutcome: "Consistent first-week experience across sites." },
    { phase: "0-30 days", action: "Launch a monthly attrition review themed from exit interviews.", ownerRole: "HR Business Partner", expectedOutcome: "Visible attrition drivers feeding action." },
    { phase: "31-90 days", action: "Drive HRIS adoption for holidays, contracts and compliance records.", ownerRole: "HRIS Administrator", expectedOutcome: "Manual admin reduced; compliance alerts live." },
    { phase: "3-6 months", action: "Build skills matrix and succession plan for critical roles.", ownerRole: "Head of HR", expectedOutcome: "Capability gaps planned, not reactive." },
  ],
};

// --- IT (lighter but complete) ---
const IT_RESULT: DiagnosticResult = {
  overallScore: 44,
  overallMaturityLevel: "developing",
  executiveSummary:
    "IT keeps the lights on but resilience is fragile. Endpoint protection is reasonable, yet backups have never been restore-tested, MFA and patching are inconsistent, and the incident response plan is stale and untested. The landscape is bridged manually with notable shadow IT, and an unsupported legacy ERP understood by a single contractor represents a critical single point of failure. Priorities: prove recoverability, harden identity and patching, and address the ERP dependency.",
  frameworks: [
    buildFramework("IT Resilience", [
      ["Availability", 48, 0.7, "Two significant outages; no internal SLA or full monitoring on legacy apps.", [["we've had two significant outages — one took the order system down for most of a day.", "user", 1]]],
      ["Backup and recovery", 30, 0.88, "Nightly backups taken but never restore-tested; no runbook.", [["we've never done a full restore test. We assume they work. There's no documented recovery runbook.", "user", 3]]],
      ["Cyber resilience", 38, 0.82, "Partial MFA, ad-hoc patching, recent phishing incident.", [["MFA is on email but not everywhere. Patching is ad-hoc.", "user", 5]]],
      ["Incident response", 32, 0.85, "Plan is two years old and never exercised.", [["it's two years old and we've never run a tabletop exercise.", "user", 7]]],
      ["System dependency risk", 25, 0.9, "Unsupported legacy ERP understood by one contractor.", [["One contractor understands it, it's unsupported, and if it fell over we'd be in serious trouble.", "user", 11]]],
      ["Operational continuity", 40, 0.7, "Recovery untested; continuity not assured.", [["we've never done a full restore test.", "user", 3]]],
    ]),
    buildFramework("Digital Maturity", [
      ["Automation level", 35, 0.78, "Manual data bridges between systems.", [["Finance re-keys data from the warehouse system.", "user", 9]]],
      ["System integration", 28, 0.85, "Spreadsheets used as integration glue.", [["There are several spreadsheets acting as integration glue.", "user", 9]]],
      ["Data quality", 40, 0.6, "Re-keying introduces error risk.", [["Finance re-keys data from the warehouse system.", "user", 9]]],
      ["Workflow digitisation", 42, 0.6, "Mixed; core flows partly manual.", []],
      ["AI readiness", 35, 0.4, "Integration debt limits readiness.", []],
      ["User adoption", 38, 0.55, "Shadow IT signals unmet needs.", [["a fair bit of shadow IT — teams buying their own SaaS without telling us.", "user", 9]]],
    ]),
    buildFramework("Lean / Six Sigma", [
      ["Waste identification", 40, 0.65, "Manual re-keying is clear waste.", [["Finance re-keys data from the warehouse system.", "user", 9]]],
      ["Process variation", 42, 0.5, "Ad-hoc patching introduces variation.", [["Patching is ad-hoc — when someone remembers.", "user", 5]]],
      ["Standardisation", 35, 0.7, "No standard recovery or patching routine.", [["There's no documented recovery runbook.", "user", 3]]],
      ["Root cause discipline", 40, 0.5, "Incidents not fully learned from.", []],
      ["Continuous improvement maturity", 42, 0.45, "Limited structured improvement.", []],
      ["DMAIC alignment", 38, 0.4, "No measure/control discipline evident.", []],
    ]),
    buildFramework("Balanced Scorecard", [
      ["Financial performance", 45, 0.35, "Outage cost not quantified.", []],
      ["Customer outcomes", 42, 0.5, "Order-system outage impacted customers.", [["one took the order system down for most of a day.", "user", 1]]],
      ["Internal process maturity", 38, 0.7, "Manual, inconsistent IT processes.", []],
      ["Learning and growth", 40, 0.45, "Single-contractor knowledge concentration.", [["One contractor understands it.", "user", 11]]],
      ["Strategic alignment", 45, 0.4, "Reactive posture vs strategic resilience.", []],
    ]),
    buildFramework("Finance / ROI Maturity", [
      ["Cost visibility", 45, 0.35, "Not directly assessed.", []],
      ["ROI discipline", 42, 0.4, "Shadow IT spend uncontrolled.", [["teams buying their own SaaS without telling us.", "user", 9]]],
      ["Budget ownership", 45, 0.4, "Not assessed.", []],
      ["Forecasting maturity", 42, 0.35, "Not assessed.", []],
      ["Benefits tracking", 40, 0.4, "Not assessed.", []],
      ["Investment governance", 38, 0.55, "Unsupported ERP signals deferred investment.", [["it's unsupported.", "user", 11]]],
    ]),
  ],
  risks: [
    { title: "Critical single point of failure (legacy ERP)", severity: "critical", description: "An unsupported legacy ERP understood by a single contractor would cause severe disruption if it failed.", evidence: [{ quote: "One contractor understands it, it's unsupported, and if it fell over we'd be in serious trouble.", speaker: "user", transcriptIndex: 11 }] },
    { title: "Unproven backups", severity: "critical", description: "Backups have never been restore-tested and there is no recovery runbook, so recoverability is unverified.", evidence: [{ quote: "we've never done a full restore test. We assume they work.", speaker: "user", transcriptIndex: 3 }] },
    { title: "Identity & patching gaps", severity: "high", description: "Partial MFA and ad-hoc patching enabled a recent phishing incident to progress further than it should.", evidence: [{ quote: "MFA is on email but not everywhere. Patching is ad-hoc.", speaker: "user", transcriptIndex: 5 }] },
    { title: "Untested incident response", severity: "high", description: "A two-year-old plan, never exercised, means roles are unclear in a real incident.", evidence: [{ quote: "it's two years old and we've never run a tabletop exercise.", speaker: "user", transcriptIndex: 7 }] },
    { title: "Shadow IT", severity: "medium", description: "Teams procuring SaaS independently creates security and integration risk.", evidence: [{ quote: "teams buying their own SaaS without telling us.", speaker: "user", transcriptIndex: 9 }] },
  ],
  recommendations: [
    { title: "Run an end-to-end restore test and write a runbook", priority: "high", impact: "high", effort: "low", description: "Prove recoverability with a full restore test and document a recovery runbook with RTO/RPO targets." },
    { title: "Enforce MFA everywhere and a patching cadence", priority: "high", impact: "high", effort: "medium", description: "Mandate MFA across all systems and move patching to a scheduled, reported cadence." },
    { title: "Remediate the legacy ERP dependency", priority: "high", impact: "high", effort: "high", description: "Document the ERP, build internal knowledge, and plan migration off the unsupported platform." },
    { title: "Refresh and exercise the incident response plan", priority: "medium", impact: "medium", effort: "low", description: "Update the IR plan and run a quarterly tabletop so roles are clear." },
    { title: "Introduce a SaaS governance / shadow-IT policy", priority: "medium", impact: "medium", effort: "low", description: "Catalogue shadow IT and route procurement through a lightweight review." },
  ],
  roadmap: [
    { phase: "0-30 days", action: "Perform a full end-to-end restore test and document a runbook.", ownerRole: "Infrastructure Lead", expectedOutcome: "Verified recoverability with defined RTO/RPO." },
    { phase: "0-30 days", action: "Enforce MFA across all business systems.", ownerRole: "IT Security Lead", expectedOutcome: "Identity attack surface materially reduced." },
    { phase: "31-90 days", action: "Establish a scheduled, reported patching cadence and refresh the IR plan with a tabletop.", ownerRole: "IT Operations Manager", expectedOutcome: "Consistent patching; tested incident readiness." },
    { phase: "3-6 months", action: "Document the legacy ERP and produce a migration business case.", ownerRole: "Head of IT", expectedOutcome: "Single point of failure on a remediation path." },
  ],
};

// ---------------------------------------------------------------------------
// Seed sessions
// ---------------------------------------------------------------------------

export const MOCK_SESSIONS: DiagnosticSession[] = [
  {
    id: "diag-204",
    companyName: "Meridian Logistics Group",
    function: "finance",
    status: "complete",
    clientContact: "CFO, Meridian Logistics",
    sector: "Logistics & Supply Chain",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
    transcript: FINANCE_TRANSCRIPT,
    result: FINANCE_RESULT,
    createdAt: "2026-06-18T09:30:00.000Z",
    completedAt: "2026-06-18T09:52:00.000Z",
  },
  {
    id: "diag-198",
    companyName: "Harborview Care Services",
    function: "hr",
    status: "complete",
    clientContact: "People Director, Harborview",
    sector: "Health & Social Care",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
    transcript: HR_TRANSCRIPT,
    result: HR_RESULT,
    createdAt: "2026-06-11T13:15:00.000Z",
    completedAt: "2026-06-11T13:34:00.000Z",
  },
  {
    id: "diag-191",
    companyName: "Northfield Manufacturing",
    function: "it",
    status: "complete",
    clientContact: "IT Director, Northfield",
    sector: "Manufacturing",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
    transcript: IT_TRANSCRIPT,
    result: IT_RESULT,
    createdAt: "2026-06-03T10:00:00.000Z",
    completedAt: "2026-06-03T10:21:00.000Z",
  },
  {
    id: "diag-188",
    companyName: "Apex Retail Partners",
    function: "sales",
    status: "processing",
    clientContact: "Commercial Director, Apex",
    sector: "Retail",
    selectedFrameworks: FRAMEWORKS.map((f) => f.name),
    transcript: [
      { speaker: "agent", text: "How much visibility do you have over the live pipeline by stage?", timestamp: "00:00:10" },
      { speaker: "user", text: "Limited. Reps keep their own spreadsheets and the CRM is half-populated, so the forecast is really a finger in the air.", timestamp: "00:00:32" },
    ],
    createdAt: "2026-06-27T15:40:00.000Z",
  },
];

export const SAMPLE_RESULT = FINANCE_RESULT;
