import Link from "next/link";
import { ExplorerLink } from "@/components/shipstamp/ExplorerLink";
import {
  normalizeCommitSha,
  parseGitHubRepositoryUrl,
} from "@/lib/artifact/normalization";
import type { BuildStampRecord } from "@/lib/contract/types";
import { formatTimestamp, safeHttpsUrl, shortenHex } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type TimelineEntry = {
  stamp: BuildStampRecord;
  transactionHash?: string | null;
};

export function BuildTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <EmptyTimeline />;

  return (
    <ol className="border-t border-border">
      {entries.map(({ stamp, transactionHash }, index) => (
        <li
          key={stamp.id.toString()}
          className="grid gap-4 border-b border-border bg-background/35 p-6 sm:grid-cols-[4rem_1fr_auto]"
        >
          <p className="font-heading text-4xl text-primary">
            {String(index + 1).padStart(2, "0")}
          </p>
          <div>
            <p className="technical-label">
              {formatTimestamp(stamp.timestamp)} UTC
            </p>
            <h3 className="mt-2 font-heading text-3xl leading-tight">
              {stamp.milestone}
            </h3>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.65rem] text-muted-foreground">
              <span>commit {shortenHex(stamp.commitSha, 9, 0)}</span>
              <span>wallet {shortenHex(stamp.builder)}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <Button asChild variant="link">
                <Link href={`/stamp/${stamp.id}`}>
                  Receipt {stamp.id.toString()}
                </Link>
              </Button>
              {getGitHubCommitUrl(stamp.repository, stamp.commitSha) ? (
                <a
                  href={
                    getGitHubCommitUrl(stamp.repository, stamp.commitSha) ??
                    undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[0.68rem] uppercase underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  Commit ↗
                </a>
              ) : null}
              {safeHttpsUrl(stamp.deploymentUrl) ? (
                <a
                  href={stamp.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[0.68rem] uppercase underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  Deployment ↗
                </a>
              ) : null}
              {transactionHash ? (
                <ExplorerLink transactionHash={transactionHash} />
              ) : null}
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-fit rounded-[2px] font-mono text-[0.58rem] tracking-[0.08em] uppercase sm:justify-self-end"
          >
            Stamp #{stamp.id.toString()}
          </Badge>
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
    <div className="border border-border bg-background/35 p-8" role="status">
      <p className="text-sm text-muted-foreground">No receipts yet.</p>
    </div>
  );
}
