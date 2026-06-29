import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";

import "./globals.css";

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
    <html lang="en-GB">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
