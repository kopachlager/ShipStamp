import type { Metadata } from "next";
import Link from "next/link";
import { BuildReceipt } from "@/components/shipstamp/BuildReceipt";
import {
  ContractNotConfiguredError,
  ContractReadUnavailableError,
  readStamp,
  readStampTransactionHashes,
} from "@/lib/contract/read";
import { readGitHubMetadataForStamp } from "@/lib/github/stamp-metadata";

export const dynamic = "force-dynamic";

type ReceiptPageProps = { params: Promise<{ stampId: string }> };

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { stampId } = await params;
  return { title: `Build receipt ${stampId}` };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { stampId: rawStampId } = await params;
  if (!/^\d+$/.test(rawStampId)) {
    return <ReceiptState title="Invalid receipt ID" copy="Receipt IDs contain decimal numbers only." />;
  }

  let stamp;
  let hashes;
  let github;
  let failure: { title: string; copy: string } | null = null;

  try {
    stamp = await readStamp(BigInt(rawStampId));
    if (stamp) {
      [hashes, github] = await Promise.all([
      readStampTransactionHashes([stamp.id]),
      readGitHubMetadataForStamp(stamp),
      ]);
    }
  } catch (error) {
    if (error instanceof ContractNotConfiguredError) {
      failure = { title: "Registry not configured", copy: "This local application has no registry address yet." };
    } else if (error instanceof ContractReadUnavailableError) {
      failure = { title: "Contract read unavailable", copy: "Monad RPC could not return this receipt. Try again shortly." };
    } else {
      failure = { title: "Receipt unavailable", copy: "The receipt could not be loaded safely." };
    }
  }

  if (failure) return <ReceiptState title={failure.title} copy={failure.copy} />;
  if (!stamp) {
    return <ReceiptState title="Receipt not found" copy="No onchain build stamp exists with this ID." />;
  }

  return (
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="mb-7">
        <p className="technical-label">Public verification record</p>
        <h1 className="display-title mt-3 text-6xl">Build receipt #{stamp.id.toString()}</h1>
        {!github ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            GitHub metadata is currently unavailable; the onchain receipt remains readable below.
          </p>
        ) : null}
      </div>
      <BuildReceipt stamp={stamp} transactionHash={hashes?.get(stamp.id)} github={github} />
    </main>
  );
}

function ReceiptState({ title, copy }: { title: string; copy: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <p className="technical-label text-primary">Receipt lookup / exception</p>
      <h1 className="display-title mt-5 text-6xl">{title}</h1>
      <p className="mt-5 text-muted-foreground">{copy}</p>
      <Link href="/" className="mt-8 inline-block font-semibold underline underline-offset-4">
        Return to ShipStamp
      </Link>
    </main>
  );
}
