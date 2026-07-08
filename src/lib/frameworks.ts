import type { DiagnosticFunction } from "./types";

// ---------------------------------------------------------------------------
// Diagnostic frameworks and their scored criteria (from the build brief).
// ---------------------------------------------------------------------------

export interface FrameworkDefinition {
  id: string;
  name: string;
  short: string;
  description: string;
  criteria: string[];
}

export const FRAMEWORKS: FrameworkDefinition[] = [
  // --- Operations & process ------------------------------------------------
  {
    id: "lean-six-sigma",
    name: "Lean / Six Sigma",
    short: "Lean Six Sigma",
    description:
      "Operational efficiency, variance reduction and process maturity.",
    criteria: [
      "Waste identification",
      "Process variation",
      "Standardisation",
      "Root cause discipline",
      "Continuous improvement maturity",
      "DMAIC alignment",
    ],
  },
  {
    id: "operational-excellence",
    name: "Operational Excellence",
    short: "Ops Excellence",
    description:
      "Standard work, flow efficiency and performance-managed delivery.",
    criteria: [
      "Standard work & documentation",
      "Flow & cycle-time efficiency",
      "Performance management",
      "Problem-solving discipline",
      "Resource & capacity planning",
      "Continuous improvement cadence",
    ],
  },
  // --- Technology ----------------------------------------------------------
  {
    id: "digital-maturity",
    name: "Digital Maturity",
    short: "Digital Maturity",
    description: "Automation, integration, data quality and AI readiness.",
    criteria: [
      "Automation level",
      "System integration",
      "Data quality",
      "Workflow digitisation",
      "AI readiness",
      "User adoption",
    ],
  },
  {
    id: "it-resilience",
    name: "IT Resilience",
    short: "IT Resilience",
    description: "Availability, recovery, cyber resilience and continuity.",
    criteria: [
      "Availability",
      "Backup and recovery",
      "Cyber resilience",
      "Incident response",
      "System dependency risk",
      "Operational continuity",
    ],
  },
  {
    id: "nist-csf",
    name: "NIST Cybersecurity Framework",
    short: "NIST CSF",
    description:
      "Cyber maturity across the identify-protect-detect-respond-recover functions.",
    criteria: [
      "Identify (asset & risk visibility)",
      "Protect (controls & access)",
      "Detect (monitoring)",
      "Respond (incident handling)",
      "Recover (continuity)",
    ],
  },
  // --- Finance & governance ------------------------------------------------
  {
    id: "finance-roi",
    name: "Finance / ROI Maturity",
    short: "Finance / ROI",
    description: "Cost visibility, ROI discipline and investment governance.",
    criteria: [
      "Cost visibility",
      "ROI discipline",
      "Budget ownership",
      "Forecasting maturity",
      "Benefits tracking",
      "Investment governance",
    ],
  },
  {
    id: "coso-controls",
    name: "COSO Internal Control",
    short: "COSO Controls",
    description:
      "Internal-control environment, risk assessment and monitoring.",
    criteria: [
      "Control environment",
      "Risk assessment",
      "Control activities",
      "Information & communication",
      "Monitoring activities",
    ],
  },
  {
    id: "governance-maturity",
    name: "Corporate Governance Maturity",
    short: "Governance",
    description:
      "Board effectiveness, decision rights, accountability and oversight.",
    criteria: [
      "Board & committee effectiveness",
      "Decision rights & delegation",
      "Accountability & controls",
      "Transparency & reporting",
      "Stakeholder oversight",
    ],
  },
  {
    id: "strategic-planning",
    name: "Strategic Planning & Execution",
    short: "Strategy",
    description:
      "Strategy clarity, goal cascade and disciplined execution.",
    criteria: [
      "Strategy clarity",
      "Goal cascade & alignment",
      "Execution discipline",
      "Resource alignment",
      "Performance review cadence",
    ],
  },
  // --- Legal & compliance --------------------------------------------------
  {
    id: "compliance-management",
    name: "Compliance Management",
    short: "Compliance",
    description:
      "Regulatory adherence, policy framework and breach management.",
    criteria: [
      "Regulatory adherence",
      "Policy framework",
      "Compliance monitoring",
      "Training & awareness",
      "Breach & incident management",
    ],
  },
  {
    id: "legal-ops",
    name: "Legal Operations Maturity",
    short: "Legal Ops",
    description:
      "Matter management, contract lifecycle and legal-spend efficiency.",
    criteria: [
      "Matter management",
      "Contract lifecycle management",
      "External counsel & spend",
      "Legal technology adoption",
      "Self-service enablement",
    ],
  },
  // --- Commercial ----------------------------------------------------------
  {
    id: "sales-maturity",
    name: "Sales Maturity Model",
    short: "Sales Maturity",
    description:
      "Pipeline discipline, forecasting accuracy and CRM adoption.",
    criteria: [
      "Pipeline management",
      "Sales process discipline",
      "Forecasting accuracy",
      "CRM adoption & hygiene",
      "Win/loss discipline",
    ],
  },
  {
    id: "customer-experience",
    name: "Customer Experience Maturity",
    short: "CX Maturity",
    description:
      "Customer insight, journey design, retention and feedback loops.",
    criteria: [
      "Customer insight",
      "Journey design",
      "Service consistency",
      "Retention & loyalty",
      "Feedback loops",
    ],
  },
  {
    id: "presales-maturity",
    name: "Presales / Solution Consulting Maturity",
    short: "Presales",
    description:
      "Discovery, solution design, proposal quality and technical win rate.",
    criteria: [
      "Discovery & qualification",
      "Solution design",
      "Proposal & bid quality",
      "Technical win rate",
      "Competitive positioning",
    ],
  },
  // --- People --------------------------------------------------------------
  {
    id: "culture-maturity",
    name: "Organisational Culture Maturity",
    short: "Culture",
    description:
      "Engagement, psychological safety, values and inclusion.",
    criteria: [
      "Employee engagement",
      "Psychological safety",
      "Values alignment",
      "Recognition",
      "Inclusion & belonging",
    ],
  },
  {
    id: "talent-capability",
    name: "HR & Talent Capability",
    short: "Talent",
    description:
      "Resourcing, development, performance and succession.",
    criteria: [
      "Resourcing & recruitment",
      "Learning & development",
      "Performance management",
      "Succession planning",
      "Retention drivers",
    ],
  },
  // --- Cross-functional ----------------------------------------------------
  {
    id: "balanced-scorecard",
    name: "Balanced Scorecard",
    short: "Balanced Scorecard",
    description:
      "Financial, customer, internal process and learning perspectives.",
    criteria: [
      "Financial performance",
      "Customer outcomes",
      "Internal process maturity",
      "Learning and growth",
      "Strategic alignment",
    ],
  },
];

