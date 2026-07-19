import { getAddress, isAddress, type Address } from "viem";
import { z } from "zod";
import {
  normalizeCommitSha,
  normalizeDeploymentUrl,
  normalizeProjectName,
} from "@/lib/artifact/normalization";
import {
  MANIFEST_SCHEMA_VERSION,
  MAX_DEPLOYMENT_URL_LENGTH,
  MAX_PROJECT_BYTES,
  MAX_REPOSITORY_URL_LENGTH,
} from "@/lib/validation/constants";
import { InputValidationError } from "@/lib/validation/errors";

export const shipStampManifestSchema = z
  .object({
    schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION),
    project: z.string().min(1).max(MAX_PROJECT_BYTES),
    repository: z.string().min(3).max(MAX_REPOSITORY_URL_LENGTH),
    commit: z.string().length(40),
    deploymentUrl: z.string().min(9).max(MAX_DEPLOYMENT_URL_LENGTH),
    wallet: z.string().min(42).max(42),
  })
  .strict();

export type ShipStampManifest = {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  project: string;
  repository: string;
  commit: string;
  deploymentUrl: string;
  wallet: Address;
};

export function normalizeWallet(input: string): Address {
  if (!isAddress(input)) {
    throw new InputValidationError("INVALID_WALLET", "Connect a valid EVM wallet.");
  }
  return getAddress(input).toLowerCase() as Address;
}

export function normalizeManifest(value: unknown): ShipStampManifest {
  const parsed = shipStampManifestSchema.safeParse(value);
  if (!parsed.success) {
    throw new InputValidationError(
      "INVALID_PROJECT",
      "The live ShipStamp manifest does not match schema version 1.",
    );
  }

  const repository = parsed.data.repository.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38})\/[a-z0-9._-]{1,100}$/.test(repository)) {
    throw new InputValidationError(
      "INVALID_GITHUB_URL",
      "The manifest repository must use lowercase owner/repository format.",
    );
  }

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    project: normalizeProjectName(parsed.data.project),
    repository,
    commit: normalizeCommitSha(parsed.data.commit),
    deploymentUrl: normalizeDeploymentUrl(parsed.data.deploymentUrl),
    wallet: normalizeWallet(parsed.data.wallet),
  };
}

export function createManifest(input: {
  project: string;
  repository: string;
  commit: string;
  deploymentUrl: string;
  wallet: string;
}): ShipStampManifest {
  return normalizeManifest({
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    ...input,
  });
}

export function serializeManifest(manifest: ShipStampManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
