import Link from "next/link";
import { CopyField } from "@/components/shipstamp/CopyField";
import { ExplorerLink } from "@/components/shipstamp/ExplorerLink";
import { LiveManifestStatus } from "@/components/shipstamp/LiveManifestStatus";
import { ShareReceipt } from "@/components/shipstamp/ShareReceipt";
import { VerificationChecklist } from "@/components/shipstamp/VerificationChecklist";
import { VerifiedStamp } from "@/components/shipstamp/VerifiedStamp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import { getExplorerAddressUrl } from "@/lib/chain/monad-testnet";
import { SHIPSTAMP_CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";
import { formatTimestamp, safeHttpsUrl } from "@/lib/format";
import type { VerifiedGitHubCommit } from "@/lib/github/types";
import { MANIFEST_PATH } from "@/lib/validation/constants";

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
  const manifestUrl = deploymentLink
    ? `${stamp.deploymentUrl}${MANIFEST_PATH}`
    : null;
  const receiptPath = `/stamp/${stamp.id}`;
  const projectPath = getProjectPath(stamp.repository);

  return (
    <article className="relative rounded-xl bg-card p-5 shadow-[0_20px_70px_rgb(0_0_0/0.24)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5 pb-6">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-border/70 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
          >
            Receipt / {stamp.id.toString().padStart(6, "0")}
          </Badge>
          <h2 className="display-title mt-4 text-5xl">{heading}</h2>
        </div>
        <VerifiedStamp />
      </div>
      <Separator />

      <div className="grid gap-6 border-b border-border py-7 sm:grid-cols-[1fr_auto] sm:items-center">
        <VerificationChecklist />
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Recorded on Monad
        </p>
      </div>

      <dl className="grid gap-x-8 gap-y-6 py-7 sm:grid-cols-2">
        <ReceiptField label="Project" value={stamp.project} />
        <ReceiptField label="Repository" value={stamp.repository} />
        <ReceiptField label="Milestone" value={stamp.milestone} />
        <ReceiptField label="Commit SHA" value={stamp.commitSha} />
        <ReceiptField
          label="Block timestamp"
          value={`${formatTimestamp(stamp.timestamp)} UTC`}
        />
        <ReceiptField label="Builder wallet" value={stamp.builder} />
        <ReceiptField label="Network" value="Monad Testnet / 10143" />
        <div className="sm:col-span-2">
          <ReceiptField label="Deployment" value={stamp.deploymentUrl} href={deploymentLink} />
        </div>
        <div className="sm:col-span-2">
          <ReceiptField label="Manifest URL" value={manifestUrl ?? "Unavailable"} href={manifestUrl} />
        </div>
        <div className="sm:col-span-2">
          <CopyField label="Manifest hash" value={stamp.manifestHash} />
        </div>
        <ReceiptField label="Proof schema" value={stamp.proofSchemaVersion} />
        {github ? (
          <ReceiptField
            label="Commit author"
            value={github.commitAuthorUsername ?? github.commitAuthorName}
          />
        ) : null}
        {github ? (
          <div className="sm:col-span-2">
            <ReceiptField label="Commit message" value={github.commitMessage} />
          </div>
        ) : null}
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

      <LiveManifestStatus stamp={stamp} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6 text-sm">
        {github ? (
          <Button asChild variant="link">
            <a href={github.commitUrl} target="_blank" rel="noreferrer">
              Public GitHub commit ↗
            </a>
          </Button>
        ) : null}
        {transactionHash ? (
          <ExplorerLink transactionHash={transactionHash} />
        ) : null}
        {manifestUrl ? (
          <Button asChild variant="link">
            <a href={manifestUrl} target="_blank" rel="noreferrer">
              Live manifest ↗
            </a>
          </Button>
        ) : null}
        <Button asChild variant="link">
          <Link href={receiptPath}>Public receipt</Link>
        </Button>
        {projectPath ? (
          <Button asChild variant="link">
            <Link href={projectPath}>Project timeline</Link>
          </Button>
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

function ReceiptField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className="technical-value mt-1 text-xs leading-6 text-foreground/90">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {value} ↗
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
