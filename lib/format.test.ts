import { describe, expect, it } from "vitest";
import { formatTimestamp, safeHttpsUrl, shortenHex } from "./format";

describe("receipt data formatting", () => {
  it("formats block timestamps explicitly in UTC", () => {
    expect(formatTimestamp(0n)).toContain("Jan 1, 1970");
  });

  it("shortens long identifiers without corrupting zero-length suffixes", () => {
    expect(shortenHex("abcdefghijklmnopqrstuvwxyz", 5, 4)).toBe("abcde…wxyz");
    expect(shortenHex("abcdefghijklmnopqrstuvwxyz", 7, 0)).toBe("abcdefg…");
  });

  it("allows only HTTPS external links", () => {
    expect(safeHttpsUrl("https://example.com/release")).toBe("https://example.com/release");
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("not a url")).toBeNull();
  });
});

