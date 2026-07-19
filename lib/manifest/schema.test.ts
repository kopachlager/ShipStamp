import { describe, expect, it } from "vitest";
import {
  createManifest,
  normalizeManifest,
  normalizeWallet,
  serializeManifest,
} from "./schema";

const validManifest = {
  schemaVersion: "1",
  project: "ShipStamp",
  repository: "kopachlager/shipstamp",
  commit: "a".repeat(40),
  deploymentUrl: "https://shipstamp.example",
  wallet: "0x0000000000000000000000000000000000000001",
};

describe("ShipStamp manifest schema", () => {
  it("generates a normalized version 1 manifest", () => {
    expect(
      createManifest({
        project: "  ShipStamp  ",
        repository: "KOPACHLAGER/SHIPSTAMP",
        commit: "A".repeat(40),
        deploymentUrl: "https://SHIPSTAMP.EXAMPLE/",
        wallet: validManifest.wallet,
      }),
    ).toEqual(validManifest);
  });

  it("uses a stable JSON field order for installation, without hashing JSON text", () => {
    expect(serializeManifest(normalizeManifest(validManifest))).toBe(
      `${JSON.stringify(validManifest, null, 2)}\n`,
    );
  });

  it("rejects unknown fields, malformed commits, and invalid wallets", () => {
    expect(() => normalizeManifest({ ...validManifest, extra: true })).toThrow();
    expect(() => normalizeManifest({ ...validManifest, commit: "abc" })).toThrow();
    expect(() => normalizeWallet("not-a-wallet")).toThrow();
  });
});
