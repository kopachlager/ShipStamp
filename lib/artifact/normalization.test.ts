import { describe, expect, it } from "vitest";
import {
  normalizeCommitSha,
  normalizeDeploymentUrl,
  normalizeMilestone,
  normalizeProjectName,
  parseGitHubRepositoryUrl,
} from "./normalization";

describe("parseGitHubRepositoryUrl", () => {
  it("normalizes a supported GitHub repository", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/KopachLager/ShipStamp.git/?tab=readme#top"),
    ).toEqual({
      owner: "kopachlager",
      repository: "shipstamp",
      identifier: "kopachlager/shipstamp",
      url: "https://github.com/kopachlager/shipstamp",
    });
  });

  it("rejects unsupported providers and nested GitHub paths", () => {
    expect(() => parseGitHubRepositoryUrl("https://gitlab.com/owner/repo")).toThrow(
      "supports public repositories on github.com only",
    );
    expect(() => parseGitHubRepositoryUrl("https://github.com/owner/repo/issues")).toThrow(
      "form https://github.com/owner/repository",
    );
  });
});

describe("canonical field normalization", () => {
  it("requires and lowercases a full commit SHA", () => {
    expect(normalizeCommitSha("A".repeat(40))).toBe("a".repeat(40));
    expect(() => normalizeCommitSha("abc123")).toThrow("full 40-character");
    expect(() => normalizeCommitSha("z".repeat(40))).toThrow("full 40-character");
  });

  it("normalizes an HTTPS deployment origin deterministically", () => {
    expect(normalizeDeploymentUrl("https://EXAMPLE.com:443/#details")).toBe(
      "https://example.com",
    );
    expect(() => normalizeDeploymentUrl("https://example.com/releases/v1")).toThrow(
      "deployment origins only",
    );
    expect(() => normalizeDeploymentUrl("https://example.com/?build=1")).toThrow(
      "deployment origins only",
    );
  });

  it("rejects non-HTTPS and private deployment hosts", () => {
    expect(() => normalizeDeploymentUrl("http://example.com")).toThrow("must use HTTPS");
    expect(() => normalizeDeploymentUrl("https://localhost")).toThrow("publicly reachable");
    expect(() => normalizeDeploymentUrl("https://192.168.1.5")).toThrow("publicly reachable");
  });

  it("trims milestones and enforces the UTF-8 contract limit", () => {
    expect(normalizeMilestone("  First end-to-end receipt  ")).toBe("First end-to-end receipt");
    expect(() => normalizeMilestone("🚢".repeat(71))).toThrow("280 UTF-8 bytes");
  });

  it("normalizes project names without changing human-readable casing", () => {
    expect(normalizeProjectName("  ShipStamp   Registry ")).toBe("ShipStamp Registry");
    expect(() => normalizeProjectName(" ")).toThrow("project name");
  });
});
