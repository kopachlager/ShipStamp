const MANIFEST_FIELDS = [
  "Project",
  "Repository",
  "Commit",
  "Deployment",
  "Wallet",
  "Schema version",
];

export function ProofFlowGraphic() {
  return (
    <figure
      className="relative min-h-[25rem] overflow-hidden px-1 py-5 sm:min-h-[31rem] sm:px-3 sm:py-7"
      role="img"
      aria-label="A public Git commit flows through a deployment manifest into a build receipt recorded on Monad"
    >
      <div className="relative z-10 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Proof route / v1</span>
        <span className="text-primary">Monad 10143</span>
      </div>

      <div className="relative z-10 mt-8 grid min-h-[19rem] grid-cols-[0.7fr_auto_1.15fr_auto_1fr] items-center gap-2 sm:mt-12 sm:gap-4">
        <GitCommitGraph />
        <FlowArrow />
        <ManifestDocument />
        <FlowArrow />
        <ReceiptStamp />
      </div>

      <figcaption className="relative z-10 mt-5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">
        Public commit <span className="text-primary">→</span> live manifest{" "}
        <span className="text-primary">→</span> wallet-signed receipt
      </figcaption>
    </figure>
  );
}

function GitCommitGraph() {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <svg
        viewBox="0 0 92 230"
        className="h-52 w-full max-w-24 overflow-visible"
        aria-hidden="true"
      >
        <path d="M36 8v214" stroke="#657078" strokeWidth="2" />
        <path
          d="M36 74c29 0 35 17 35 38s-7 34-35 55"
          fill="none"
          stroke="#f4f7f5"
          strokeWidth="2"
        />
        {[18, 58, 98, 138, 178, 218].map((y) => (
          <circle key={y} cx="36" cy={y} r="6" fill="#f4f7f5" />
        ))}
        <circle cx="36" cy="98" r="11" fill="#060708" stroke="#c8ff3d" strokeWidth="3" />
        <circle cx="36" cy="98" r="5" fill="#c8ff3d" />
      </svg>
      <span className="mt-2 text-center font-mono text-[0.55rem] uppercase tracking-[0.08em] text-primary sm:text-[0.62rem]">
        Public commit
      </span>
    </div>
  );
}

function ManifestDocument() {
  return (
    <div className="relative min-w-0 px-2 py-5 sm:px-4 sm:py-6">
      <p className="font-mono text-[0.52rem] uppercase tracking-[0.08em] text-primary sm:text-[0.62rem]">
        ShipStamp manifest
      </p>
      <div className="mt-5 space-y-3">
        {MANIFEST_FIELDS.map((field) => (
          <div key={field} className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-[0.5rem] text-primary" aria-hidden="true">›</span>
            <p className="truncate font-mono text-[0.48rem] uppercase tracking-[0.06em] text-foreground/80 sm:text-[0.58rem]">
              {field}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceiptStamp() {
  return (
    <div className="receipt-impression min-w-0 rotate-[-2deg] px-2 py-4 text-center text-primary sm:px-4 sm:py-6">
      <p className="font-mono text-[0.42rem] uppercase tracking-[0.1em] sm:text-[0.56rem]">
        Onchain receipt
      </p>
      <div className="my-3 border-y border-current py-3">
        <p className="font-heading text-[0.9rem] font-semibold uppercase leading-[0.85] tracking-[-0.05em] sm:text-2xl lg:text-3xl">
          Build
          <br />
          receipt
        </p>
      </div>
      <p className="font-mono text-[0.4rem] uppercase tracking-[0.08em] sm:text-[0.52rem]">
        Recorded on Monad
      </p>
    </div>
  );
}

function FlowArrow() {
  return (
    <span className="font-mono text-base text-primary sm:text-2xl" aria-hidden="true">
      →
    </span>
  );
}
