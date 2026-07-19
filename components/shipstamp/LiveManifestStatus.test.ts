import { describe, expect, it } from "vitest";
import type { DeploymentVerificationResponse } from "@/lib/deployment/types";
import { getCurrentManifestStatus } from "./LiveManifestStatus";

const recordedHash = `0x${"1".repeat(64)}` as `0x${string}`;
const checkedAt = "2026-07-19T12:00:00.000Z";

describe("current manifest comparison", () => {
  it("distinguishes a matching receipt from a changed manifest", () => {
    const matching = success(recordedHash);
    const changed = success(`0x${"2".repeat(64)}`);
    expect(getCurrentManifestStatus(matching, recordedHash)).toBe(
      "Current manifest matches recorded receipt",
    );
    expect(getCurrentManifestStatus(changed, recordedHash)).toBe(
      "Current manifest has changed",
    );
  });

  it("distinguishes unavailable, invalid, and rate-limited checks", () => {
    expect(getCurrentManifestStatus(failure("MANIFEST_NOT_FOUND"), recordedHash)).toBe(
      "Manifest is currently unavailable",
    );
    expect(getCurrentManifestStatus(failure("MANIFEST_SCHEMA_INVALID"), recordedHash)).toBe(
      "Manifest is invalid",
    );
    expect(getCurrentManifestStatus(failure("REQUEST_RATE_LIMIT"), recordedHash)).toBe(
      "Verification service unavailable",
    );
  });
});

function success(manifestHash: `0x${string}`): DeploymentVerificationResponse {
  return {
    verified: true,
    manifestUrl: "https://shipstamp.example/.well-known/shipstamp.json",
    manifest: {
      schemaVersion: "1",
      project: "ShipStamp",
      repository: "kopachlager/shipstamp",
      commit: "a".repeat(40),
      deploymentUrl: "https://shipstamp.example",
      wallet: "0x0000000000000000000000000000000000000001",
    },
    manifestHash,
    matches: {
      repositoryMatch: true,
      commitMatch: true,
      deploymentMatch: true,
      walletMatch: true,
      schemaVersionMatch: true,
      projectMatch: true,
    },
    verifiedAt: checkedAt,
  };
}

function failure(
  code: "MANIFEST_NOT_FOUND" | "MANIFEST_SCHEMA_INVALID" | "REQUEST_RATE_LIMIT",
): DeploymentVerificationResponse {
  return {
    verified: false,
    verifiedAt: checkedAt,
    error: { code, message: "Safe error" },
  };
}
