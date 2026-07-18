import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { AsciiStamp } from "@/components/shipstamp/AsciiStamp";
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
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12">
        <div>
          <h1 className="display-title max-w-xl text-5xl leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
            Every build leaves a <span className="text-primary">receipt.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            Connect a public commit, a live deployment, and your wallet in one
            Monad receipt.
          </p>
          <div className="mt-8">
            <AsciiStamp />
          </div>
        </div>
        <BuildStampForm />
      </section>

      <section className="bg-card/35">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="display-title mb-8 text-4xl sm:text-5xl">
            ShipStamp build log
          </h2>
          {timelineMessage ? (
            <div
              className="border-y border-dashed border-border py-8"
              role="status"
            >
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
