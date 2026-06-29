"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { scoreTone } from "@/lib/utils";

export interface CriteriaDatum {
  name: string;
  score: number;
}

export function CriteriaBarChart({ data }: { data: CriteriaDatum[] }) {
  const height = Math.max(180, data.length * 38);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 36, bottom: 4, left: 8 }}
          barCategoryGap={10}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#4A4A4A", fontSize: 12 }}
          />
          <Bar dataKey="score" radius={[4, 4, 4, 4]} barSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={scoreTone(d.score).hex} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              className="fill-ink-soft"
              style={{ fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
