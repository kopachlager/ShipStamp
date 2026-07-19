"use client";

import { useState, type FormEvent } from "react";
import { parseEventLogs } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { ArtifactPreview } from "@/components/shipstamp/ArtifactPreview";
import { BuildReceipt } from "@/components/shipstamp/BuildReceipt";
import { CommitPreview } from "@/components/shipstamp/CommitPreview";
import { ManifestGenerator } from "@/components/shipstamp/ManifestGenerator";
import { NetworkIndicator } from "@/components/shipstamp/NetworkIndicator";
import { TransactionProgress, type TransactionStage } from "@/components/shipstamp/TransactionProgress";
import { VerificationChecklist } from "@/components/shipstamp/VerificationChecklist";
import { WalletControl } from "@/components/shipstamp/WalletControl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getManifestHash } from "@/lib/artifact/hash";
import { getExplorerTransactionUrl, monadTestnet } from "@/lib/chain/monad-testnet";
import { shipStampRegistryAbi } from "@/lib/contract/abi";
import { SHIPSTAMP_CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";
import type { DeploymentVerificationResponse, DeploymentVerificationSuccess } from "@/lib/deployment/types";
import type { GitHubVerificationError, VerifiedGitHubCommit } from "@/lib/github/types";
import { createManifest, type ShipStampManifest } from "@/lib/manifest/schema";
import { MANIFEST_SCHEMA_VERSION } from "@/lib/validation/constants";
import { prepareBuildClaim, type BuildClaimInput, type PreparedBuildClaim } from "@/lib/validation/build-claim";

type Verification = {
  claim: PreparedBuildClaim;
  github: VerifiedGitHubCommit;
  manifest: ShipStampManifest;
  manifestHash: `0x${string}`;
};

const EMPTY_INPUT: BuildClaimInput = { project: "", repositoryUrl: "", commitSha: "", deploymentUrl: "", milestone: "" };

export function BuildStampForm() {
  const [input, setInput] = useState(EMPTY_INPUT);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [deploymentVerification, setDeploymentVerification] = useState<DeploymentVerificationSuccess | null>(null);
  const [isVerifyingGitHub, setIsVerifyingGitHub] = useState(false);
  const [isVerifyingDeployment, setIsVerifyingDeployment] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [stage, setStage] = useState<TransactionStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [createdStamp, setCreatedStamp] = useState<BuildStampRecord | null>(null);
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: monadTestnet.id });
  const { writeContractAsync } = useWriteContract();

  const updateInput = (field: keyof BuildClaimInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    resetProof();
  };

  const resetProof = () => {
    setVerification(null); setDeploymentVerification(null); setConfirmed(false);
    setStage("idle"); setError(null); setCreatedStamp(null); setTransactionHash(null);
  };

  const verifyCommit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!isConnected || !address) { setError("Connect an injected EVM wallet before verifying the build."); return; }
    if (chainId !== monadTestnet.id) { setError("Switch the connected wallet to Monad Testnet first."); return; }
    let claim: PreparedBuildClaim;
    try { claim = prepareBuildClaim(input); }
    catch (validationError) { setError(validationError instanceof Error ? validationError.message : "Check the submitted build fields."); return; }

    setIsVerifyingGitHub(true);
    try {
      const response = await fetch("/api/github/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repositoryUrl: claim.repositoryUrl, commitSha: claim.commitSha }) });
      const body = await response.json() as VerifiedGitHubCommit | GitHubVerificationError;
      if (!response.ok || "error" in body) throw new Error("error" in body ? body.error.message : "GitHub validation failed.");
      if (body.commitSha !== claim.commitSha) throw new Error("GitHub returned a different commit than the canonical submission.");
      const manifest = createManifest({ project: claim.project, repository: claim.repository, commit: claim.commitSha, deploymentUrl: claim.deploymentUrl, wallet: address });
      setVerification({ claim, github: body, manifest, manifestHash: getManifestHash(manifest) });
      setDeploymentVerification(null); setConfirmed(false);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "GitHub validation is temporarily unavailable.");
    } finally { setIsVerifyingGitHub(false); }
  };

  const verifyDeployment = async () => {
    if (!verification || !address) return;
    if (verification.manifest.wallet.toLowerCase() !== address.toLowerCase()) { setError("The connected wallet changed. Verify the build again to generate a matching manifest."); return; }
    setError(null); setIsVerifyingDeployment(true);
    try {
      const response = await fetch("/api/deployment/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentUrl: verification.claim.deploymentUrl, expectedRepository: verification.claim.repository, expectedCommit: verification.claim.commitSha, expectedWallet: address, expectedProject: verification.claim.project, schemaVersion: MANIFEST_SCHEMA_VERSION }),
      });
      const body = await response.json() as DeploymentVerificationResponse;
      if (!response.ok || !body.verified) throw new Error(body.verified ? "Live manifest verification failed." : body.error.message);
      if (body.manifestHash !== verification.manifestHash) throw new Error("The live manifest hash differs from the generated manifest.");
      setDeploymentVerification(body); setConfirmed(false);
    } catch (verificationError) {
      setDeploymentVerification(null);
      setError(verificationError instanceof Error ? verificationError.message : "Live manifest verification failed safely.");
    } finally { setIsVerifyingDeployment(false); }
  };

  const stampBuild = async () => {
    if (!verification || !deploymentVerification || !confirmed || !address) return;
    setError(null); setCreatedStamp(null);
    if (!SHIPSTAMP_CONTRACT_ADDRESS) { setStage("error"); setError("The ShipStampRegistry contract is not configured yet."); return; }
    if (!isConnected || chainId !== monadTestnet.id) { setStage("error"); setError("Connect the verified wallet on Monad Testnet before stamping."); return; }
    if (verification.manifest.wallet.toLowerCase() !== address.toLowerCase()) { setStage("error"); setError("The connected wallet no longer matches the verified manifest."); return; }
    if (!publicClient) { setStage("error"); setError("Monad RPC is unavailable. Try again shortly."); return; }
    const { claim, manifestHash } = verification;
    const contractInput = { project: claim.project, repository: claim.repository, commitSha: claim.commitSha, deploymentUrl: claim.deploymentUrl, milestone: claim.milestone, manifestHash, proofSchemaVersion: MANIFEST_SCHEMA_VERSION } as const;
    try {
      const duplicate = await publicClient.readContract({ address: SHIPSTAMP_CONTRACT_ADDRESS, abi: shipStampRegistryAbi, functionName: "isDuplicate", args: [address, claim.repository, claim.commitSha, claim.deploymentUrl, manifestHash] });
      if (duplicate) { setStage("error"); setError("This wallet has already stamped the same verified build manifest."); return; }
      await publicClient.simulateContract({ account: address, address: SHIPSTAMP_CONTRACT_ADDRESS, abi: shipStampRegistryAbi, functionName: "stampBuild", args: [contractInput] });
      setStage("awaiting-approval");
      const hash = await writeContractAsync({ account: address, chainId: monadTestnet.id, address: SHIPSTAMP_CONTRACT_ADDRESS, abi: shipStampRegistryAbi, functionName: "stampBuild", args: [contractInput] });
      setTransactionHash(hash); setStage("pending");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== "success") throw new Error("The Monad transaction reverted.");
      setStage("reading-receipt");
      const events = parseEventLogs({ abi: shipStampRegistryAbi, eventName: "BuildStamped", logs: receipt.logs, strict: true });
      const stampId = events[0]?.args.stampId;
      if (stampId === undefined) throw new Error("The confirmed transaction did not emit a build stamp ID.");
      const stamp = await publicClient.readContract({ address: SHIPSTAMP_CONTRACT_ADDRESS, abi: shipStampRegistryAbi, functionName: "getStamp", args: [stampId] });
      setCreatedStamp(stamp); setStage("confirmed");
    } catch (transactionError) { setStage("error"); setError(getTransactionError(transactionError)); }
  };

  const currentStep = createdStamp || deploymentVerification
    ? 4
    : isVerifyingDeployment
      ? 3
      : verification
        ? 2
        : 1;

  return (
    <section className="overflow-hidden rounded-xl bg-card" aria-label="Create a verified build receipt">
      <div className="grid border-b border-border sm:grid-cols-4">
        {["Verify commit", "Install manifest", "Verify deployment", "Stamp on Monad"].map((label, index) => (
          <div key={label} className={`border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 ${currentStep === index + 1 ? "bg-primary text-primary-foreground" : ""}`}>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.08em]">0{index + 1} — {label}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end px-5 pt-5 sm:px-7"><NetworkIndicator /></div>
      <div className="bg-background/30 px-5 py-5 sm:px-7"><WalletControl /></div>

      <form onSubmit={verifyCommit} noValidate className="p-5 sm:p-7">
        <p className="technical-label text-primary">01 / Verify commit</p>
        <div className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <FormField id="project-name" label="Project name" value={input.project} placeholder="ShipStamp" onChange={(value) => updateInput("project", value)} />
          <FormField id="repository-url" label="Public GitHub repository URL" value={input.repositoryUrl} placeholder="https://github.com/owner/repository" onChange={(value) => updateInput("repositoryUrl", value)} />
          <FormField id="commit-sha" label="Full commit SHA" value={input.commitSha} placeholder="40 hexadecimal characters" onChange={(value) => updateInput("commitSha", value)} mono />
          <FormField id="deployment-url" label="Live deployment origin" value={input.deploymentUrl} placeholder="https://your-build.example" onChange={(value) => updateInput("deploymentUrl", value)} />
          <Field className="sm:col-span-2"><FieldLabel htmlFor="milestone" className="technical-label">Milestone description</FieldLabel><Textarea id="milestone" value={input.milestone} onChange={(event) => updateInput("milestone", event.target.value)} rows={3} maxLength={280} placeholder="What genuinely shipped in this build?" className="min-h-24 resize-y rounded-md border-input bg-background/60 font-sans text-sm" /></Field>
        </div>
        {error ? <Alert variant="destructive" className="mt-6 rounded-[2px] border-destructive/30 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <Button type="submit" disabled={isVerifyingGitHub} className="mt-7" size="lg">{isVerifyingGitHub ? "Verifying with GitHub…" : "Verify public commit →"}</Button>

        {verification ? <div className="mt-9 space-y-7" aria-live="polite"><Separator /><CommitPreview commit={verification.github} /><ManifestGenerator manifest={verification.manifest} /><Button type="button" onClick={verifyDeployment} disabled={isVerifyingDeployment} size="lg">{isVerifyingDeployment ? "Checking live manifest…" : "Verify live deployment →"}</Button></div> : null}

        {deploymentVerification && verification ? (
          <div className="mt-9 space-y-7"><Separator /><div><p className="technical-label text-primary">03 / Deployment verified</p><div className="mt-4"><VerificationChecklist /></div><p className="mt-3 text-xs text-muted-foreground">Verified {new Date(deploymentVerification.verifiedAt).toUTCString()}</p></div><ArtifactPreview manifest={verification.manifest} manifestHash={verification.manifestHash} milestone={verification.claim.milestone} />
            <Field orientation="horizontal" className="items-start border-t border-border pt-6"><Checkbox id="claim-confirmation" checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} className="mt-1 rounded-[1px]" /><FieldLabel htmlFor="claim-confirmation" className="max-w-xl text-sm leading-6 font-normal text-muted-foreground">I understand this records the matching manifest hash and wallet claim. It does not prove that every deployed file was built from this commit.</FieldLabel></Field>
            <Button type="button" onClick={stampBuild} disabled={!confirmed || ["awaiting-approval", "pending", "reading-receipt"].includes(stage)} size="lg">Stamp verified build →</Button>
            <TransactionProgress stage={stage} error={stage === "error" ? error : null} />
            {transactionHash && stage !== "confirmed" ? <Button asChild variant="link"><a href={getExplorerTransactionUrl(transactionHash)} target="_blank" rel="noreferrer">Inspect pending transaction ↗</a></Button> : null}
          </div>
        ) : null}
      </form>
      {createdStamp ? <div className="bg-background/30 p-5 sm:p-7"><BuildReceipt stamp={createdStamp} transactionHash={transactionHash} github={verification?.github} /></div> : null}
    </section>
  );
}

function FormField({ id, label, value, placeholder, onChange, mono }: { id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void; mono?: boolean }) {
  return <Field><FieldLabel htmlFor={id} className="technical-label">{label}</FieldLabel><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} className={`h-11 rounded-md border-input bg-background/60 px-3 text-sm ${mono ? "font-mono text-xs" : ""}`} /></Field>;
}

function getTransactionError(error: unknown) {
  const message = error instanceof Error ? error.message : "The transaction was not completed.";
  if (/reject|denied|cancel/i.test(message)) return "The wallet transaction was rejected.";
  if (/DuplicateStamp|already stamped/i.test(message)) return "This wallet has already stamped the exact verified manifest.";
  if (/insufficient funds/i.test(message)) return "The wallet does not have enough test MON for gas.";
  if (/revert/i.test(message)) return "The transaction reverted. No build receipt was created.";
  return message.split("\n")[0];
}
