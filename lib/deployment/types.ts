import type { ShipStampManifest } from "@/lib/manifest/schema";

export type DeploymentVerificationErrorCode =
  | "INVALID_REQUEST"
  | "MANIFEST_NOT_FOUND"
  | "MANIFEST_INVALID_JSON"
  | "MANIFEST_TOO_LARGE"
  | "MANIFEST_SCHEMA_INVALID"
  | "REPOSITORY_MISMATCH"
  | "COMMIT_MISMATCH"
  | "DEPLOYMENT_MISMATCH"
  | "WALLET_MISMATCH"
  | "PROJECT_MISMATCH"
  | "UNSAFE_DEPLOYMENT_URL"
  | "FETCH_TIMEOUT"
  | "FETCH_FAILED"
  | "REQUEST_RATE_LIMIT";

export type ManifestMatchResults = {
  repositoryMatch: boolean;
  commitMatch: boolean;
  deploymentMatch: boolean;
  walletMatch: boolean;
  schemaVersionMatch: boolean;
  projectMatch: boolean;
};

export type DeploymentVerificationSuccess = {
  verified: true;
  manifestUrl: string;
  manifest: ShipStampManifest;
  manifestHash: `0x${string}`;
  matches: ManifestMatchResults;
  verifiedAt: string;
};

export type DeploymentVerificationFailure = {
  verified: false;
  manifestUrl?: string;
  manifest?: ShipStampManifest;
  manifestHash?: `0x${string}`;
  matches?: ManifestMatchResults;
  verifiedAt: string;
  error: { code: DeploymentVerificationErrorCode; message: string };
};

export type DeploymentVerificationResponse =
  | DeploymentVerificationSuccess
  | DeploymentVerificationFailure;
