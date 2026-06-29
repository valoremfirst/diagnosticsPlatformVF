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
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#E8E6E0" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "#4A4A4A", fontSize: 12 }}
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
