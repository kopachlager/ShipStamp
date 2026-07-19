import { NextResponse } from "next/server";
import { checkDeploymentVerificationRateLimit } from "@/lib/deployment/rate-limit";
import type { DeploymentVerificationErrorCode } from "@/lib/deployment/types";
import { verifyLiveManifest } from "@/lib/deployment/verify";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 8_192;

export async function POST(request: Request) {
  const rateLimit = checkDeploymentVerificationRateLimit(getClientId(request.headers));
  if (!rateLimit.allowed) {
    return errorResponse(
      "REQUEST_RATE_LIMIT",
      "Too many live manifest checks. Wait briefly and try again.",
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("INVALID_REQUEST", "The verification request is too large.", 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_REQUEST_BYTES) {
      return errorResponse("INVALID_REQUEST", "The verification request is too large.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return errorResponse("INVALID_REQUEST", "Send a valid JSON verification request.", 400);
  }

  if (!isRequestBody(body)) {
    return errorResponse(
      "INVALID_REQUEST",
      "Deployment, repository, commit, wallet, project, and schema version are required.",
      400,
    );
  }

  const result = await verifyLiveManifest(body);
  const status = result.verified ? 200 : statusForCode(result.error.code);
  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRequestBody(value: unknown): value is Parameters<typeof verifyLiveManifest>[0] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const keys = [
    "deploymentUrl",
    "expectedRepository",
    "expectedCommit",
    "expectedWallet",
    "expectedProject",
    "schemaVersion",
  ];
  return keys.every(
    (key) => typeof candidate[key] === "string" && (candidate[key] as string).length <= 2_048,
  );
}

function getClientId(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

function statusForCode(code: DeploymentVerificationErrorCode) {
  if (code === "MANIFEST_NOT_FOUND") return 404;
  if (code === "MANIFEST_TOO_LARGE") return 413;
  if (code === "FETCH_TIMEOUT") return 504;
  if (code === "FETCH_FAILED") return 502;
  if (code === "REQUEST_RATE_LIMIT") return 429;
  return 400;
}

function errorResponse(
  code: DeploymentVerificationErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { verified: false, verifiedAt: new Date().toISOString(), error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}
