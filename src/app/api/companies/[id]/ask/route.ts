import { NextResponse } from "next/server";

import { askGemini, geminiEnabled } from "@/lib/gemini";
import { getCompany, listSessionsByCompany } from "@/lib/store";
import { functionById } from "@/lib/frameworks";

export const dynamic = "force-dynamic";

const MAX_TURNS_PER_TRANSCRIPT = 40;

// POST /api/companies/:id/ask — answer a question grounded in the company's
// analysed diagnostics (scores, risks, recommendations + transcript evidence).
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  let body: { question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = String(body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  const sessions = await listSessionsByCompany(company.id);
  const completed = sessions.filter((s) => s.status === "complete" && s.result);

  if (completed.length === 0) {
    return NextResponse.json({
      answer:
        "There are no analysed diagnostics for this company yet. Import and analyse a transcript first, then I can answer questions about the findings.",
      source: "none",
    });
  }

  if (!geminiEnabled()) {
    return NextResponse.json({
      answer:
        "AI Q&A needs a Gemini API key. Add GEMINI_API_KEY to .env to enable grounded answers about this company's diagnostics.",
      source: "none",
    });
  }

  // Build grounded context from each analysed diagnostic.
  const context = completed
    .map((s) => {
      const fn = functionById(s.function);
      const r = s.result!;
      const risks = r.risks
        .map((x) => `    - [${x.severity}] ${x.title}: ${x.description}`)
        .join("\n");
      const recs = r.recommendations
        .map((x) => `    - [${x.priority}] ${x.title}: ${x.description}`)
        .join("\n");
      const transcript = s.transcript
        .slice(0, MAX_TURNS_PER_TRANSCRIPT)
        .map(
          (t, i) =>
            `    [${i}] ${t.speaker === "agent" ? "Consultant" : "Stakeholder"}: ${t.text}`,
        )
        .join("\n");
      return [
        `### ${fn.label} — "${s.title ?? "Transcript"}" (overall ${r.overallScore}/100)`,
        `  Executive summary: ${r.executiveSummary}`,
        `  Risks:\n${risks || "    (none)"}`,
        `  Recommendations:\n${recs || "    (none)"}`,
        `  Transcript excerpt:\n${transcript}`,
      ].join("\n");
    })
    .join("\n\n");

  const prompt = `You are a management consultant assistant answering questions about ${company.name}'s diagnostic results.

Use ONLY the context below. If the answer isn't in the context, say so plainly. Be concise and specific. When you reference a finding, name the business function it came from. Do not invent facts.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;

  try {
    const answer = await askGemini(prompt);
    return NextResponse.json({ answer: answer.trim(), source: "gemini" });
  } catch {
    return NextResponse.json(
      { error: "The AI could not answer right now. Please retry." },
      { status: 502 },
    );
  }
}
