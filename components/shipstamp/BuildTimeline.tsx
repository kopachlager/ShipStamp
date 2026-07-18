import Link from "next/link";
import { ExplorerLink } from "@/components/shipstamp/ExplorerLink";
import { normalizeCommitSha, parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import type { BuildStampRecord } from "@/lib/contract/types";
import { formatTimestamp, safeHttpsUrl, shortenHex } from "@/lib/format";

export type TimelineEntry = {
  stamp: BuildStampRecord;
  transactionHash?: string | null;
};

export function BuildTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <EmptyTimeline />;

  return (
    <ol className="border-t border-[var(--rule)]">
      {entries.map(({ stamp, transactionHash }, index) => (
        <li key={stamp.id.toString()} className="grid gap-4 border-b border-[var(--rule)] py-6 sm:grid-cols-[4rem_1fr_auto]">
          <p className="font-mono text-3xl font-black text-[var(--stamp)]">{String(index + 1).padStart(2, "0")}</p>
          <div>
            <p className="technical-label">{formatTimestamp(stamp.timestamp)} UTC</p>
            <h3 className="mt-2 text-xl font-bold">{stamp.milestone}</h3>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-[var(--muted)]">
              <span>commit {shortenHex(stamp.commitSha, 9, 0)}</span>
              <span>wallet {shortenHex(stamp.builder)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href={`/stamp/${stamp.id}`} className="font-semibold underline underline-offset-4">
                Receipt {stamp.id.toString()}
              </Link>
              {getGitHubCommitUrl(stamp.repository, stamp.commitSha) ? (
                <a
                  href={getGitHubCommitUrl(stamp.repository, stamp.commitSha) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-4"
                >
                  Commit ↗
                </a>
              ) : null}
              {safeHttpsUrl(stamp.deploymentUrl) ? (
                <a
                  href={stamp.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-4"
                >
                  Deployment ↗
                </a>
              ) : null}
              {transactionHash ? <ExplorerLink transactionHash={transactionHash} /> : null}
            </div>
          </div>
          <p className="technical-label sm:text-right">Stamp #{stamp.id.toString()}</p>
        </li>
      ))}
    </ol>
  );
}

function getGitHubCommitUrl(repository: string, commitSha: string) {
  try {
    const parsed = parseGitHubRepositoryUrl(`https://github.com/${repository}`);
    const commit = normalizeCommitSha(commitSha);
    return `${parsed.url}/commit/${commit}`;
  } catch {
    return null;
  }
}

export function EmptyTimeline() {
  return (
    <div className="border-y border-dashed border-[var(--rule)] py-10">
      <p className="technical-label">No receipts recorded</p>
      <p className="mt-2 max-w-lg text-[var(--muted)]">
        This project has no onchain ShipStamp milestones yet. No sample activity is substituted.
      </p>
    </div>
  );
}
