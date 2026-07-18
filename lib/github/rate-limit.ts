type RateLimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_TRACKED_CLIENTS = 1_000;
const clients = new Map<string, RateLimitEntry>();

export function checkGitHubVerificationRateLimit(clientId: string, now = Date.now()) {
  if (clients.size > MAX_TRACKED_CLIENTS) {
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
  }

  const current = clients.get(clientId);
  if (!current || current.resetAt <= now) {
    clients.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 } as const;
  }
  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    } as const;
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 } as const;
}

