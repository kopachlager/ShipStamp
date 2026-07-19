// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/deployment/verify", () => ({
  verifyLiveManifest: vi.fn(),
}));

import { verifyLiveManifest } from "@/lib/deployment/verify";
import { POST } from "./route";

const requestBody = {
  deploymentUrl: "https://shipstamp.example",
  expectedRepository: "kopachlager/shipstamp",
  expectedCommit: "a".repeat(40),
  expectedWallet: "0x0000000000000000000000000000000000000001",
  expectedProject: "ShipStamp",
  schemaVersion: "1",
};

describe("POST /api/deployment/verify", () => {
  beforeEach(() => vi.mocked(verifyLiveManifest).mockReset());

  it("returns a successful live verification without caching it", async () => {
    vi.mocked(verifyLiveManifest).mockResolvedValue({
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
      manifestHash:
        "0x3be7a36e7fd8bda04f33ac7373e5a90b49467021bc334b32580f373d70c3526d",
      matches: {
        repositoryMatch: true,
        commitMatch: true,
        deploymentMatch: true,
        walletMatch: true,
        schemaVersionMatch: true,
        projectMatch: true,
      },
      verifiedAt: "2026-07-19T12:00:00.000Z",
    });

    const response = await POST(makeRequest(requestBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ verified: true });
  });

  it("rejects malformed input before attempting a fetch", async () => {
    const response = await POST(makeRequest({ deploymentUrl: "https://example.com" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      verified: false,
      error: { code: "INVALID_REQUEST" },
    });
    expect(verifyLiveManifest).not.toHaveBeenCalled();
  });

  it("maps missing manifests to a safe 404 response", async () => {
    vi.mocked(verifyLiveManifest).mockResolvedValue({
      verified: false,
      verifiedAt: "2026-07-19T12:00:00.000Z",
      error: { code: "MANIFEST_NOT_FOUND", message: "Manifest not found." },
    });
    const response = await POST(makeRequest(requestBody));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "MANIFEST_NOT_FOUND" },
    });
  });
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/deployment/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify(body),
  });
}
