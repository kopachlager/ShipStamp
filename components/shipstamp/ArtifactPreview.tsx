import type { PreparedBuildClaim } from "@/lib/validation/build-claim";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";

export function ArtifactPreview({
  claim,
  wallet,
}: {
  claim: PreparedBuildClaim;
  wallet?: string;
}) {
  return (
    <section
      className="border border-border bg-background/40 p-5"
      aria-labelledby="artifact-preview-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/5 font-mono text-[0.62rem] tracking-[0.1em] text-primary uppercase"
          >
            Canonical payload
          </Badge>
          <h3
            id="artifact-preview-heading"
            className="mt-3 font-heading text-2xl"
          >
            Artifact identity
          </h3>
        </div>
        <Kbd className="rounded-md">CHAIN 10143</Kbd>
      </div>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <ArtifactField label="Repository identifier" value={claim.repository} />
        <ArtifactField label="Deployment URL" value={claim.deploymentUrl} />
        <ArtifactField label="Commit SHA" value={claim.commitSha} />
        <ArtifactField
          label="Builder wallet"
          value={wallet ?? "Connect a wallet before stamping"}
        />
        <ArtifactField label="Milestone" value={claim.milestone} />
        <ArtifactField label="Network" value="Monad Testnet / chain 10143" />
        <div className="sm:col-span-2">
          <ArtifactField
            label="Canonical artifact input"
            value={claim.canonicalArtifactInput}
          />
        </div>
        <div className="sm:col-span-2">
          <ArtifactField
            label="Keccak-256 artifact hash"
            value={claim.artifactHash}
          />
        </div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 font-mono text-[0.65rem] leading-5 text-muted-foreground">
        This hashes the submitted identifiers—not deployed files.
      </p>
    </section>
  );
}

function ArtifactField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className="technical-value mt-1 break-words text-xs leading-5">
        {value}
      </dd>
    </div>
  );
}
