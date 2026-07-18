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

export function TransactionProgress({ stage, error }: { stage: TransactionStage; error?: string | null }) {
  if (stage === "idle") return null;

  return (
    <div
      className={`border-l-4 px-4 py-3 ${stage === "error" ? "border-[var(--stamp)] bg-red-50" : "border-[var(--ink)] bg-[var(--paper)]"}`}
      role={stage === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <p className="font-bold">{stageText[stage]}</p>
      {error ? <p className="mt-1 text-sm text-[var(--stamp-dark)]">{error}</p> : null}
    </div>
  );
}

