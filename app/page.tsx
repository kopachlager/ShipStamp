import { BuildStampForm } from "@/components/shipstamp/BuildStampForm";
import { AsciiStamp } from "@/components/shipstamp/AsciiStamp";
import {
  BuildTimeline,
  type TimelineEntry,
} from "@/components/shipstamp/BuildTimeline";
import { Feature28 } from "@/components/beste/block/feature28";
import { Feature30 } from "@/components/beste/block/feature30";
import { Badge } from "@/components/ui/badge";
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
        ? "The registry is not deployed in this local environment yet. No timeline data is being substituted."
        : "Monad contract reads are temporarily unavailable. Existing receipts remain onchain.";
  }

  return (
    <main>
      <div className="border-b border-border bg-[#07090a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2.5 font-mono text-[0.58rem] tracking-[0.1em] text-muted-foreground uppercase sm:px-8">
          <span>Proof-of-build protocol / SS—01</span>
          <span className="hidden sm:inline">
            One claim · One transaction · Public read access
          </span>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="technical-label text-primary">Build claim registry</p>
            <Badge
              variant="outline"
              className="rounded-[2px] border-border bg-muted/40 font-mono text-[0.58rem] tracking-[0.1em] uppercase"
            >
              Monad / 10143
            </Badge>
          </div>
          <h1 className="display-title mt-7 max-w-xl text-5xl leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
            Every build leaves a <span className="text-primary">receipt.</span>
          </h1>
          <p className="mt-8 max-w-lg border-l border-primary pl-5 text-sm leading-6 text-muted-foreground sm:text-base">
            Verify a GitHub commit, connect it to a live deployment, and
            permanently stamp the build on Monad.
          </p>
          <div className="mt-8">
            <AsciiStamp />
          </div>
          <div className="grid grid-cols-[3.8rem_1fr] gap-x-3 border-x border-b border-border px-3 py-4 font-mono text-[0.56rem] leading-5 uppercase sm:grid-cols-[auto_1fr] sm:gap-x-5">
            <span className="text-primary">Input</span>
            <span className="text-muted-foreground">
              Commit · Deployment · Wallet
            </span>
            <span className="text-primary">Output</span>
            <span className="text-muted-foreground">
              Public contract receipt
            </span>
          </div>
        </div>
        <BuildStampForm />
      </section>

      <section className="border-y border-border bg-[#0d1012]">
        <div className="noise-band h-px" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="technical-label text-primary">
                Project log / ShipStamp
              </p>
              <h2 className="display-title mt-3 text-5xl sm:text-6xl">
                The registry starts with itself.
              </h2>
            </div>
            <p className="max-w-sm font-mono text-[0.68rem] leading-5 text-muted-foreground">
              Every visible entry below must come from the deployed registry.
              Empty means empty.
            </p>
          </div>
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

      <Feature28
        label="Protocol sequence"
        heading="Three operations. One public claim."
        description="The repository and commit are checked offchain. The normalized claim is signed by the builder and written to Monad. No database sits between the receipt and its reader."
        steps={[
          {
            id: "verify",
            title: "Verify",
            note: "GitHub REST API",
            description:
              "Confirm the public repository and full commit through GitHub's live API.",
          },
          {
            id: "normalize",
            title: "Normalize",
            note: "Deterministic input",
            description:
              "Display the canonical artifact input and its keccak256 hash before signing.",
          },
          {
            id: "stamp",
            title: "Stamp",
            note: "Monad Testnet",
            description:
              "Record the wallet-signed build claim in one contract transaction.",
          },
        ]}
      />

      <Feature30
        label="Verification boundary"
        heading="A receipt, not a certificate."
        description="ShipStamp is deliberately narrow. The interface separates facts the registry records from conclusions it cannot support."
        firstColumn={{
          id: "shipstamp-proves",
          label: "What the receipt proves",
          tone: "positive",
          items: [
            {
              id: "p1",
              text: "A public GitHub commit existed when it was checked.",
            },
            {
              id: "p2",
              text: "A specific wallet recorded the normalized build claim.",
            },
            {
              id: "p3",
              text: "The claim and artifact hash were timestamped on Monad.",
            },
          ],
        }}
        secondColumn={{
          id: "shipstamp-does-not-prove",
          label: "What it does not prove",
          tone: "neutral",
          items: [
            { id: "n1", text: "Code authorship or repository ownership." },
            {
              id: "n2",
              text: "That the deployment serves the submitted commit.",
            },
            {
              id: "n3",
              text: "Deployment security, trustworthiness, or legal ownership.",
            },
          ],
        }}
      />
    </main>
  );
}
