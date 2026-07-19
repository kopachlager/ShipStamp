import { describe, expect, it } from "vitest";
import { getCanonicalManifestLines, getDuplicateKey, getManifestHash } from "./hash";

describe("manifest identity", () => {
  const manifest = {
    schemaVersion: "1",
    project: "ShipStamp",
    repository: "kopachlager/shipstamp",
    commit: "a".repeat(40),
    deploymentUrl: "https://shipstamp.example",
    wallet: "0x0000000000000000000000000000000000000001" as const,
  };

  it("uses fixed field ordering and Solidity-compatible ABI encoding", () => {
    expect(getCanonicalManifestLines(manifest)).toBe(
      `schemaVersion=1\nproject=ShipStamp\nrepository=kopachlager/shipstamp\ncommit=${"a".repeat(40)}\ndeploymentUrl=https://shipstamp.example\nwallet=0x0000000000000000000000000000000000000001`,
    );
    expect(getManifestHash(manifest)).toBe(
      "0x3be7a36e7fd8bda04f33ac7373e5a90b49467021bc334b32580f373d70c3526d",
    );
  });

  it("includes builder and manifest hash in the duplicate key", () => {
    const hash = getManifestHash(manifest);
    const first = getDuplicateKey(manifest.wallet, manifest.repository, manifest.commit, manifest.deploymentUrl, hash);
    const second = getDuplicateKey("0x0000000000000000000000000000000000000002", manifest.repository, manifest.commit, manifest.deploymentUrl, hash);
    expect(first).not.toBe(second);
  });
});