export const FRAMEWORK_NAMES = FRAMEWORKS.map((f) => f.name);

export function frameworkByName(name: string): FrameworkDefinition | undefined {
  return FRAMEWORKS.find(
    (f) => f.name.toLowerCase() === name.toLowerCase() || f.id === name,
  );
}

export function frameworkById(id: string): FrameworkDefinition | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}

/**
 * Which frameworks are actually relevant to each business function. A function
 * is scored ONLY against these — not the whole catalogue — so an IT interview
 * isn't graded on Legal Ops, etc. Every function includes a cross-functional
 * lens (Balanced Scorecard or Digital Maturity) plus its discipline-specific
 * frameworks. Keep each list tight (~3) so scoring stays focused.
 */
export const FUNCTION_FRAMEWORKS: Record<DiagnosticFunction, string[]> = {
  finance: ["coso-controls", "finance-roi", "balanced-scorecard"],
  legal: ["compliance-management", "legal-ops", "governance-maturity"],
  it: ["nist-csf", "it-resilience", "digital-maturity"],
  "operational-delivery": [
    "lean-six-sigma",
    "operational-excellence",
    "balanced-scorecard",
  ],
  sales: ["sales-maturity", "customer-experience", "balanced-scorecard"],
  leadership: ["governance-maturity", "strategic-planning", "balanced-scorecard"],
  culture: ["culture-maturity", "talent-capability", "balanced-scorecard"],
  presales: ["presales-maturity", "sales-maturity", "digital-maturity"],
};

/** The framework definitions relevant to a function, in display order. */
export function frameworksForFunction(
  fn: DiagnosticFunction,
): FrameworkDefinition[] {
  const ids = FUNCTION_FRAMEWORKS[fn] ?? [];
  return ids
    .map((id) => frameworkById(id))
    .filter((f): f is FrameworkDefinition => Boolean(f));
}

// ---------------------------------------------------------------------------
// Business functions and their configured ElevenLabs agents.
// ---------------------------------------------------------------------------

export interface FunctionDefinition {
  id: DiagnosticFunction;
  label: string;
  agentName: string;
  agentTitle: string;
  blurb: string;
  /** Env var holding the public ElevenLabs agent id for the browser SDK. */
  publicAgentEnv: string;
  probesFor: string[];
}

