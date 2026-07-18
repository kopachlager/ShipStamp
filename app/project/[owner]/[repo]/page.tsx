import type { Metadata } from "next";
import Link from "next/link";
import { BuildTimeline, type TimelineEntry } from "@/components/shipstamp/BuildTimeline";
import { parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import {
  ContractNotConfiguredError,
  ContractReadUnavailableError,
  readProjectStamps,
  readStampTransactionHashes,
} from "@/lib/contract/read";

export const dynamic = "force-dynamic";

type ProjectPageProps = { params: Promise<{ owner: string; repo: string }> };

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  return { title: `${owner}/${repo} build timeline` };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { owner, repo } = await params;
  let repository: string;
  try {
    repository = parseGitHubRepositoryUrl(`https://github.com/${owner}/${repo}`).identifier;
  } catch {
    return <ProjectState title="Invalid project" copy="The project route does not contain a valid GitHub repository identifier." />;
  }

  let entries: TimelineEntry[] = [];
  let failure: { title: string; copy: string } | null = null;

  try {
    const stamps = await readProjectStamps(repository);
    const hashes = await readStampTransactionHashes(stamps.map((stamp) => stamp.id));
    entries = stamps.map((stamp) => ({ stamp, transactionHash: hashes.get(stamp.id) }));
  } catch (error) {
    if (error instanceof ContractNotConfiguredError) {
      failure = { title: "Registry not configured", copy: "This local application has no registry address yet." };
    } else if (error instanceof ContractReadUnavailableError) {
      failure = {
        title: "Contract read unavailable",
        copy: "Monad RPC could not return this project timeline. Try again shortly.",
      };
    } else {
      failure = { title: "Timeline unavailable", copy: "The project timeline could not be loaded safely." };
    }
  }

  if (failure) return <ProjectState title={failure.title} copy={failure.copy} />;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="mb-10 border-b border-border pb-8">
        <p className="technical-label text-primary">Chronological onchain manifest</p>
        <h1 className="display-title mt-4 break-words text-6xl sm:text-7xl">{repository}</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Public build claims read directly from ShipStampRegistry. A connected wallet is not required.
        </p>
        <a
          href={`https://github.com/${repository}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block font-semibold underline underline-offset-4"
        >
          Open repository ↗
        </a>
      </div>
      <BuildTimeline entries={entries} />
    </main>
  );
}

function ProjectState({ title, copy }: { title: string; copy: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <p className="technical-label text-primary">Project manifest / exception</p>
      <h1 className="display-title mt-5 text-6xl">{title}</h1>
      <p className="mt-5 text-muted-foreground">{copy}</p>
      <Link href="/" className="mt-8 inline-block font-semibold underline underline-offset-4">
        Return to ShipStamp
      </Link>
    </main>
  );
}
