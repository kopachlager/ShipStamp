import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { AsciiStamp } from "@/components/shipstamp/AsciiStamp";
import { GitBranch } from "lucide-react";
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
      <section className="min-h-[calc(100svh-3.5rem)]">
        <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-16">
          <div className="relative z-10">
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
              <GitBranch className="size-4 text-primary" aria-hidden="true" />
              Start with a public commit <span className="text-primary">↓</span>
            </a>
          </div>
          <AsciiStamp />
        </div>
      </section>

      <section id="create-receipt" className="bg-[#090b0d] scroll-mt-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.38fr_1fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-primary uppercase">
              <GitBranch className="size-4" aria-hidden="true" />
              GitHub → Monad
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

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="display-title mb-10 text-4xl sm:text-5xl">
            ShipStamp build log
          </h2>
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
