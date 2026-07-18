import { describe, expect, it } from "vitest";
import { getArtifactHash, getCanonicalArtifactInput, getDuplicateKey } from "./hash";

describe("artifact identity", () => {
  const repository = "kopachlager/shipstamp";
  const commit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const deployment = "https://shipstamp.example";

  it("builds the documented canonical input and keccak256 hash", () => {
    expect(getCanonicalArtifactInput(repository, commit, deployment)).toBe(
      "kopachlager/shipstamp:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:https://shipstamp.example",
    );
    expect(getArtifactHash(repository, commit, deployment)).toBe(
      "0xa159c1f5b365a76744cf7fdca8b721a7c3fd37017c6d9b4202e4315c53fa6935",
    );
  });

  it("includes the builder in the exact duplicate key", () => {
    const first = getDuplicateKey(
      "0x0000000000000000000000000000000000000001",
      repository,
      commit,
      deployment,
    );
    const second = getDuplicateKey(
      "0x0000000000000000000000000000000000000002",
      repository,
      commit,
      deployment,
    );
    expect(first).not.toBe(second);
  });
});
