"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { scoreTone } from "@/lib/utils";

// Shared brand palette (mirrors the score/severity tokens in utils.ts).
const BAND_COLOR: Record<string, string> = {
  low: "#A84A3D",
  developing: "#C9874A",
  established: "#D4A865",
  advanced: "#2E6B7A",
  leading: "#3D7A5C",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#A84A3D",
  high: "#C9874A",
  medium: "#D4A865",
  low: "#A8A6A0",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "#A84A3D",
  medium: "#C9874A",
  low: "#A8A6A0",
};

export interface AnalyticsData {
  maturityByFunction: { label: string; score: number; count: number }[];
  bandDistribution: { band: string; label: string; count: number }[];
  riskBySeverity: { severity: string; label: string; count: number }[];
  /** Omitted for single-company analytics (a leaderboard of one is meaningless). */
  companyRanking?: { name: string; score: number; brandColor: string }[];
  overTime: { month: string; count: number; cumulative: number }[];
  frameworkScores: { name: string; score: number }[];
  recByPriority: { priority: string; label: string; count: number }[];
  portfolioScore: number;
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="border-b border-line px-6 pt-5 pb-4">
        <h3 className="font-display text-lg leading-tight text-ink">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: Record<string, unknown> }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const heading = (p.payload?.label as string) ?? label ?? p.name;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <div className="font-semibold text-ink">{heading}</div>
      <div className="mt-0.5 text-ink-soft">
        {p.value}
        {suffix}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function AnalyticsCharts({
  data,
  accent = "#1E4D5A",
}: {
  data: AnalyticsData;
  /** Line/area accent for the time series — brand-themed on the client view. */
  accent?: string;
}) {
  const totalRisks = data.riskBySeverity.reduce((a, b) => a + b.count, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Maturity by function — vertical bars, tone-coloured */}
      <ChartCard
        title="Maturity by function"
        subtitle="Average diagnostic score across each business function"
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.maturityByFunction}
              margin={{ top: 16, right: 8, bottom: 4, left: -16 }}
              barCategoryGap={18}
            >
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: "#4A4A4A", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#A8A6A0", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(30,77,90,0.05)" }}
                content={<ChartTooltip suffix=" / 100" />}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {data.maturityByFunction.map((d, i) => (
                  <Cell key={i} fill={scoreTone(d.score).hex} />
                ))}
                <LabelList
                  dataKey="score"
                  position="top"
                  className="fill-ink-soft"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Overall maturity — radial gauge */}
      <ChartCard
        title="Overall maturity"
        subtitle="Average across every completed diagnostic"
      >
        <div className="relative h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={[{ name: "score", value: data.portfolioScore }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                tick={false}
              />
              <RadialBar
                background={{ fill: "#EFEDE7" }}
                dataKey="value"
                cornerRadius={999}
                fill={scoreTone(data.portfolioScore).hex}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display text-[56px] leading-none"
              style={{ color: scoreTone(data.portfolioScore).hex }}
            >
              {data.portfolioScore}
            </span>
            <span className="mt-1 text-xs uppercase tracking-[0.12em] text-ink-faint">
              out of 100
            </span>
          </div>
        </div>
      </ChartCard>

      {/* Diagnostics over time — area chart */}
      <ChartCard
        title="Diagnostics over time"
        subtitle="Completed diagnostics per month and running total"
        className="lg:col-span-2"
      >
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.overTime}
              margin={{ top: 10, right: 12, bottom: 4, left: -16 }}
            >
              <defs>
                <linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#A8A6A0", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#A8A6A0", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: accent, strokeOpacity: 0.2 }}
                content={<ChartTooltip suffix=" completed" />}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={accent}
                strokeWidth={2.4}
                fill="url(#areaTeal)"
                dot={{ r: 3, fill: accent }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Score band distribution — donut */}
      <ChartCard
        title="Maturity distribution"
        subtitle="How completed diagnostics fall across maturity bands"
      >
        <div className="flex items-center gap-4">
          <div className="h-[220px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip suffix=" diagnostics" />} />
                <Pie
                  data={data.bandDistribution}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.bandDistribution.map((d, i) => (
                    <Cell key={i} fill={BAND_COLOR[d.band] ?? "#A8A6A0"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-col gap-2 pr-2 text-xs">
            {data.bandDistribution.map((d) => (
              <li key={d.band} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: BAND_COLOR[d.band] ?? "#A8A6A0" }}
                />
                <span className="text-ink-soft">{d.label}</span>
                <span className="font-semibold text-ink">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </ChartCard>

      {/* Risk severity — donut with centre total */}
      <ChartCard
        title="Open risks by severity"
        subtitle="Every risk surfaced across the portfolio"
      >
        <div className="flex items-center gap-4">
          <div className="relative h-[220px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip suffix=" risks" />} />
                <Pie
                  data={data.riskBySeverity}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.riskBySeverity.map((d, i) => (
                    <Cell key={i} fill={SEVERITY_COLOR[d.severity] ?? "#A8A6A0"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl leading-none text-ink">
                {totalRisks}
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                total
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-2 pr-2 text-xs">
            {data.riskBySeverity.map((d) => (
              <li key={d.severity} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: SEVERITY_COLOR[d.severity] ?? "#A8A6A0" }}
                />
                <span className="text-ink-soft">{d.label}</span>
                <span className="font-semibold text-ink">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </ChartCard>

      {/* Company leaderboard — horizontal bars. Omitted for single-company
          analytics, where a leaderboard of one is meaningless. */}
      {data.companyRanking && data.companyRanking.length > 0 && (
        <ChartCard
          title="Company leaderboard"
          subtitle="Average maturity per company, best first"
        >
          <div
            style={{ height: Math.max(200, data.companyRanking.length * 40) }}
            className="w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.companyRanking}
                margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                barCategoryGap={10}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#4A4A4A", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(30,77,90,0.05)" }}
                  content={<ChartTooltip suffix=" / 100" />}
                />
                <Bar dataKey="score" radius={[4, 4, 4, 4]} barSize={16}>
                  {data.companyRanking.map((d, i) => (
                    <Cell key={i} fill={d.brandColor || scoreTone(d.score).hex} />
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
        </ChartCard>
      )}

      {/* Framework averages — horizontal bars, tone-coloured */}
      <ChartCard
        title="Framework performance"
        subtitle="Average score for each assessed framework"
      >
        <div
          style={{ height: Math.max(200, data.frameworkScores.length * 34) }}
          className="w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data.frameworkScores}
              margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
              barCategoryGap={8}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#4A4A4A", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(30,77,90,0.05)" }}
                content={<ChartTooltip suffix=" / 100" />}
              />
              <Bar dataKey="score" radius={[4, 4, 4, 4]} barSize={14}>
                {data.frameworkScores.map((d, i) => (
                  <Cell key={i} fill={scoreTone(d.score).hex} />
                ))}
                <LabelList
                  dataKey="score"
                  position="right"
                  className="fill-ink-soft"
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recommendations by priority — vertical bars */}
      <ChartCard
        title="Recommendations by priority"
        subtitle="Volume of actions the platform has recommended"
        className="lg:col-span-2"
      >
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.recByPriority}
              margin={{ top: 16, right: 8, bottom: 4, left: -16 }}
              barCategoryGap={40}
            >
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#4A4A4A", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#A8A6A0", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(30,77,90,0.05)" }}
                content={<ChartTooltip suffix=" recommendations" />}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={72}>
                {data.recByPriority.map((d, i) => (
                  <Cell key={i} fill={PRIORITY_COLOR[d.priority] ?? "#A8A6A0"} />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  className="fill-ink-soft"
                  style={{ fontSize: 12, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
