"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BRAND_SWATCHES } from "@/lib/color";
import { cn } from "@/lib/utils";

export function AddCompanyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState(BRAND_SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setSector("");
    setTagline("");
    setBrandColor(BRAND_SWATCHES[0]);
    setError(null);
  }

  async function create() {
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sector: sector.trim() || undefined,
          tagline: tagline.trim() || undefined,
          brandColor,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create company.");
      }
      const { company } = await res.json();
      setOpen(false);
      reset();
      router.push(`/companies/${company.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-deep"
      >
        <Plus className="h-4 w-4" />
        Add company
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !saving && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover">
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div>
                <h2 className="font-display text-xl text-ink">Add a company</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Create a new branded diagnostic workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 pb-2">
              <Field label="Company name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Northstar Holdings"
                  autoFocus
                  className={inputClass}
                />
              </Field>
              <Field label="Sector">
                <input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Manufacturing"
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Optional one-liner"
                  className={inputClass}
                />
              </Field>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Brand colour
                </span>
                <div className="flex items-center gap-2">
                  {BRAND_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={hex}
                      onClick={() => setBrandColor(hex)}
                      className={cn(
                        "h-7 w-7 rounded-md transition-transform hover:scale-110",
                        brandColor === hex && "ring-2 ring-ink ring-offset-2",
                      )}
                      style={{ background: hex }}
                    />
                  ))}
                  <label
                    className="relative h-7 w-7 overflow-hidden rounded-md border border-line"
                    style={{ background: brandColor }}
                  >
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4">
              <button
                type="button"
                onClick={() => !saving && setOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-ink-muted hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create company
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
