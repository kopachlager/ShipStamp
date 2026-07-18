export function formatTimestamp(timestamp: bigint) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(Number(timestamp) * 1_000));
}

export function shortenHex(value: string, start = 8, end = 6) {
  if (value.length <= start + end + 1) return value;
  return end > 0 ? `${value.slice(0, start)}…${value.slice(-end)}` : `${value.slice(0, start)}…`;
}

export function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
