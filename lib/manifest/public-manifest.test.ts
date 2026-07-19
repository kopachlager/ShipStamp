// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getManifestHash } from "@/lib/artifact/hash";
import { normalizeManifest } from "./schema";

describe("ShipStamp public self-manifest", () => {
  it("is a valid canonical manifest with the expected onchain hash", async () => {
    const raw = await readFile(
      new URL("../../public/.well-known/shipstamp.json", import.meta.url),
      "utf8",
    );
    const manifest = normalizeManifest(JSON.parse(raw));
    expect(manifest).toMatchObject({
      repository: "kopachlager/shipstamp",
      commit: "1b4903058e3c75ebc574994a1df66e35ed43090b",
      deploymentUrl: "https://ship-stamp.vercel.app",
      wallet: "0x5cd82f40b71f5a4ea7343ce7aa10987d5f197177",
    });
    expect(getManifestHash(manifest)).toBe(
      "0x08f726579b5045bed1aa9072aad1bb0b7d579828dcbed1d932412924a770792a",
    );
  });
});
