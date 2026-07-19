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
      commit: "c0425fb09144001fdb57e7b13e977d5b85d1e1ae",
      deploymentUrl: "https://ship-stamp.vercel.app",
      wallet: "0x5cd82f40b71f5a4ea7343ce7aa10987d5f197177",
    });
    expect(getManifestHash(manifest)).toBe(
      "0x2981a95e3cd225af08c62e93c1d14709ad2182d37086dc0a37fbda233d8fa2e5",
    );
  });
});
