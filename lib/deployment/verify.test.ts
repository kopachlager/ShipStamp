// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { verifyLiveManifest } from "./verify";

const input = {
  deploymentUrl: "https://shipstamp.example",
  expectedRepository: "kopachlager/shipstamp",
  expectedCommit: "a".repeat(40),
  expectedWallet: "0x0000000000000000000000000000000000000001",
  expectedProject: "ShipStamp",
  schemaVersion: "1",
};
const manifest = {
  schemaVersion: "1",
  project: "ShipStamp",
  repository: "kopachlager/shipstamp",
  commit: "a".repeat(40),
  deploymentUrl: "https://shipstamp.example",
  wallet: "0x0000000000000000000000000000000000000001",
};
const resolver = async () => [{ address: "93.184.216.34", family: 4 }];
const jsonResponse = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("live deployment manifest verification", () => {
  it("verifies and hashes a matching live manifest", async () => {
    const result = await verifyLiveManifest(input, {
      resolver,
      fetchFn: vi.fn().mockResolvedValue(jsonResponse(manifest)),
      now: () => new Date("2026-07-19T12:00:00Z"),
    });
    expect(result).toMatchObject({
      verified: true,
      manifestHash: "0x3be7a36e7fd8bda04f33ac7373e5a90b49467021bc334b32580f373d70c3526d",
      matches: { repositoryMatch: true, commitMatch: true, deploymentMatch: true, walletMatch: true, projectMatch: true },
      verifiedAt: "2026-07-19T12:00:00.000Z",
    });
  });

  it.each([
    ["repository", "someone/else", "REPOSITORY_MISMATCH"],
    ["commit", "b".repeat(40), "COMMIT_MISMATCH"],
    ["deploymentUrl", "https://other.example", "DEPLOYMENT_MISMATCH"],
    ["wallet", "0x0000000000000000000000000000000000000002", "WALLET_MISMATCH"],
    ["project", "Other", "PROJECT_MISMATCH"],
  ])("reports a %s mismatch", async (field, value, code) => {
    const result = await verifyLiveManifest(input, {
      resolver,
      fetchFn: vi.fn().mockResolvedValue(jsonResponse({ ...manifest, [field]: value })),
    });
    expect(result).toMatchObject({ verified: false, error: { code } });
  });

  it("handles missing, malformed, oversized, and schema-invalid manifests", async () => {
    const missing = await verifyLiveManifest(input, { resolver, fetchFn: vi.fn().mockResolvedValue(new Response("", { status: 404 })) });
    expect(missing).toMatchObject({ error: { code: "MANIFEST_NOT_FOUND" } });
    const malformed = await verifyLiveManifest(input, { resolver, fetchFn: vi.fn().mockResolvedValue(new Response("{", { headers: { "content-type": "application/json" } })) });
    expect(malformed).toMatchObject({ error: { code: "MANIFEST_INVALID_JSON" } });
    const oversized = await verifyLiveManifest(input, { resolver, fetchFn: vi.fn().mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json", "content-length": "40000" } })) });
    expect(oversized).toMatchObject({ error: { code: "MANIFEST_TOO_LARGE" } });
    const invalid = await verifyLiveManifest(input, { resolver, fetchFn: vi.fn().mockResolvedValue(jsonResponse({ ...manifest, extra: true })) });
    expect(invalid).toMatchObject({ error: { code: "MANIFEST_SCHEMA_INVALID" } });
  });

  it("rejects redirects to private destinations and reports timeouts", async () => {
    const redirected = await verifyLiveManifest(input, {
      resolver,
      fetchFn: vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://localhost/.well-known/shipstamp.json" } })),
    });
    expect(redirected).toMatchObject({ error: { code: "UNSAFE_DEPLOYMENT_URL" } });
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    const timeout = await verifyLiveManifest(input, { resolver, fetchFn: vi.fn().mockRejectedValue(abortError) });
    expect(timeout).toMatchObject({ error: { code: "FETCH_TIMEOUT" } });
  });
});
