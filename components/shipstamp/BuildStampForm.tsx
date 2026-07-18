"use client";

import { useState, type FormEvent } from "react";
import { SearchCheck, Stamp } from "lucide-react";
import { parseEventLogs } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { ArtifactPreview } from "@/components/shipstamp/ArtifactPreview";
import { BuildReceipt } from "@/components/shipstamp/BuildReceipt";
import { CommitPreview } from "@/components/shipstamp/CommitPreview";
import { NetworkIndicator } from "@/components/shipstamp/NetworkIndicator";
import {
  TransactionProgress,
  type TransactionStage,
} from "@/components/shipstamp/TransactionProgress";
import { WalletControl } from "@/components/shipstamp/WalletControl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  getExplorerTransactionUrl,
  monadTestnet,
} from "@/lib/chain/monad-testnet";
import { shipStampRegistryAbi } from "@/lib/contract/abi";
import { SHIPSTAMP_CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";
import type {
  GitHubVerificationError,
  VerifiedGitHubCommit,
} from "@/lib/github/types";
import {
  prepareBuildClaim,
  type BuildClaimInput,
  type PreparedBuildClaim,
} from "@/lib/validation/build-claim";

type Verification = {
  claim: PreparedBuildClaim;
  github: VerifiedGitHubCommit;
};

const EMPTY_INPUT: BuildClaimInput = {
  repositoryUrl: "",
  commitSha: "",
  deploymentUrl: "",
  milestone: "",
};

export function BuildStampForm() {
  const [input, setInput] = useState(EMPTY_INPUT);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [stage, setStage] = useState<TransactionStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null,
  );
  const [createdStamp, setCreatedStamp] = useState<BuildStampRecord | null>(
    null,
  );

  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: monadTestnet.id });
  const { writeContractAsync } = useWriteContract();

  const updateInput = (field: keyof BuildClaimInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    setVerification(null);
    setConfirmed(false);
    setStage("idle");
    setError(null);
    setCreatedStamp(null);
    setTransactionHash(null);
  };

  const verifyBuild = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStage("idle");
    setCreatedStamp(null);
    setTransactionHash(null);

    let claim: PreparedBuildClaim;
    try {
      claim = prepareBuildClaim(input);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Check the submitted build fields.",
      );
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/github/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryUrl: claim.repositoryUrl,
          commitSha: claim.commitSha,
        }),
      });
      const body = (await response.json()) as
        VerifiedGitHubCommit | GitHubVerificationError;
      if (!response.ok || "error" in body) {
        throw new Error(
          "error" in body ? body.error.message : "GitHub validation failed.",
        );
      }
      if (body.commitSha !== claim.commitSha) {
        throw new Error(
          "GitHub returned a different commit than the canonical submission.",
        );
      }
      setVerification({ claim, github: body });
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "GitHub validation is temporarily unavailable.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const stampBuild = async () => {
    if (!verification || !confirmed) return;
    setError(null);
    setCreatedStamp(null);

    if (!SHIPSTAMP_CONTRACT_ADDRESS) {
      setStage("error");
      setError("The ShipStampRegistry contract is not configured yet.");
      return;
    }
    if (!isConnected || !address) {
      setStage("error");
      setError("Connect an injected EVM wallet before stamping.");
      return;
    }
    if (chainId !== monadTestnet.id) {
      setStage("error");
      setError("Switch the connected wallet to Monad Testnet before stamping.");
      return;
    }
    if (!publicClient) {
      setStage("error");
      setError("Monad RPC is unavailable. Try again shortly.");
      return;
    }

    const { claim } = verification;
    const args = [
      claim.repository,
      claim.commitSha,
      claim.deploymentUrl,
      claim.milestone,
      claim.artifactHash,
    ] as const;

    try {
      const duplicate = await publicClient.readContract({
        address: SHIPSTAMP_CONTRACT_ADDRESS,
        abi: shipStampRegistryAbi,
        functionName: "isDuplicate",
        args: [address, claim.repository, claim.commitSha, claim.deploymentUrl],
      });
      if (duplicate) {
        setStage("error");
        setError(
          "This wallet has already stamped the same repository, commit, and deployment URL.",
        );
        return;
      }

      await publicClient.simulateContract({
        account: address,
        address: SHIPSTAMP_CONTRACT_ADDRESS,
        abi: shipStampRegistryAbi,
        functionName: "stampBuild",
        args,
      });

      setStage("awaiting-approval");
      const hash = await writeContractAsync({
        account: address,
        chainId: monadTestnet.id,
        address: SHIPSTAMP_CONTRACT_ADDRESS,
        abi: shipStampRegistryAbi,
        functionName: "stampBuild",
        args,
      });
      setTransactionHash(hash);
      setStage("pending");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });
      if (receipt.status !== "success")
        throw new Error("The Monad transaction reverted.");

      setStage("reading-receipt");
      const events = parseEventLogs({
        abi: shipStampRegistryAbi,
        eventName: "BuildStamped",
        logs: receipt.logs,
        strict: true,
      });
      const stampId = events[0]?.args.stampId;
      if (stampId === undefined)
        throw new Error(
          "The confirmed transaction did not emit a build stamp ID.",
        );

      const stamp = await publicClient.readContract({
        address: SHIPSTAMP_CONTRACT_ADDRESS,
        abi: shipStampRegistryAbi,
        functionName: "getStamp",
        args: [stampId],
      });
      setCreatedStamp(stamp);
      setStage("confirmed");
    } catch (transactionError) {
      setStage("error");
      setError(getTransactionError(transactionError));
    }
  };

  return (
    <section
      className="overflow-hidden rounded-xl bg-card"
      aria-label="Create a build receipt"
    >
      <div className="flex justify-end px-5 pt-5 sm:px-7">
        <div>
          <NetworkIndicator />
        </div>
      </div>

      <div className="bg-background/30 px-5 py-5 sm:px-7">
        <WalletControl />
      </div>

      <form onSubmit={verifyBuild} noValidate className="p-5 sm:p-7">
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <FormField
            id="repository-url"
            label="Public GitHub repository URL"
            value={input.repositoryUrl}
            placeholder="https://github.com/owner/repository"
            onChange={(value) => updateInput("repositoryUrl", value)}
          />
          <FormField
            id="commit-sha"
            label="Full commit SHA"
            value={input.commitSha}
            placeholder="40 hexadecimal characters"
            onChange={(value) => updateInput("commitSha", value)}
            mono
          />
          <FormField
            id="deployment-url"
            label="Live deployment URL"
            value={input.deploymentUrl}
            placeholder="https://your-build.example"
            onChange={(value) => updateInput("deploymentUrl", value)}
          />
          <Field>
            <FieldLabel htmlFor="milestone" className="technical-label">
              Milestone description
            </FieldLabel>
            <Textarea
              id="milestone"
              value={input.milestone}
              onChange={(event) => updateInput("milestone", event.target.value)}
              rows={3}
              maxLength={280}
              placeholder="What genuinely shipped in this build?"
              className="min-h-24 resize-y rounded-md border-input bg-background/60 font-sans text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20"
            />
          </Field>
        </div>

        {error && stage !== "error" ? (
          <Alert
            variant="destructive"
            className="mt-6 rounded-lg border-destructive/30 bg-destructive/5"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={isVerifying} className="mt-7" size="lg">
          <SearchCheck data-icon="inline-start" />
          {isVerifying ? "Verifying with GitHub…" : "Verify build"}
        </Button>

        {verification ? (
          <div className="mt-9 space-y-7" aria-live="polite">
            <Separator />
            <CommitPreview commit={verification.github} />
            <ArtifactPreview claim={verification.claim} wallet={address} />

            <Field
              orientation="horizontal"
              className="items-start border-t border-border pt-6"
            >
              <Checkbox
                id="claim-confirmation"
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                className="mt-1 rounded-[1px]"
              />
              <FieldLabel
                htmlFor="claim-confirmation"
                className="max-w-xl text-sm leading-6 font-normal text-muted-foreground"
              >
                This is a public build claim, not proof of repository ownership.
              </FieldLabel>
            </Field>

            <Button
              type="button"
              onClick={stampBuild}
              disabled={
                !confirmed ||
                stage === "awaiting-approval" ||
                stage === "pending" ||
                stage === "reading-receipt"
              }
              size="lg"
            >
              <Stamp data-icon="inline-start" />
              Stamp this build
            </Button>

            <TransactionProgress
              stage={stage}
              error={stage === "error" ? error : null}
            />
            {transactionHash && stage !== "confirmed" ? (
              <Button asChild variant="link">
                <a
                  href={getExplorerTransactionUrl(transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Inspect pending transaction ↗
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>

      {createdStamp ? (
        <div className="bg-background/30 p-5 sm:p-7">
          <BuildReceipt
            stamp={createdStamp}
            transactionHash={transactionHash}
            github={verification?.github}
          />
        </div>
      ) : null}
    </section>
  );
}

function FormField({
  id,
  label,
  value,
  placeholder,
  onChange,
  mono,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className="technical-label">
        {label}
      </FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`h-11 rounded-md border-input bg-background/60 px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 ${mono ? "font-mono text-xs" : ""}`}
      />
    </Field>
  );
}

function getTransactionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "The transaction was not completed.";
  if (/reject|denied|cancel/i.test(message))
    return "The wallet transaction was rejected.";
  if (/DuplicateStamp|already stamped/i.test(message)) {
    return "This wallet has already stamped the exact repository, commit, and deployment.";
  }
  if (/insufficient funds/i.test(message))
    return "The wallet does not have enough test MON for gas.";
  if (/revert/i.test(message))
    return "The transaction reverted. No build receipt was created.";
  return message.split("\n")[0];
}
