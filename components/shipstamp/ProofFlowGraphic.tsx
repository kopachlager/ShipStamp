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
      className="proof-field relative min-h-[25rem] overflow-hidden border border-border bg-[#060708] p-5 sm:min-h-[31rem] sm:p-7"
      role="img"
      aria-label="A public Git commit flows through a deployment manifest into a build receipt recorded on Monad"
    >
      <pre className="ascii-corner left-4 top-12" aria-hidden="true">
        {`01 10 01 01
10 11 00 10
01 01 10 11
11 00 01 10`}
      </pre>
      <pre className="ascii-corner bottom-4 right-5 text-right" aria-hidden="true">
        {`::..::..::
..::..::..
::..::..::`}
      </pre>

      <div className="relative z-10 flex items-center justify-between border-b border-border/80 pb-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">
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

      <figcaption className="relative z-10 mt-5 border-t border-border/80 pt-4 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">
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
    <div className="manifest-sheet relative min-w-0 bg-[#080a0b] px-3 py-5 sm:px-5 sm:py-6">
      <p className="font-mono text-[0.52rem] uppercase tracking-[0.08em] text-primary sm:text-[0.62rem]">
        ShipStamp manifest
      </p>
      <div className="mt-5 space-y-3">
        {MANIFEST_FIELDS.map((field) => (
          <div key={field}>
            <p className="truncate font-mono text-[0.48rem] uppercase tracking-[0.06em] text-foreground sm:text-[0.58rem]">
              {field}
            </p>
            <div className="mt-1 h-px bg-border" />
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
