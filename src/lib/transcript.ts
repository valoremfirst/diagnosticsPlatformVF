import type { Speaker, TranscriptTurn } from "./types";

// Maps a manually pasted transcript into structured turns.
//
// Supports lines prefixed with a speaker label, e.g.
//   "Consultant: How clear is your revenue visibility?"
//   "Stakeholder: Honestly it's patchy."
// and also bare lines, which alternate speakers starting with the consultant.
// An optional leading "[mm:ss]" or "00:00:12" timestamp is preserved.

const AGENT_LABELS = [
  "agent",
  "consultant",
  "interviewer",
  "advisor",
  "aria",
  "q",
  "question",
];
const USER_LABELS = [
  "user",
  "stakeholder",
  "client",
  "respondent",
  "customer",
  "a",
  "answer",
];

const TIMESTAMP_RE = /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*/;

function classify(label: string): Speaker | null {
  const l = label.trim().toLowerCase();
  if (AGENT_LABELS.includes(l)) return "agent";
  if (USER_LABELS.includes(l)) return "user";
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function stamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `00:${pad(m)}:${pad(s)}`;
}

export function parseTranscriptText(raw: string): TranscriptTurn[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns: TranscriptTurn[] = [];
  let lastSpeaker: Speaker = "user"; // so the first bare line becomes "agent"
  let clock = 8;

  for (const line of lines) {
    let working = line;
    let timestamp: string | null = null;

    const ts = working.match(TIMESTAMP_RE);
    if (ts) {
      timestamp = ts[1].length <= 5 ? `00:${ts[1]}` : ts[1];
      working = working.replace(TIMESTAMP_RE, "");
    }

    let speaker: Speaker | null = null;
    const colon = working.indexOf(":");
    if (colon > 0 && colon <= 16) {
      const maybe = classify(working.slice(0, colon));
      if (maybe) {
        speaker = maybe;
        working = working.slice(colon + 1).trim();
      }
    }

    if (!working) continue;

    if (!speaker) speaker = lastSpeaker === "agent" ? "user" : "agent";
    lastSpeaker = speaker;

    if (!timestamp) {
      timestamp = stamp(clock);
      clock += 17;
    }

    turns.push({ speaker, text: working, timestamp });
  }

  return turns;
}

/** Render structured turns back to editable text for the textarea. */
export function transcriptToText(turns: TranscriptTurn[]): string {
  return turns
    .map(
      (t) => `${t.speaker === "agent" ? "Consultant" : "Stakeholder"}: ${t.text}`,
    )
    .join("\n");
}
