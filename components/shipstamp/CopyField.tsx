"use client";

import { useState } from "react";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <p className="technical-label">{label}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="technical-value min-w-0 text-xs leading-5">{value}</p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 border-b border-[var(--ink)] text-xs font-bold"
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

