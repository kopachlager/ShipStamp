import type { PreparedBuildClaim } from "@/lib/validation/build-claim";

export function ArtifactPreview({ claim, wallet }: { claim: PreparedBuildClaim; wallet?: string }) {
  return (
    <section className="border-t border-[var(--rule)] pt-6" aria-labelledby="artifact-preview-heading">
      <h3 id="artifact-preview-heading" className="text-lg font-bold">
        Canonical artifact record
      </h3>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <ArtifactField label="Repository identifier" value={claim.repository} />
        <ArtifactField label="Deployment URL" value={claim.deploymentUrl} />
        <ArtifactField label="Commit SHA" value={claim.commitSha} />
        <ArtifactField label="Builder wallet" value={wallet ?? "Connect a wallet before stamping"} />
        <ArtifactField label="Milestone" value={claim.milestone} />
        <ArtifactField label="Network" value="Monad Testnet / chain 10143" />
        <div className="sm:col-span-2">
          <ArtifactField label="Canonical artifact input" value={claim.canonicalArtifactInput} />
        </div>
        <div className="sm:col-span-2">
          <ArtifactField label="Keccak-256 artifact hash" value={claim.artifactHash} />
        </div>
      </dl>
      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
        ShipStamp records this claim and hash. It does not download or hash the deployment files,
        and it does not prove the deployment serves this commit.
      </p>
    </section>
  );
}

function ArtifactField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className="technical-value mt-1 break-words text-xs leading-5">{value}</dd>
    </div>
  );
}

