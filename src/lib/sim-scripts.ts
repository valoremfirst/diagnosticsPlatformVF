import type { DiagnosticFunction, TranscriptTurn } from "./types";

/**
 * Lightweight scripted interviews used by the live-session simulator when no
 * ElevenLabs agent is configured. Kept separate from mock-data so the heavy
 * result fixtures never reach the client bundle.
 */

type Line = { speaker: "agent" | "user"; text: string };

const LEGAL: Line[] = [
  { speaker: "agent", text: "Thanks for the time. How are commercial contracts managed across the business today?" },
  { speaker: "user", text: "Loosely. Signed contracts live in various inboxes and a shared drive — there's no central repository or renewal tracking." },
  { speaker: "agent", text: "So do renewals and key dates ever slip through?" },
  { speaker: "user", text: "They do. We auto-renewed a supplier deal last year we meant to renegotiate, and it cost us." },
  { speaker: "agent", text: "How confident are you on GDPR and data-privacy compliance?" },
  { speaker: "user", text: "Nervous. We have a policy but it's dated, and I'm not sure our processing records would hold up to scrutiny." },
  { speaker: "agent", text: "Is legal involved early in deals, or brought in at the end?" },
  { speaker: "user", text: "Usually at the end, as a bottleneck. By then terms are half-agreed and we're firefighting risk retrospectively." },
  { speaker: "agent", text: "Any current disputes or exposure that concerns you?" },
  { speaker: "user", text: "One ongoing dispute over an ambiguous SOW. Our templates aren't tight, so scope arguments come up more than they should." },
];

const IT: Line[] = [
  { speaker: "agent", text: "Let's begin with availability — how's uptime of core systems been this year?" },
  { speaker: "user", text: "Two significant outages, one took the order system down for most of a day. No internal SLA on the older apps." },
  { speaker: "agent", text: "When did you last successfully restore from backup, end to end?" },
  { speaker: "user", text: "Honestly, never tested a full restore. We take nightly backups and assume they work. No recovery runbook." },
  { speaker: "agent", text: "Talk me through cyber controls — MFA, patching?" },
  { speaker: "user", text: "MFA is on email but not everywhere, patching is ad-hoc, and we had a phishing incident last quarter." },
  { speaker: "agent", text: "Any single point of failure that worries you?" },
  { speaker: "user", text: "Our legacy ERP. One contractor understands it, it's unsupported, and we'd be in serious trouble if it fell over." },
];

const SALES: Line[] = [
  { speaker: "agent", text: "How much visibility do you have over the live pipeline by stage?" },
  { speaker: "user", text: "Limited. Reps keep their own spreadsheets and the CRM is half-populated, so the forecast is a finger in the air." },
  { speaker: "agent", text: "What does conversion look like from qualified lead to close?" },
  { speaker: "user", text: "We don't measure it consistently. Different reps define stages differently, so the numbers aren't comparable." },
  { speaker: "agent", text: "How accurate is your quarterly forecast against actuals?" },
  { speaker: "user", text: "We're often out by twenty percent or more. Deals slip and we only find out late in the quarter." },
];

const OPERATIONAL_DELIVERY: Line[] = [
  { speaker: "agent", text: "How predictable is your delivery against committed timelines right now?" },
  { speaker: "user", text: "Variable. Some projects land on time, others slip weeks and we only realise late because tracking is inconsistent." },
  { speaker: "agent", text: "How is project governance structured — are there clear stage gates?" },
  { speaker: "user", text: "Loosely. We have kick-offs but no consistent gate reviews, so scope and risk creep in unnoticed." },
  { speaker: "agent", text: "Are you meeting your SLAs with clients?" },
  { speaker: "user", text: "Mostly, but we don't measure it rigorously. Breaches tend to surface as complaints rather than in a dashboard." },
  { speaker: "agent", text: "How do you allocate resource across concurrent deliveries?" },
  { speaker: "user", text: "Reactively. The same senior people get pulled onto every escalation, and we don't have a clear capacity view." },
];

const LEADERSHIP: Line[] = [
  { speaker: "agent", text: "How clearly is the strategy understood below the executive team?" },
  { speaker: "user", text: "Patchy. The exec aligns but it dilutes as it cascades — middle managers interpret priorities differently." },
  { speaker: "agent", text: "How disciplined is your decision-making and governance?" },
  { speaker: "user", text: "Decisions can drift. We revisit the same topics and accountability for outcomes isn't always clear." },
  { speaker: "agent", text: "How strong is your leadership bench and succession plan?" },
  { speaker: "user", text: "Thin, honestly. We have a few key people we couldn't easily replace and no real succession planning." },
];

const CULTURE: Line[] = [
  { speaker: "agent", text: "How would you describe employee engagement across the organisation today?" },
  { speaker: "user", text: "Mixed. Some teams are energised, others feel disconnected — and we don't measure it consistently to know which is which." },
  { speaker: "agent", text: "Do your stated values actually show up in day-to-day behaviour?" },
  { speaker: "user", text: "Honestly they're on the wall more than in the culture. Leaders don't always model them, so people are cynical." },
  { speaker: "agent", text: "How do you recognise and reward good work?" },
  { speaker: "user", text: "Ad hoc. There's no structured recognition, so it depends entirely on your manager whether you feel valued." },
  { speaker: "agent", text: "What's driving people to leave when they do?" },
  { speaker: "user", text: "Lack of progression and feeling unheard, mostly. We hear it anecdotally but never act on it systematically." },
];

const PRESALES: Line[] = [
  { speaker: "agent", text: "What does your win rate look like on qualified opportunities?" },
  { speaker: "user", text: "Around a third, but it swings a lot. We chase too many deals we were never going to win." },
  { speaker: "agent", text: "How rigorous is discovery before you commit to a proposal?" },
  { speaker: "user", text: "Light. We often jump to a demo before we truly understand the requirement, so proposals miss the mark." },
  { speaker: "agent", text: "Walk me through how a proposal gets built." },
  { speaker: "user", text: "It's a scramble. We copy-paste from old decks, there's no reuse library, and pricing is worked out at the last minute." },
  { speaker: "agent", text: "How well do you qualify technical fit and competition early?" },
  { speaker: "user", text: "Not well. We find out we're up against an incumbent late, and technical red flags surface after we've invested effort." },
];

const SCRIPTS: Record<DiagnosticFunction, Line[]> = {
  legal: LEGAL,
  it: IT,
  "operational-delivery": OPERATIONAL_DELIVERY,
  sales: SALES,
  leadership: LEADERSHIP,
  culture: CULTURE,
  presales: PRESALES,
};

function ts(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Returns the scripted interview as timestamped transcript turns. */
export function scriptFor(fn: DiagnosticFunction): TranscriptTurn[] {
  const lines = SCRIPTS[fn] ?? LEADERSHIP;
  let clock = 8;
  return lines.map((l) => {
    const turn: TranscriptTurn = { ...l, timestamp: ts(clock) };
    clock += 18 + Math.round((l.text.length / 12) % 14);
    return turn;
  });
}
