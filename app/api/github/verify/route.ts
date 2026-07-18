import { NextResponse } from "next/server";
import { normalizeCommitSha, parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import { GitHubClientError, verifyPublicGitHubCommit } from "@/lib/github/client";
import { checkGitHubVerificationRateLimit } from "@/lib/github/rate-limit";
import type { GitHubVerificationErrorCode } from "@/lib/github/types";
import { InputValidationError } from "@/lib/validation/errors";

const MAX_REQUEST_BYTES = 4_096;

export async function POST(request: Request) {
  const clientId = getClientId(request.headers);
  const rateLimit = checkGitHubVerificationRateLimit(clientId);
  if (!rateLimit.allowed) {
    return errorResponse(
      "REQUEST_RATE_LIMIT",
      "Too many verification attempts. Wait briefly and try again.",
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

  if (!isVerificationRequest(body)) {
    return errorResponse("INVALID_REQUEST", "Repository URL and commit SHA are required.", 400);
  }

  try {
    const repository = parseGitHubRepositoryUrl(body.repositoryUrl);
    const commitSha = normalizeCommitSha(body.commitSha);
    const verifiedCommit = await verifyPublicGitHubCommit(repository, commitSha);
    return NextResponse.json(verifiedCommit, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof InputValidationError) {
      const code = mapValidationCode(error.code);
      return errorResponse(code, error.message, 400);
    }
    if (error instanceof GitHubClientError) {
      const status =
        error.code === "GITHUB_RATE_LIMIT"
          ? 429
          : error.code === "GITHUB_UNAVAILABLE"
            ? 503
            : 404;
      return errorResponse(error.code, error.message, status);
    }
    return errorResponse("GITHUB_UNAVAILABLE", "GitHub validation failed safely. Try again shortly.", 503);
  }
}

function isVerificationRequest(value: unknown): value is { repositoryUrl: string; commitSha: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.repositoryUrl === "string" && typeof candidate.commitSha === "string";
}

function getClientId(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

function mapValidationCode(code: InputValidationError["code"]): GitHubVerificationErrorCode {
  if (code === "UNSUPPORTED_GIT_PROVIDER") return "UNSUPPORTED_GIT_PROVIDER";
  if (code === "INVALID_COMMIT_SHA") return "INVALID_COMMIT_SHA";
  return "INVALID_GITHUB_URL";
}

function errorResponse(
  code: GitHubVerificationErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

