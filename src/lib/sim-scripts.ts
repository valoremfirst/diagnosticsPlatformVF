import type { DiagnosticFunction, TranscriptTurn } from "./types";

/**
 * Lightweight scripted interviews used by the live-session simulator when no
 * ElevenLabs agent is configured. Kept separate from mock-data so the heavy
 * result fixtures never reach the client bundle.
 */

type Line = { speaker: "agent" | "user"; text: string };

const FINANCE: Line[] = [
  { speaker: "agent", text: "Thanks for the time. How clear is your real-time visibility over revenue across the group right now?" },
  { speaker: "user", text: "Honestly patchy. We close around working day eight, so leadership steers on numbers that are three to four weeks old." },
  { speaker: "agent", text: "Is the month-end consolidation manual?" },
  { speaker: "user", text: "Very. We pull three ledgers into a master spreadsheet by hand, and one analyst owns it — if she's away, close slips." },
  { speaker: "agent", text: "Do budget holders see spend against budget in-month, or only after close?" },
  { speaker: "user", text: "Only after close, via a monthly PDF. Overspend is usually found after the fact — we've had a few nasty surprises." },
  { speaker: "agent", text: "How confident are you in the thirteen-week cash forecast?" },
  { speaker: "user", text: "It's a static model refreshed monthly, so it drifts. Accuracy is maybe sixty percent by week three." },
  { speaker: "agent", text: "When you invest, do you track whether the benefits actually land?" },
  { speaker: "user", text: "No — benefits realisation isn't tracked. Once a business case is approved, nobody revisits it." },
];

const HR: Line[] = [
  { speaker: "agent", text: "Let's start with retention — what's voluntary turnover over the last year?" },
  { speaker: "user", text: "High. Around twenty-four percent overall, closer to thirty-five on the frontline. We're constantly rehiring." },
  { speaker: "agent", text: "Do you have structured exit data to understand why?" },
  { speaker: "user", text: "We run exit interviews but the notes just sit in a folder. Nobody themes them or reports trends." },
  { speaker: "agent", text: "How much of the HR team's time goes on manual admin?" },
  { speaker: "user", text: "Too much — maybe sixty percent chasing paper. Holidays are on email and the HRIS we bought is barely adopted." },
  { speaker: "agent", text: "How confident are you on compliance — would you pass an audit tomorrow?" },
  { speaker: "user", text: "Nervous. Training records are in spreadsheets with no expiry alerts. We'd probably find gaps." },
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

const OPERATIONS: Line[] = [
  { speaker: "agent", text: "How standardised are your core operational processes across sites?" },
  { speaker: "user", text: "They vary a lot. Each site has its own way of working and there's little documented standard work." },
  { speaker: "agent", text: "How do you plan capacity against demand?" },
  { speaker: "user", text: "Mostly reactively. We firefight peaks with overtime rather than planning ahead with data." },
  { speaker: "agent", text: "Is there a continuous improvement routine?" },
  { speaker: "user", text: "Not really structured. Good ideas happen but they aren't captured or rolled out across the network." },
];

const LEADERSHIP: Line[] = [
  { speaker: "agent", text: "How clearly is the strategy understood below the executive team?" },
  { speaker: "user", text: "Patchy. The exec aligns but it dilutes as it cascades — middle managers interpret priorities differently." },
  { speaker: "agent", text: "How disciplined is your decision-making and governance?" },
  { speaker: "user", text: "Decisions can drift. We revisit the same topics and accountability for outcomes isn't always clear." },
  { speaker: "agent", text: "How strong is your leadership bench and succession plan?" },
  { speaker: "user", text: "Thin, honestly. We have a few key people we couldn't easily replace and no real succession planning." },
];

const SCRIPTS: Record<DiagnosticFunction, Line[]> = {
  finance: FINANCE,
  hr: HR,
  it: IT,
  sales: SALES,
  operations: OPERATIONS,
  leadership: LEADERSHIP,
};

function ts(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Returns the scripted interview as timestamped transcript turns. */
export function scriptFor(fn: DiagnosticFunction): TranscriptTurn[] {
  const lines = SCRIPTS[fn] ?? FINANCE;
  let clock = 8;
  return lines.map((l) => {
    const turn: TranscriptTurn = { ...l, timestamp: ts(clock) };
    clock += 18 + Math.round((l.text.length / 12) % 14);
    return turn;
  });
}
