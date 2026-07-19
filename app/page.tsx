import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { ProofFlowGraphic } from "@/components/shipstamp/ProofFlowGraphic";
import {
  BuildTimeline,
  type TimelineEntry,
} from "@/components/shipstamp/BuildTimeline";
import {
  ContractNotConfiguredError,
  readProjectStamps,
  readStampTransactionHashes,
} from "@/lib/contract/read";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let timeline: TimelineEntry[] = [];
  let timelineMessage: string | null = null;

  try {
    const stamps = await readProjectStamps("kopachlager/shipstamp");
    const hashes = await readStampTransactionHashes(
      stamps.map((stamp) => stamp.id),
    );
    timeline = stamps.map((stamp) => ({
      stamp,
      transactionHash: hashes.get(stamp.id),
    }));
  } catch (error) {
    timelineMessage =
      error instanceof ContractNotConfiguredError
        ? "No onchain receipts yet."
        : "Build log unavailable.";
  }

  return (
    <main>
      <section className="shipstamp-dots relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-16">
          <div className="relative z-10">
            <p className="mb-6 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary">
              Git commit → live manifest → Monad
            </p>
            <h1 className="display-title max-w-2xl text-6xl leading-[0.9] sm:text-7xl lg:text-[5.6rem]">
              Every build leaves a{" "}
              <span className="text-primary">receipt.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
              Verify a GitHub commit, confirm it from your live deployment, and
              permanently stamp the build on Monad.
            </p>
            <a
              href="#create-receipt"
              className="mt-9 inline-flex items-center gap-3 font-mono text-xs tracking-[0.1em] text-foreground uppercase no-underline transition-colors hover:text-primary"
            >
              <span className="text-primary" aria-hidden="true">→</span>
              Start with a public commit <span className="text-primary">↓</span>
            </a>
          </div>
          <ProofFlowGraphic />
        </div>
      </section>

      <section id="create-receipt" className="shipstamp-dots relative scroll-mt-14 overflow-hidden bg-[#090b0d]">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.38fr_1fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-primary uppercase">
              [ GitHub → deployment → Monad ]
            </p>
            <h2 className="display-title mt-4 max-w-sm text-5xl leading-[0.95] sm:text-6xl">
              Prove the connection.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              GitHub confirms the commit exists. Your live manifest connects
              that commit and deployment to the wallet. Monad records the
              matching manifest hash.
            </p>
          </div>
          <BuildStampForm />
        </div>
      </section>

      <section className="shipstamp-dots overflow-hidden bg-background">
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-10 grid gap-5 border-b border-border pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary">
                Contract chronology
              </p>
              <h2 className="display-title mt-3 text-4xl sm:text-5xl">
                ShipStamp build log
              </h2>
            </div>
            <div className="receipt-impression max-w-48 rotate-[-1deg] px-4 py-3 text-center text-primary">
              <p className="font-heading text-lg uppercase leading-none">Live receipts</p>
              <p className="mt-1 font-mono text-[0.48rem] uppercase tracking-[0.08em]">Read from Monad</p>
            </div>
          </div>
          {timelineMessage ? (
            <div className="rounded-xl bg-card px-6 py-8" role="status">
              <p className="font-mono text-xs text-muted-foreground">
                {timelineMessage}
              </p>
            </div>
          ) : (
            <BuildTimeline entries={timeline} />
          )}
        </div>
      </section>
    </main>
  );
}
