import type { Metadata } from "next";
import { Newsreader, Source_Serif_4 } from "next/font/google";

import { AppShell } from "@/components/AppShell";

import "./globals.css";

// Oracle editorial type: Newsreader for display headings, Source Serif 4 for
// editorial body copy. Exposed as CSS variables and consumed by Tailwind.
const displaySerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const textSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-text",
});

export const metadata: Metadata = {
  title: "Agentic Diagnostics — Consulting as a Service",
  description:
    "Voice-led business diagnostics scored against Lean Six Sigma, Digital Maturity, IT Resilience, Balanced Scorecard and Finance/ROI frameworks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={`${displaySerif.variable} ${textSerif.variable}`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
