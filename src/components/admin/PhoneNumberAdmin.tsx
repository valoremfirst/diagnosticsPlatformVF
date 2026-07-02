"use client";

import { Loader2, Phone, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import type { ClientPhoneMapping } from "@/lib/types";

interface CompanyOption {
  id: string;
  name: string;
}

export function PhoneNumberAdmin({
  mappings,
  companies,
}: {
  mappings: ClientPhoneMapping[];
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [label, setLabel] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const companyName = (id: string) =>
    companies.find((c) => c.id === id)?.name ?? "Unknown company";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, companyId, label }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save phone number.");
      }
      setPhoneNumber("");
      setLabel("");
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(phone: string) {
    if (!confirm(`Remove ${phone} from the registry?`)) return;
    setPending(phone);
    try {
      await fetch(`/api/admin/phone-numbers?phone=${encodeURIComponent(phone)}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          Map a client&apos;s inbound phone number to their company, so a shared
          interview agent attributes each call to the right client. Unregistered
          callers start with a clean slate (no prior-conversation memory).
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-teal px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add number
          </button>
        )}
      </div>

      {adding && (
        <Card className="mb-4 border-dashed p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Phone className="h-4 w-4 text-teal" /> Register phone number
            </h3>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink-muted"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+44 20 1234 5678"
              autoComplete="off"
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional), e.g. Jane Doe, CFO"
              autoComplete="off"
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint sm:col-span-2"
            >
              {companies.length === 0 && <option value="">No companies</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger sm:col-span-2">
                {error}
              </p>
            )}
            <div className="flex justify-end sm:col-span-2">
              <button
                type="submit"
                disabled={busy || !companyId}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Register
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2.5">Phone number</th>
              <th className="px-4 py-2.5">Label</th>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  No phone numbers registered yet.
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr
                  key={m.phoneNumber}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-[13px] font-medium text-ink">
                    {m.phoneNumber}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {m.label || <span className="text-ink-faint">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {companyName(m.companyId)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(m.phoneNumber)}
                      disabled={pending === m.phoneNumber}
                      className="inline-flex items-center rounded-lg p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      aria-label="Remove phone number"
                      title={`Remove ${m.phoneNumber}`}
                    >
                      {pending === m.phoneNumber ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
