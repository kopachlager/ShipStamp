import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { BuildTimeline, type TimelineEntry } from "@/components/shipstamp/BuildTimeline";
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
    const hashes = await readStampTransactionHashes(stamps.map((stamp) => stamp.id));
    timeline = stamps.map((stamp) => ({ stamp, transactionHash: hashes.get(stamp.id) }));
  } catch (error) {
    timelineMessage =
      error instanceof ContractNotConfiguredError
        ? "The registry is not deployed in this local environment yet. No timeline data is being substituted."
        : "Monad contract reads are temporarily unavailable. Existing receipts remain onchain.";
  }

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-9 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <p className="technical-label">Build record / Monad Testnet</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl">
            Every build leaves a receipt.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Verify a GitHub commit, connect it to a live deployment, and permanently stamp the
            build on Monad.
          </p>
          <div className="mt-8 border-y border-[var(--rule)] py-5 text-sm leading-6">
            <p className="font-bold">Written onchain</p>
            <p className="mt-1 text-[var(--muted)]">
              Repository, commit SHA, deployment claim, milestone, builder wallet, artifact hash,
              and block timestamp.
            </p>
          </div>
        </div>
        <BuildStampForm />
      </section>

      <section className="border-t border-[var(--ink)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="technical-label">ShipStamp shipping manifest</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.045em]">Built in public, stamped for real.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              Every visible entry below must come from the deployed registry. Empty means empty.
            </p>
          </div>
          {timelineMessage ? (
            <div className="border-y border-dashed border-[var(--rule)] py-8" role="status">
              <p className="text-sm text-[var(--muted)]">{timelineMessage}</p>
            </div>
          ) : (
            <BuildTimeline entries={timeline} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="how-it-works">
        <p className="technical-label">Three checks, one public record</p>
        <h2 id="how-it-works" className="mt-2 text-3xl font-black tracking-[-0.04em]">
          How verification works
        </h2>
        <ol className="mt-8 grid border-y border-[var(--rule)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--rule)]">
          {[
            ["01", "Verify", "The server confirms the public repository and full commit through GitHub's live API."],
            ["02", "Normalize", "ShipStamp displays the canonical artifact input and deterministic keccak256 hash."],
            ["03", "Stamp", "Your wallet records the build claim in one Monad Testnet transaction."],
          ].map(([number, title, copy]) => (
            <li key={number} className="border-b border-[var(--rule)] py-6 sm:border-0 sm:px-6 sm:first:pl-0">
              <p className="font-mono text-sm font-bold text-[var(--stamp)]">{number}</p>
              <h3 className="mt-3 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

