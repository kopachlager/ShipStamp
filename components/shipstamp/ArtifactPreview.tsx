import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { getCanonicalManifestLines } from "@/lib/artifact/hash";
import type { ShipStampManifest } from "@/lib/manifest/schema";

export function ArtifactPreview({
  manifest,
  manifestHash,
  milestone,
}: {
  manifest: ShipStampManifest;
  manifestHash: string;
  milestone: string;
}) {
  return (
    <section className="border border-border bg-background/40 p-5" aria-labelledby="artifact-preview-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="outline" className="rounded-[2px] border-primary/30 bg-primary/5 font-mono text-[0.62rem] tracking-[0.1em] text-primary uppercase">
            Canonical manifest
          </Badge>
          <h3 id="artifact-preview-heading" className="mt-3 font-heading text-2xl">Values recorded onchain</h3>
        </div>
        <Kbd className="rounded-[2px]">CHAIN 10143</Kbd>
      </div>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <ArtifactField label="Project" value={manifest.project} />
        <ArtifactField label="Repository" value={manifest.repository} />
        <ArtifactField label="Commit SHA" value={manifest.commit} />
        <ArtifactField label="Builder wallet" value={manifest.wallet} />
        <ArtifactField label="Deployment origin" value={manifest.deploymentUrl} />
        <ArtifactField label="Proof schema" value={manifest.schemaVersion} />
        <ArtifactField label="Milestone" value={milestone} />
        <ArtifactField label="Network" value="Monad Testnet / chain 10143" />
        <div className="sm:col-span-2"><ArtifactField label="Canonical field order" value={getCanonicalManifestLines(manifest)} pre /></div>
        <div className="sm:col-span-2"><ArtifactField label="Keccak-256 manifest hash" value={manifestHash} /></div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 font-mono text-[0.65rem] leading-5 text-muted-foreground">
        The hash uses Solidity ABI encoding in the displayed field order. It does not hash deployed application files.
      </p>
    </section>
  );
}

function ArtifactField({ label, value, pre = false }: { label: string; value: string; pre?: boolean }) {
  return (
    <div>
      <dt className="technical-label">{label}</dt>
      <dd className={`technical-value mt-1 break-words whitespace-pre-wrap text-xs leading-5 ${pre ? "border-l border-primary/40 pl-3" : ""}`}>{value}</dd>
    </div>
  );
}
