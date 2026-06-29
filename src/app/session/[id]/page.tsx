"use client";

import { Bot, CircleHelp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState, ProcessingStages, PROCESSING_STAGES } from "@/components/States";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { Card } from "@/components/ui/Card";
import { VoiceSessionControls, type SessionPhase } from "@/components/VoiceSessionControls";
import { elevenLabsConfigured } from "@/lib/elevenlabs";
import { functionById } from "@/lib/frameworks";
import { scriptFor } from "@/lib/sim-scripts";
import type { DiagnosticSession, TranscriptTurn } from "@/lib/types";

export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [processingStage, setProcessingStage] = useState(0);
  const [analyseError, setAnalyseError] = useState<string | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  // Authoritative transcript accumulator — avoids impure setState updaters.
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const processingStarted = useRef(false);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  // Load the session.
  useEffect(() => {
    let active = true;
    fetch(`/api/diagnostics/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Diagnostic not found.");
        return r.json();
      })
      .then((data) => {
        if (active) setSession(data.session);
      })
      .catch((e) => active && setLoadError((e as Error).message));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => clearAll, [clearAll]);

  const fn = session ? functionById(session.function) : null;
  const live = session ? elevenLabsConfigured(session.function) : false;
  const script = session ? scriptFor(session.function) : [];
  const currentQuestion =
    [...transcript].reverse().find((t) => t.speaker === "agent")?.text ??
    "Waiting to begin…";

  async function runProcessing(finalTranscript: TranscriptTurn[]) {
    if (processingStarted.current) return;
    processingStarted.current = true;
    setPhase("ended");
    setAnalyseError(null);
    // Persist transcript.
    try {
      await fetch(`/api/diagnostics/${id}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript }),
      });
    } catch {
      /* non-fatal for the demo store */
    }

    // Staged loading messages while analysis runs.
    for (let i = 1; i < PROCESSING_STAGES.length; i++) {
      timers.current.push(
        setTimeout(() => setProcessingStage(i), i * 700),
      );
    }

    try {
      const res = await fetch(`/api/diagnostics/${id}/analyse`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed.");
      }
      // Let the final stage show briefly, then navigate to results.
      timers.current.push(
        setTimeout(() => {
          setProcessingStage(PROCESSING_STAGES.length);
          router.push(`/diagnostics/${id}`);
        }, PROCESSING_STAGES.length * 700 + 400),
      );
    } catch (e) {
      setAnalyseError((e as Error).message);
    }
  }

  function start() {
    if (!session) return;
    setPhase("connecting");
    transcriptRef.current = [];
    processingStarted.current = false;
    setTranscript([]);
    setSeconds(0);

    // NOTE: when a NEXT_PUBLIC_ELEVENLABS_AGENT_ID_* is set, wire the
    // @elevenlabs/react useConversation hook here and stream live transcript
    // turns into transcriptRef/setTranscript. The simulator below mirrors that UX.
    timers.current.push(
      setTimeout(() => {
        setPhase("live");
        tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);

        // Stream the scripted interview turn-by-turn.
        let delay = 900;
        script.forEach((turn, i) => {
          const gap = 1100 + turn.text.length * 22;
          delay += gap;
          timers.current.push(
            setTimeout(() => {
              transcriptRef.current = [...transcriptRef.current, turn];
              setTranscript(transcriptRef.current);
              if (i === script.length - 1) {
                timers.current.push(
                  setTimeout(() => {
                    clearAll();
                    void runProcessing(transcriptRef.current);
                  }, 1400),
                );
              }
            }, delay),
          );
        });
      }, 1200),
    );
  }

  function end() {
    clearAll();
    const finalT = transcriptRef.current.length
      ? transcriptRef.current
      : script.slice(0, 4);
    transcriptRef.current = finalT;
    setTranscript(finalT);
    void runProcessing(finalT);
  }

  if (loadError) {
    return (
      <ErrorState
        title="Session unavailable"
        description={loadError}
        onRetry={() => router.push("/history")}
      />
    );
  }
  if (!session || !fn) return <LoadingState label="Loading session…" />;

  const processing = phase === "ended";

  return (
    <div className="animate-fade-in">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Diagnostic Sessions", href: "/history" },
          { label: session.companyName },
        ]}
        title="Live diagnostic session"
        description={`${fn.agentName}, ${fn.agentTitle}, is conducting a structured voice interview.`}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: agent + controls (or processing) */}
        <div className="space-y-6 lg:col-span-3">
          {/* Agent identity */}
          <Card className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-deep text-white">
              <Bot className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl text-ink">{fn.agentName}</h2>
                <span className="rounded-md bg-teal-tint px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal">
                  {live ? "Live agent" : "Simulated"}
                </span>
              </div>
              <p className="text-sm text-ink-muted">{fn.agentTitle}</p>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xs text-ink-faint">Client</div>
              <div className="text-sm font-medium text-ink">{session.companyName}</div>
            </div>
          </Card>

          {!processing ? (
            <>
              <VoiceSessionControls
                phase={phase}
                seconds={seconds}
                muted={muted}
                live={live}
                onStart={start}
                onEnd={end}
                onToggleMute={() => setMuted((m) => !m)}
              />

              {/* Current question / status */}
              <Card className="px-6 py-5">
                <div className="flex items-center gap-2 label-eyebrow">
                  <CircleHelp className="h-3.5 w-3.5" />
                  Current line of questioning
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  {phase === "idle"
                    ? "Press start to begin the interview. The agent will probe across the key areas for this function."
                    : currentQuestion}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {fn.probesFor.map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-soft"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="px-6 py-6">
              <h2 className="font-display text-xl text-ink">Analysing transcript</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {analyseError
                  ? "Analysis hit a problem."
                  : "Gemini is scoring the interview against the selected frameworks."}
              </p>
              <div className="mt-5">
                {analyseError ? (
                  <ErrorState
                    title="Analysis failed"
                    description={analyseError}
                    onRetry={() => {
                      setProcessingStage(0);
                      processingStarted.current = false;
                      void runProcessing(transcriptRef.current);
                    }}
                  />
                ) : (
                  <ProcessingStages activeStage={processingStage} />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: live transcript */}
        <div className="lg:col-span-2">
          <Card className="flex h-[560px] flex-col px-5 py-5">
            <TranscriptPanel
              transcript={transcript}
              sessionLabel={`SESSION ${session.id.toUpperCase()}`}
              subtitle={`${fn.label} interview${session.clientContact ? ` · ${session.clientContact}` : ""}`}
              liveCursor={phase === "live"}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
