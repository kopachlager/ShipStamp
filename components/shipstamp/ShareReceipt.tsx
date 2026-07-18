"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareReceipt({ path, text }: { path: string; text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">(
    "idle",
  );

  const getUrl = () => new URL(path, window.location.origin).toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setStatus("copied");
      toast.success("Receipt link copied");
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
      await navigator.share({
        title: "ShipStamp build receipt",
        text,
        url: getUrl(),
      });
      setStatus("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-wrap gap-4" aria-live="polite">
      <Button type="button" onClick={copy} variant="link">
        {status === "copied" ? "Receipt link copied" : "Copy receipt link"}
      </Button>
      <Button type="button" onClick={share} variant="link">
        {status === "shared" ? "Shared" : "Share receipt"}
      </Button>
      {status === "error" ? (
        <span className="text-[var(--stamp-dark)]">
          Sharing was unavailable.
        </span>
      ) : null}
    </div>
  );
}
