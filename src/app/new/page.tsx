"use client";

import { ArrowRight, Loader2, Mic, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AgentSelector } from "@/components/AgentSelector";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { elevenLabsConfigured } from "@/lib/elevenlabs";
import { FRAMEWORKS, functionById } from "@/lib/frameworks";
import type { DiagnosticFunction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewDiagnosticPage() {
  const router = useRouter();
  const [fn, setFn] = useState<DiagnosticFunction | null>("finance");
  const [companyName, setCompanyName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [sector, setSector] = useState("");
  const [notes, setNotes] = useState("");
  const [frameworks, setFrameworks] = useState<string[]>(
    FRAMEWORKS.map((f) => f.name),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = fn ? functionById(fn) : null;
  const live = fn ? elevenLabsConfigured(fn) : false;
  const canSubmit = Boolean(fn && companyName.trim() && frameworks.length > 0);

  function toggleFramework(name: string) {
    setFrameworks((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name],
    );
  }

  async function handleStart() {
    if (!canSubmit || !fn) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          function: fn,
          clientContact: clientContact.trim() || undefined,
          sector: sector.trim() || undefined,
          notes: notes.trim() || undefined,
          selectedFrameworks: frameworks,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create diagnostic.");
      }
      const { session } = await res.json();
      router.push(`/session/${session.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "New Diagnostic" }]}
        title="Start a new diagnostic"
        description="Configure the engagement, choose a domain consultant and select the frameworks to score against. The agent will run a structured voice interview."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Function selector */}
          <Card className="px-6 py-5">
            <div className="mb-4">
              <h2 className="font-display text-lg text-ink">Business function</h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Each domain loads a purpose-built ElevenLabs agent.
              </p>
            </div>
            <AgentSelector value={fn} onChange={setFn} />
          </Card>

          {/* Client context */}
          <Card className="px-6 py-5">
            <h2 className="mb-4 font-display text-lg text-ink">Client context</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" required>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Meridian Logistics Group"
                  className={inputClass}
                />
              </Field>
              <Field label="Sector">
                <input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Logistics & Supply Chain"
                  className={inputClass}
                />
              </Field>
              <Field label="Stakeholder / contact">
                <input
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  placeholder="e.g. CFO"
                  className={inputClass}
                />
              </Field>
              <Field label="Notes">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional engagement context"
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          {/* Frameworks */}
          <Card className="px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-ink">Scoring frameworks</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {frameworks.length} of {FRAMEWORKS.length} selected
                </p>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {FRAMEWORKS.map((f) => {
                const on = frameworks.includes(f.name);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFramework(f.name)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      on
                        ? "border-teal bg-teal-tint"
                        : "border-line bg-surface hover:bg-surface-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        on ? "border-teal bg-teal text-white" : "border-line-strong",
                      )}
                    >
                      {on && "✓"}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{f.name}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {f.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Summary rail */}
        <div className="lg:col-span-1">
          <div className="sticky top-[88px] space-y-4">
            <Card className="px-6 py-5">
              <h2 className="font-display text-lg text-ink">Session setup</h2>

              <div className="mt-4 space-y-3 text-sm">
                <Row label="Agent">
                  {agent ? `${agent.agentName} · ${agent.label}` : "—"}
                </Row>
                <Row label="Frameworks">{frameworks.length}</Row>
                <Row label="Mode">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                      live ? "bg-positive/10 text-positive" : "bg-sand/15 text-gold",
                    )}
                  >
                    {live ? <Radio className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    {live ? "Live ElevenLabs" : "Simulated voice"}
                  </span>
                </Row>
              </div>

              {!live && (
                <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                  No ElevenLabs agent configured for this function — the session
                  will run a realistic transcript simulation. Add{" "}
                  <code className="text-[11px]">{agent?.publicAgentEnv}</code> to
                  go live.
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  {error}
                </p>
              )}

              <Button
                className="mt-5 w-full"
                size="lg"
                disabled={!canSubmit || submitting}
                onClick={handleStart}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Start voice session
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  );
}
