"use client";

import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export interface RadarDatum {
  label: string;
  current: number;
  benchmark?: number;
}

/** Split a label into up to two balanced lines so long names don't clip. */
function wrapLabel(text: string): string[] {
  const words = text.split(" ");
  if (words.length < 2 || text.length <= 11) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/** Custom angle-axis tick: wraps long labels and keeps recharts' anchoring. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AngleTick({ x, y, textAnchor, payload }: any) {
  const lines = wrapLabel(String(payload?.value ?? ""));
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="#4A4A4A"
      fontSize={11}
      fontWeight={500}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? (lines.length > 1 ? -1 : 4) : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function RadarScoreChart({
  data,
  accent = "#1E4D5A",
}: {
  data: RadarDatum[];
  accent?: string;
}) {
  const [showBenchmark, setShowBenchmark] = useState(true);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-ink-soft">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
          Current State
        </span>
        <button
          type="button"
          onClick={() => setShowBenchmark((v) => !v)}
          className="inline-flex items-center gap-1.5 text-ink-soft"
        >
          <span
            className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-ink-faint"
            style={{ opacity: showBenchmark ? 1 : 0.35 }}
          />
          Industry Avg
        </button>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={data}
            outerRadius="68%"
            margin={{ top: 20, right: 68, bottom: 20, left: 68 }}
          >
            <PolarGrid stroke="#E8E6E0" />
            <PolarAngleAxis
              dataKey="label"
              tick={(props) => <AngleTick {...props} />}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {showBenchmark && (
              <Radar
                name="Industry Avg"
                dataKey="benchmark"
                stroke="#A8A6A0"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                fill="#A8A6A0"
                fillOpacity={0.06}
              />
            )}
            <Radar
              name="Current State"
              dataKey="current"
              stroke={accent}
              strokeWidth={2.2}
              fill={accent}
              fillOpacity={0.14}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
