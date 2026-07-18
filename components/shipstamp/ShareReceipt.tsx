"use client";

import { useState } from "react";

export function ShareReceipt({ path, text }: { path: string; text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const getUrl = () => new URL(path, window.location.origin).toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };

  const share = async () => {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: "ShipStamp build receipt", text, url: getUrl() });
      setStatus("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-wrap gap-4" aria-live="polite">
      <button type="button" onClick={copy} className="font-semibold underline underline-offset-4">
        {status === "copied" ? "Receipt link copied" : "Copy receipt link"}
      </button>
      <button type="button" onClick={share} className="font-semibold underline underline-offset-4">
        {status === "shared" ? "Shared" : "Share receipt"}
      </button>
      {status === "error" ? <span className="text-[var(--stamp-dark)]">Sharing was unavailable.</span> : null}
    </div>
  );
}

