"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <p className="technical-label">{label}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="technical-value min-w-0 text-xs leading-5">{value}</p>
        <Button
          type="button"
          onClick={copy}
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={`Copy ${label}`}
          aria-live="polite"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
