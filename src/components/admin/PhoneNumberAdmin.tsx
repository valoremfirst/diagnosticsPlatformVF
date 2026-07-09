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
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <p className="max-w-xl text-sm text-ink-muted">
          Unregistered callers start with a clean slate — no prior-conversation
          memory.
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-teal h-9 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add number
          </button>
        )}
      </div>

      <div className="p-5">
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
              className="input-editorial h-10"
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional), e.g. Jane Doe, CFO"
              autoComplete="off"
              className="input-editorial h-10"
            />
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="input-editorial h-10 sm:col-span-2"
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
                className="btn-teal h-10 px-5"
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
                <td colSpan={4} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-ink-faint">
                      <Phone className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-ink-soft">
                      No callers registered
                    </p>
                    <p className="max-w-xs text-xs text-ink-muted">
                      Map a phone number to a company so the agent can attribute
                      each call and recall prior conversations.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr
                  key={m.phoneNumber}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface-muted/40"
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
      </div>
    </Card>
  );
}
