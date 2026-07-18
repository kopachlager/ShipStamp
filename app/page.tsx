import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { BuildTimeline, type TimelineEntry } from "@/components/shipstamp/BuildTimeline";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[0.76fr_1.24fr] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="technical-label text-primary">Public build registry</p>
            <Badge variant="outline" className="rounded-[2px] border-border bg-muted/40 font-mono text-[0.58rem] tracking-[0.1em] uppercase">
              Monad / 10143
            </Badge>
          </div>
          <h1 className="display-title mt-7 text-6xl leading-[0.88] text-balance sm:text-8xl lg:text-[6.75rem]">
            Every build leaves a receipt.
          </h1>
          <p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Verify a GitHub commit, connect it to a live deployment, and permanently stamp the
            build on Monad.
          </p>
          <div className="mt-10 border-y border-border py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="technical-label">Record payload</p>
              <span className="font-mono text-[0.62rem] text-muted-foreground">8 FIELDS / IMMUTABLE</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[0.68rem] text-muted-foreground">
              <span><b className="text-primary">+</b> repository</span>
              <span><b className="text-primary">+</b> commit SHA</span>
              <span><b className="text-primary">+</b> deployment</span>
              <span><b className="text-primary">+</b> milestone</span>
              <span><b className="text-primary">+</b> builder wallet</span>
              <span><b className="text-primary">+</b> artifact hash</span>
            </div>
          </div>
        </div>
        <BuildStampForm />
      </section>

      <section className="border-y border-border bg-[#0d1012]">
        <div className="noise-band h-px" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="technical-label text-primary">Project log / ShipStamp</p>
              <h2 className="display-title mt-3 text-5xl sm:text-6xl">The registry starts with itself.</h2>
            </div>
            <p className="max-w-sm font-mono text-[0.68rem] leading-5 text-muted-foreground">
              Every visible entry below must come from the deployed registry. Empty means empty.
            </p>
          </div>
          {timelineMessage ? (
            <div className="border-y border-dashed border-border py-8" role="status">
              <p className="font-mono text-xs text-muted-foreground">{timelineMessage}</p>
            </div>
          ) : (
            <BuildTimeline entries={timeline} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="how-it-works">
        <div className="grid gap-8 lg:grid-cols-[0.4fr_1fr]">
          <div>
            <p className="technical-label text-primary">Protocol sequence</p>
            <h2 id="how-it-works" className="display-title mt-3 text-5xl">
              Three operations. One claim.
            </h2>
          </div>
          <ol className="border-t border-border">
          {[
            ["01", "Verify", "The server confirms the public repository and full commit through GitHub's live API."],
            ["02", "Normalize", "ShipStamp displays the canonical artifact input and deterministic keccak256 hash."],
            ["03", "Stamp", "Your wallet records the build claim in one Monad Testnet transaction."],
          ].map(([number, title, copy]) => (
            <li key={number} className="grid gap-3 border-b border-border py-5 sm:grid-cols-[3rem_8rem_1fr] sm:items-baseline">
              <p className="font-mono text-xs text-primary">{number}</p>
              <h3 className="font-mono text-xs font-medium tracking-[0.08em] uppercase">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
            </li>
          ))}
          </ol>
        </div>
        <Separator className="mt-16" />
      </section>
    </main>
  );
}
