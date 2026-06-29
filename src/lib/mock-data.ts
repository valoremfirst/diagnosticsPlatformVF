import type { Company, DiagnosticSession } from "./types";

// ---------------------------------------------------------------------------
// Seed companies. The platform ships with the two real companies; further
// companies are created at runtime via the "Add company" flow. There is no
// seeded diagnostic data — all transcripts are uploaded and analysed live.
// ---------------------------------------------------------------------------

export const MOCK_COMPANIES: Company[] = [
  {
    id: "ccg",
    name: "CCG",
    shortName: "CCG",
    brandColor: "#2563A8",
    sector: "Professional Services",
    tagline: "Consulting & advisory group",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "valorem-first",
    name: "Valorem First",
    shortName: "VF",
    brandColor: "#1E4D5A",
    sector: "Business Transformation",
    tagline: "Value-led transformation partner",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
];

export const MOCK_SESSIONS: DiagnosticSession[] = [];
