"use client";

import { Check, Loader2, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BRAND_SWATCHES } from "@/lib/color";
import { cn } from "@/lib/utils";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function BrandColorPicker({
  value,
  onPreview,
  onSave,
}: {
  value: string;
  /** Live preview as the user explores colours (not persisted). */
  onPreview: (hex: string) => void;
  /** Persist the chosen colour. */
  onSave: (hex: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onPreview(value); // revert preview on dismiss
        setDraft(value);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value, onPreview]);

  function pick(hex: string) {
    setDraft(hex);
    onPreview(hex);
  }

  async function save() {
    if (!HEX_RE.test(draft)) return;
    setSaving(true);
    try {
      await onSave(draft);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        <Palette className="h-3.5 w-3.5" />
        Brand colour
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/50"
          style={{ background: draft }}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-surface p-4 text-ink shadow-card-hover">
          <div className="label-eyebrow mb-2.5">Company brand colour</div>
          <div className="grid grid-cols-8 gap-1.5">
            {BRAND_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                onClick={() => pick(hex)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md ring-offset-1 transition-transform hover:scale-110",
                  draft.toLowerCase() === hex.toLowerCase() &&
                    "ring-2 ring-ink ring-offset-surface",
                )}
                style={{ background: hex }}
              >
                {draft.toLowerCase() === hex.toLowerCase() && (
                  <Check className="h-3.5 w-3.5 text-white" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <label
              className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line"
              style={{ background: draft }}
            >
              <input
                type="color"
                value={HEX_RE.test(draft) ? draft : "#1E4D5A"}
                onChange={(e) => pick(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <input
              value={draft}
              onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                if (HEX_RE.test(v)) onPreview(v);
              }}
              spellCheck={false}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 font-mono text-sm text-ink focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-tint"
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onPreview(value);
                setDraft(value);
                setOpen(false);
              }}
              className="h-8 rounded-lg px-3 text-xs font-medium text-ink-muted hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !HEX_RE.test(draft)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: draft }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
