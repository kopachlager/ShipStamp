export function VerificationChecklist({ compact = false }: { compact?: boolean }) {
  const checks = [
    "Public GitHub commit verified",
    "Live deployment manifest matched",
    "Builder wallet matched",
  ];
  return (
    <ul className={`grid gap-2 ${compact ? "text-xs" : "text-sm"}`} aria-label="Completed verification checks">
      {checks.map((check) => <li key={check} className="flex gap-3"><span className="text-primary" aria-hidden="true">✓</span><span>{check}</span></li>)}
    </ul>
  );
}
