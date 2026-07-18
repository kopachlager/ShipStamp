import Link from "next/link";
import { CopyField } from "@/components/shipstamp/CopyField";
import { ExplorerLink } from "@/components/shipstamp/ExplorerLink";
import { ShareReceipt } from "@/components/shipstamp/ShareReceipt";
import { VerifiedStamp } from "@/components/shipstamp/VerifiedStamp";
import { parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import { getExplorerAddressUrl } from "@/lib/chain/monad-testnet";
import { SHIPSTAMP_CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";
import { formatTimestamp, safeHttpsUrl } from "@/lib/format";
import type { VerifiedGitHubCommit } from "@/lib/github/types";

type BuildReceiptProps = {
  stamp: BuildStampRecord;
  transactionHash?: string | null;
  github?: VerifiedGitHubCommit | null;
  heading?: string;
};

export function BuildReceipt({
  stamp,
  transactionHash,
  github,
  heading = "Build stamped",
}: BuildReceiptProps) {
  const deploymentLink = safeHttpsUrl(stamp.deploymentUrl);
  const receiptPath = `/stamp/${stamp.id}`;
  const projectPath = getProjectPath(stamp.repository);

  return (
    <article className="relative border border-[var(--ink)] bg-[var(--paper-raised)] p-5 shadow-[6px_6px_0_var(--rule)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--rule)] pb-6">
        <div>
          <p className="technical-label">Receipt no. {stamp.id.toString().padStart(6, "0")}</p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.045em]">{heading}</h2>
        </div>
        <VerifiedStamp />
      </div>

      <dl className="grid gap-x-8 gap-y-6 py-7 sm:grid-cols-2">
        <ReceiptField label="Repository" value={stamp.repository} />
        <ReceiptField label="Milestone" value={stamp.milestone} />
        <ReceiptField label="Commit SHA" value={stamp.commitSha} />
        <ReceiptField label="Block timestamp" value={`${formatTimestamp(stamp.timestamp)} UTC`} />
        <ReceiptField label="Builder wallet" value={stamp.builder} />
        <ReceiptField label="Network" value="Monad Testnet / 10143" />
        <div className="sm:col-span-2">
          <ReceiptField label="Deployment claim" value={stamp.deploymentUrl} href={deploymentLink} />
        </div>
        <div className="sm:col-span-2">
          <CopyField label="Artifact hash" value={stamp.artifactHash} />
        </div>
        {transactionHash ? (
          <div className="sm:col-span-2">
            <CopyField label="Transaction hash" value={transactionHash} />
          </div>
        ) : null}
        {SHIPSTAMP_CONTRACT_ADDRESS ? (
          <div className="sm:col-span-2">
            <ReceiptField
              label="Registry contract"
              value={SHIPSTAMP_CONTRACT_ADDRESS}
              href={getExplorerAddressUrl(SHIPSTAMP_CONTRACT_ADDRESS)}
            />
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--rule)] pt-6 text-sm">
        {github ? (
          <a href={github.commitUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
            Public GitHub commit ↗
          </a>
        ) : null}
        {transactionHash ? <ExplorerLink transactionHash={transactionHash} /> : null}
        <Link href={receiptPath} className="font-semibold underline underline-offset-4">
          Public receipt
        </Link>
        {projectPath ? (
          <Link href={projectPath} className="font-semibold underline underline-offset-4">
            Project timeline
          </Link>
        ) : null}
        <ShareReceipt
          path={receiptPath}
          text={`Shipped: ${stamp.milestone}\n\nCommit ${stamp.commitSha.slice(0, 7)} for ${stamp.repository} was stamped on Monad.`}
        />
      </div>
    </article>
  );
}

function getProjectPath(repository: string) {
  try {
    const parsed = parseGitHubRepositoryUrl(`https://github.com/${repository}`);
    return `/project/${parsed.owner}/${parsed.repository}`;
  } catch {
    return null;
  }
}

function ReceiptField({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className="technical-value mt-1 text-sm leading-6">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            {value} ↗
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
