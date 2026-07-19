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
      commit: "4e8c68ed46df936b99b0c528670497d32906d235",
      deploymentUrl: "https://ship-stamp.vercel.app",
      wallet: "0x5cd82f40b71f5a4ea7343ce7aa10987d5f197177",
    });
    expect(getManifestHash(manifest)).toBe(
      "0x2c772e960e6996d6fb876848271711c0ad69dfb767e923eb9381224273ad8894",
    );
  });
});
