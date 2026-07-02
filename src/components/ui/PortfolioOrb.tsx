"use client";

import { useEffect, useState } from "react";

import { Orb } from "./Orb";

/**
 * Client wrapper so the orb on the (server) portfolio page hydrates correctly
 * and its breathing animation runs. Slowly pulses through idle → listening
 * every 10 s to feel alive without being distracting.
 */
export function PortfolioOrb({ size = 104 }: { size?: number }) {
  const [state, setState] = useState<"idle" | "listening">("idle");

  useEffect(() => {
    const cycle = () => {
      setState("listening");
      const back = setTimeout(() => setState("idle"), 3000);
      return back;
    };

    // First pulse after 6 s, then every 12 s.
    const first = setTimeout(() => {
      cycle();
      const interval = setInterval(cycle, 12000);
      return () => clearInterval(interval);
    }, 6000);

    return () => clearTimeout(first);
  }, []);

  return <Orb agent="george" state={state} size={size} />;
}