export const FUNCTIONS: FunctionDefinition[] = [
  {
    id: "finance",
    label: "Finance",
    agentName: "Nora",
    agentTitle: "Finance & Commercial Performance Consultant",
    blurb:
      "Probes cashflow, budgeting and forecasting, financial controls, management reporting and ROI discipline.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_FINANCE",
    probesFor: [
      "Cashflow management",
      "Budgeting & forecasting",
      "Financial controls",
      "Management reporting",
      "Working capital",
      "Cost management",
      "ROI discipline",
      "Audit readiness",
    ],
  },
  {
    id: "legal",
    label: "Legal",
    agentName: "Alex",
    agentTitle: "Senior Legal & Compliance Consultant",
    blurb:
      "Probes contract management, compliance posture, regulatory risk and legal spend efficiency.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_LEGAL",
    probesFor: [
      "Contract management",
      "Compliance posture",
      "Regulatory risk",
      "GDPR & data privacy",
      "Legal spend",
      "IP protection",
      "Dispute exposure",
      "Policy maturity",
    ],
  },
  {
    id: "it",
    label: "IT",
    agentName: "Sol",
    agentTitle: "IT Resilience & Digital Maturity Consultant",
    blurb:
      "Probes availability, cyber controls, backup, incident response and integration.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_IT",
    probesFor: [
      "System availability",
      "Cyber controls",
      "Backup and recovery",
      "Incident response",
      "Integration gaps",
      "Manual workarounds",
      "Shadow IT",
    ],
  },
  {
    id: "operational-delivery",
    label: "Operational Delivery",
    agentName: "Theo",
    agentTitle: "Operational Delivery Consultant",
    blurb:
      "Probes delivery cadence, project governance, SLA adherence and resource allocation.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_OPERATIONAL_DELIVERY",
    probesFor: [
      "Delivery cadence",
      "Project governance",
      "SLA adherence",
      "Resource allocation",
      "Milestone tracking",
      "Risk management",
      "Stakeholder reporting",
    ],
  },
  {
    id: "sales",
    label: "Sales",
    agentName: "George",
    agentTitle: "Sales Operations Consultant",
    blurb:
      "Probes pipeline visibility, CRM usage, conversion and forecast accuracy.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_SALES",
    probesFor: [
      "Pipeline visibility",
      "CRM usage",
      "Conversion rates",
      "Sales process consistency",
      "Forecast accuracy",
      "Lead sources",
      "Customer retention",
    ],
  },
  {
    id: "leadership",
    label: "Executive / Leadership",
    agentName: "Iris",
    agentTitle: "Executive Strategy & Leadership Consultant",
    blurb:
      "Probes strategic alignment, governance, decision discipline and execution cadence.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_LEADERSHIP",
    probesFor: [
      "Strategic clarity",
      "Decision discipline",
      "Governance",
      "Execution cadence",
      "Talent & succession",
      "Change capability",
    ],
  },
  {
    id: "culture",
    label: "Culture",
    agentName: "Devin",
    agentTitle: "Culture & People Consultant",
    blurb:
      "Probes employee engagement, values alignment, wellbeing and organisational health.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_CULTURE",
    probesFor: [
      "Employee engagement",
      "Values alignment",
      "DEI maturity",
      "Wellbeing",
      "Recognition",
      "Leadership culture",
      "Retention drivers",
    ],
  },
  {
    id: "presales",
    label: "Presales",
    agentName: "Maya",
    agentTitle: "Presales & Solution Consulting Lead",
    blurb:
      "Probes win rate, discovery quality, proposal process, technical qualification and bid management.",
    publicAgentEnv: "NEXT_PUBLIC_ELEVENLABS_AGENT_ID_PRESALES",
    probesFor: [
      "Win rate",
      "Discovery quality",
      "Proposal process",
      "Technical qualification",
      "Bid management",
      "Solution design",
      "Competitor intelligence",
    ],
  },
];

export function functionById(id: DiagnosticFunction): FunctionDefinition {
  return FUNCTIONS.find((f) => f.id === id) ?? FUNCTIONS[0];
}

// ---------------------------------------------------------------------------
// ElevenLabs agent system-prompt templates per function.
// ---------------------------------------------------------------------------

export function agentSystemPrompt(fn: FunctionDefinition): string {
  return [
    `You are ${fn.agentName}, a ${fn.agentTitle}.`,
    `You are running a structured, voice-led discovery interview as part of a business diagnostic.`,
    ``,
    `Conduct the conversation like an experienced consultant: warm but rigorous.`,
    `Ask one focused question at a time, listen, then probe deeper with a follow-up.`,
    `Anchor questions in concrete numbers, systems, owners and recent examples.`,
    ``,
    `Specifically probe for:`,
    ...fn.probesFor.map((p) => `- ${p}`),
    ``,
    `Avoid leading the witness or suggesting answers. Capture evidence, not opinions.`,
    `Keep turns concise and conversational for a spoken interview. Close by summarising`,
    `the key themes you heard and confirming them with the stakeholder.`,
  ].join("\n");
}
