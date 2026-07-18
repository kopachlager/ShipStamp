import { describe, expect, it } from "vitest";
import { prepareBuildClaim } from "./build-claim";

describe("prepareBuildClaim", () => {
  it("normalizes and hashes a valid form submission", () => {
    const claim = prepareBuildClaim({
      repositoryUrl: "https://github.com/KopachLager/ShipStamp.git",
      commitSha: "A".repeat(40),
      deploymentUrl: "https://SHIPSTAMP.example/",
      milestone: "  Public receipt released  ",
    });

    expect(claim).toMatchObject({
      repository: "kopachlager/shipstamp",
      commitSha: "a".repeat(40),
      deploymentUrl: "https://shipstamp.example",
      milestone: "Public receipt released",
    });
    expect(claim.canonicalArtifactInput).toContain("kopachlager/shipstamp:");
    expect(claim.artifactHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("rejects invalid form fields before GitHub or wallet actions", () => {
    expect(() =>
      prepareBuildClaim({
        repositoryUrl: "not a url",
        commitSha: "short",
        deploymentUrl: "http://localhost:3000",
        milestone: "",
      }),
    ).toThrow("complete GitHub repository URL");
  });
});

