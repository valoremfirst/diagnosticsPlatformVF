"use client";

import { Mic, MicOff, PhoneOff, Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn, formatDuration } from "@/lib/utils";

export type SessionPhase = "idle" | "connecting" | "live" | "ended";

export function VoiceSessionControls({
  phase,
  seconds,
  muted,
  live,
  onStart,
  onEnd,
  onToggleMute,
}: {
  phase: SessionPhase;
  seconds: number;
  muted: boolean;
  live: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          {phase === "live" && (
            <span className="absolute inset-0 rounded-full bg-teal/30 animate-pulse-ring" />
          )}
          <span
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-full",
              phase === "live" ? "bg-teal text-white" : "bg-surface-muted text-ink-muted",
            )}
          >
            <Mic className="h-5 w-5" />
          </span>
        </div>
        <div>
          <div className="font-display text-2xl tabular-nums text-ink">
            {formatDuration(seconds)}
          </div>
          <div className="text-xs text-ink-muted">
            {phase === "idle" && "Ready to start"}
            {phase === "connecting" && "Connecting to agent…"}
            {phase === "live" && (live ? "Live interview in progress" : "Simulated interview")}
            {phase === "ended" && "Session ended"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {phase === "idle" && (
          <Button size="lg" onClick={onStart}>
            <Play className="h-4 w-4" />
            Start Voice Session
          </Button>
        )}
        {(phase === "live" || phase === "connecting") && (
          <>
            <Button variant="outline" size="lg" onClick={onToggleMute}>
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button variant="danger" size="lg" onClick={onEnd}>
              <PhoneOff className="h-4 w-4" />
              End Session
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
