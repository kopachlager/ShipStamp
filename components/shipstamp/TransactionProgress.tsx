import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderCircle } from "lucide-react";

export type TransactionStage =
  | "idle"
  | "awaiting-approval"
  | "pending"
  | "reading-receipt"
  | "confirmed"
  | "error";

const stageText: Record<TransactionStage, string> = {
  idle: "Ready for explicit confirmation",
  "awaiting-approval": "Awaiting wallet approval",
  pending: "Transaction submitted — waiting for Monad confirmation",
  "reading-receipt": "Confirmed — reading the onchain receipt",
  confirmed: "Build receipt confirmed",
  error: "Transaction not completed",
};

export function TransactionProgress({
  stage,
  error,
}: {
  stage: TransactionStage;
  error?: string | null;
}) {
  if (stage === "idle") return null;

  return (
    <Alert
      variant={stage === "error" ? "destructive" : "default"}
      className="rounded-lg border-border/60 bg-muted/50"
      role={stage === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {stage !== "error" && stage !== "confirmed" ? (
        <LoaderCircle className="animate-spin" />
      ) : null}
      <AlertTitle>{stageText[stage]}</AlertTitle>
      {error ? <AlertDescription>{error}</AlertDescription> : null}
    </Alert>
  );
}
