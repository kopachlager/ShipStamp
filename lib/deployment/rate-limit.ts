const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

export function checkDeploymentVerificationRateLimit(clientId: string) {
  const now = Date.now();
  const recent = (attempts.get(clientId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1_000)),
    };
  }
  recent.push(now);
  attempts.set(clientId, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
