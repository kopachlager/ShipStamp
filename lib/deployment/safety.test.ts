// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  assertSafeDeploymentOrigin,
  isPublicIp,
  validateManifestRedirect,
} from "./safety";

const publicResolver = async () => [{ address: "93.184.216.34", family: 4 }];

describe("deployment fetch safety", () => {
  it("accepts a public HTTPS origin", async () => {
    await expect(
      assertSafeDeploymentOrigin("https://EXAMPLE.com/", publicResolver),
    ).resolves.toBe("https://example.com");
  });

  it("rejects paths, credentials, ports, localhost, and private DNS results", async () => {
    await expect(assertSafeDeploymentOrigin("https://example.com/app", publicResolver)).rejects.toThrow();
    await expect(assertSafeDeploymentOrigin("https://user@example.com", publicResolver)).rejects.toThrow();
    await expect(assertSafeDeploymentOrigin("https://example.com:8443", publicResolver)).rejects.toThrow();
    await expect(assertSafeDeploymentOrigin("https://localhost", publicResolver)).rejects.toThrow();
    await expect(assertSafeDeploymentOrigin("https://example.com", async () => [{ address: "10.0.0.1", family: 4 }])).rejects.toThrow("UNSAFE_DEPLOYMENT_URL");
  });

  it("recognizes private and public IP ranges", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("169.254.169.254")).toBe(false);
    expect(isPublicIp("192.168.1.1")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("fd00::1")).toBe(false);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
    expect(isPublicIp("93.184.216.34")).toBe(true);
  });

  it("rejects redirects away from the fixed manifest path", () => {
    expect(() => validateManifestRedirect("https://example.com/.well-known/shipstamp.json", "http://localhost/secret")).toThrow("UNSAFE_DEPLOYMENT_URL");
    expect(() => validateManifestRedirect("https://example.com/.well-known/shipstamp.json", "https://example.com/admin")).toThrow("UNSAFE_DEPLOYMENT_URL");
  });
});
