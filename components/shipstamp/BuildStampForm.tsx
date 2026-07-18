"use client";

import { useState, type FormEvent } from "react";
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
import { getExplorerTransactionUrl, monadTestnet } from "@/lib/chain/monad-testnet";
import { shipStampRegistryAbi } from "@/lib/contract/abi";
import { SHIPSTAMP_CONTRACT_ADDRESS } from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";
import type { GitHubVerificationError, VerifiedGitHubCommit } from "@/lib/github/types";
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
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [createdStamp, setCreatedStamp] = useState<BuildStampRecord | null>(null);

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
      setError(validationError instanceof Error ? validationError.message : "Check the submitted build fields.");
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
      const body = (await response.json()) as VerifiedGitHubCommit | GitHubVerificationError;
      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error.message : "GitHub validation failed.");
      }
      if (body.commitSha !== claim.commitSha) {
        throw new Error("GitHub returned a different commit than the canonical submission.");
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
        setError("This wallet has already stamped the same repository, commit, and deployment URL.");
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

      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== "success") throw new Error("The Monad transaction reverted.");

      setStage("reading-receipt");
      const events = parseEventLogs({
        abi: shipStampRegistryAbi,
        eventName: "BuildStamped",
        logs: receipt.logs,
        strict: true,
      });
      const stampId = events[0]?.args.stampId;
      if (stampId === undefined) throw new Error("The confirmed transaction did not emit a build stamp ID.");

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
    <section className="border border-[var(--ink)] bg-[var(--paper-raised)]" aria-labelledby="stamp-form-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] px-5 py-4 sm:px-7">
        <div>
          <p className="technical-label">New build manifest</p>
          <h2 id="stamp-form-heading" className="mt-1 text-2xl font-black tracking-[-0.035em]">
            Verify, then stamp.
          </h2>
        </div>
        <NetworkIndicator />
      </div>

      <div className="border-b border-[var(--rule)] px-5 py-5 sm:px-7">
        <WalletControl />
      </div>

      <form onSubmit={verifyBuild} noValidate className="p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
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
          <div>
            <label htmlFor="milestone" className="technical-label block">
              Milestone description
            </label>
            <textarea
              id="milestone"
              value={input.milestone}
              onChange={(event) => updateInput("milestone", event.target.value)}
              rows={3}
              maxLength={280}
              placeholder="What genuinely shipped in this build?"
              className="mt-2 w-full resize-y border border-[var(--rule)] bg-transparent px-3 py-3 text-sm outline-none focus:border-[var(--ink)]"
            />
          </div>
        </div>

        {error && stage !== "error" ? (
          <div className="mt-5 border-l-4 border-[var(--stamp)] bg-red-50 px-4 py-3 text-sm text-[var(--stamp-dark)]" role="alert">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isVerifying}
          className="mt-6 border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-sm font-bold text-[var(--paper-raised)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVerifying ? "Verifying with GitHub…" : "Verify build"}
        </button>

        {verification ? (
          <div className="mt-8 space-y-7" aria-live="polite">
            <CommitPreview commit={verification.github} />
            <ArtifactPreview claim={verification.claim} wallet={address} />

            <label className="flex items-start gap-3 border-t border-[var(--rule)] pt-6 text-sm leading-6">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--stamp)]"
              />
              <span>
                I understand this records a wallet-signed build claim on Monad. It does not prove
                repository ownership or that the deployment serves this commit.
              </span>
            </label>

            <button
              type="button"
              onClick={stampBuild}
              disabled={!confirmed || stage === "awaiting-approval" || stage === "pending" || stage === "reading-receipt"}
              className="border-2 border-[var(--stamp)] bg-[var(--stamp)] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Stamp this build
            </button>

            <TransactionProgress stage={stage} error={stage === "error" ? error : null} />
            {transactionHash && stage !== "confirmed" ? (
              <a
                href={getExplorerTransactionUrl(transactionHash)}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-semibold underline underline-offset-4"
              >
                Inspect pending transaction ↗
              </a>
            ) : null}
          </div>
        ) : null}
      </form>

      {createdStamp ? (
        <div className="border-t border-[var(--ink)] p-5 sm:p-7">
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
    <div>
      <label htmlFor={id} className="technical-label block">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`mt-2 w-full border border-[var(--rule)] bg-transparent px-3 py-3 text-sm outline-none focus:border-[var(--ink)] ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function getTransactionError(error: unknown) {
  const message = error instanceof Error ? error.message : "The transaction was not completed.";
  if (/reject|denied|cancel/i.test(message)) return "The wallet transaction was rejected.";
  if (/DuplicateStamp|already stamped/i.test(message)) {
    return "This wallet has already stamped the exact repository, commit, and deployment.";
  }
  if (/insufficient funds/i.test(message)) return "The wallet does not have enough test MON for gas.";
  if (/revert/i.test(message)) return "The transaction reverted. No build receipt was created.";
  return message.split("\n")[0];
}

