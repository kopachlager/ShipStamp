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
      commit: "8aaf229ee448221d9142b3525e33f0cad7c19b55",
      deploymentUrl: "https://ship-stamp.vercel.app",
      wallet: "0x5cd82f40b71f5a4ea7343ce7aa10987d5f197177",
    });
    expect(getManifestHash(manifest)).toBe(
      "0x16a7948e8cdf53cdea7231887d142305fa77b7c9895dd9519aac95d64285751f",
    );
  });
});
