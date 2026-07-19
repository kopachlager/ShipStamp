import { getManifestHash } from "@/lib/artifact/hash";
import {
  assertSafeDeploymentOrigin,
  getManifestUrl,
  validateManifestRedirect,
  type AddressResolver,
} from "@/lib/deployment/safety";
import type {
  DeploymentVerificationErrorCode,
  DeploymentVerificationResponse,
  ManifestMatchResults,
} from "@/lib/deployment/types";
import { createManifest, normalizeManifest } from "@/lib/manifest/schema";
import {
  MANIFEST_PATH,
  MAX_MANIFEST_RESPONSE_BYTES,
} from "@/lib/validation/constants";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8_000;

export class ManifestVerificationError extends Error {
  constructor(
    public readonly code: DeploymentVerificationErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ManifestVerificationError";
  }
}

type VerificationInput = {
  deploymentUrl: string;
  expectedRepository: string;
  expectedCommit: string;
  expectedWallet: string;
  expectedProject: string;
  schemaVersion: string;
};

type Dependencies = {
  fetchFn?: typeof fetch;
  resolver?: AddressResolver;
  now?: () => Date;
};

export async function verifyLiveManifest(
  input: VerificationInput,
  dependencies: Dependencies = {},
): Promise<DeploymentVerificationResponse> {
  const now = dependencies.now ?? (() => new Date());
  const verifiedAt = now().toISOString();
  let expected;
  let origin: string;
  try {
    expected = createManifest({
      project: input.expectedProject,
      repository: input.expectedRepository,
      commit: input.expectedCommit,
      deploymentUrl: input.deploymentUrl,
      wallet: input.expectedWallet,
    });
    if (input.schemaVersion !== expected.schemaVersion) {
      throw new ManifestVerificationError(
        "MANIFEST_SCHEMA_INVALID",
        "ShipStamp currently supports manifest schema version 1 only.",
      );
    }
    origin = await assertSafeDeploymentOrigin(
      expected.deploymentUrl,
      dependencies.resolver,
    );
  } catch (error) {
    const manifestError = toManifestError(error, "UNSAFE_DEPLOYMENT_URL");
    return failure(manifestError, verifiedAt);
  }

  let manifestUrl = getManifestUrl(origin);
  try {
    const response = await fetchManifest(
      manifestUrl,
      dependencies.fetchFn ?? fetch,
      dependencies.resolver,
    );
    manifestUrl = response.url;
    let parsed;
    try {
      parsed = normalizeManifest(response.value);
    } catch {
      throw new ManifestVerificationError(
        "MANIFEST_SCHEMA_INVALID",
        "The live manifest does not match the strict schema version 1.",
      );
    }
    const matches: ManifestMatchResults = {
      repositoryMatch: parsed.repository === expected.repository,
      commitMatch: parsed.commit === expected.commit,
      deploymentMatch: parsed.deploymentUrl === expected.deploymentUrl,
      walletMatch: parsed.wallet.toLowerCase() === expected.wallet.toLowerCase(),
      schemaVersionMatch: parsed.schemaVersion === expected.schemaVersion,
      projectMatch: parsed.project === expected.project,
    };
    const manifestHash = getManifestHash(parsed);
    const mismatch = firstMismatch(matches);
    if (mismatch) {
      return {
        verified: false,
        manifestUrl,
        manifest: parsed,
        manifestHash,
        matches,
        verifiedAt,
        error: { code: mismatch.code, message: mismatch.message },
      };
    }
    return { verified: true, manifestUrl, manifest: parsed, manifestHash, matches, verifiedAt };
  } catch (error) {
    return failure(toManifestError(error, "FETCH_FAILED"), verifiedAt, manifestUrl);
  }
}

async function fetchManifest(
  initialUrl: string,
  fetchFn: typeof fetch,
  resolver?: AddressResolver,
): Promise<{ url: string; value: unknown }> {
  let currentUrl = initialUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetchFn(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "application/json, application/*+json",
          "User-Agent": "ShipStamp-Manifest-Verifier/1.0",
        },
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ManifestVerificationError("FETCH_TIMEOUT", "The deployment manifest request timed out.", 504);
      }
      throw new ManifestVerificationError("FETCH_FAILED", "The deployment manifest could not be fetched safely.", 502);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) {
        throw new ManifestVerificationError("FETCH_FAILED", "The manifest redirect chain is invalid or too long.", 502);
      }
      let redirect: URL;
      try {
        redirect = validateManifestRedirect(currentUrl, location);
        await assertSafeDeploymentOrigin(redirect.origin, resolver);
      } catch {
        throw new ManifestVerificationError(
          "UNSAFE_DEPLOYMENT_URL",
          "The manifest redirected to an unsafe or unsupported destination.",
        );
      }
      currentUrl = `${redirect.origin}${MANIFEST_PATH}`;
      continue;
    }
    if (response.status === 404) {
      throw new ManifestVerificationError("MANIFEST_NOT_FOUND", `No ShipStamp manifest was found at ${MANIFEST_PATH}.`, 404);
    }
    if (!response.ok) {
      throw new ManifestVerificationError("FETCH_FAILED", "The deployment returned an unsuccessful manifest response.", 502);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json") && !contentType.includes("+json")) {
      throw new ManifestVerificationError("MANIFEST_INVALID_JSON", "The manifest response must use a JSON content type.");
    }
    const text = await readLimitedBody(response);
    try {
      return { url: currentUrl, value: JSON.parse(text) };
    } catch {
      throw new ManifestVerificationError("MANIFEST_INVALID_JSON", "The deployment manifest is not valid JSON.");
    }
  }
  throw new ManifestVerificationError("FETCH_FAILED", "The manifest redirect chain is invalid.", 502);
}

async function readLimitedBody(response: Response): Promise<string> {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_MANIFEST_RESPONSE_BYTES) {
    throw new ManifestVerificationError("MANIFEST_TOO_LARGE", "The manifest exceeds the 32 KB response limit.", 413);
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_MANIFEST_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ManifestVerificationError("MANIFEST_TOO_LARGE", "The manifest exceeds the 32 KB response limit.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function firstMismatch(matches: ManifestMatchResults) {
  const checks: Array<[keyof ManifestMatchResults, DeploymentVerificationErrorCode, string]> = [
    ["schemaVersionMatch", "MANIFEST_SCHEMA_INVALID", "The manifest schema version does not match."],
    ["projectMatch", "PROJECT_MISMATCH", "The live manifest project name does not match."],
    ["repositoryMatch", "REPOSITORY_MISMATCH", "The live manifest repository does not match."],
    ["commitMatch", "COMMIT_MISMATCH", "The live manifest commit does not match."],
    ["deploymentMatch", "DEPLOYMENT_MISMATCH", "The live manifest deployment URL does not match."],
    ["walletMatch", "WALLET_MISMATCH", "The live manifest wallet does not match the connected wallet."],
  ];
  for (const [key, code, message] of checks) if (!matches[key]) return { code, message };
  return null;
}

function toManifestError(error: unknown, fallback: DeploymentVerificationErrorCode) {
  if (error instanceof ManifestVerificationError) return error;
  const code = error instanceof Error && error.message === "UNSAFE_DEPLOYMENT_URL" ? "UNSAFE_DEPLOYMENT_URL" : fallback;
  const messages: Partial<Record<DeploymentVerificationErrorCode, string>> = {
    UNSAFE_DEPLOYMENT_URL: "Use a public HTTPS deployment origin without credentials, custom ports, paths, or private network addresses.",
    MANIFEST_SCHEMA_INVALID: "The live manifest does not match schema version 1.",
  };
  return new ManifestVerificationError(code, messages[code] ?? "The live manifest could not be verified safely.", code === "FETCH_FAILED" ? 502 : 400);
}

function failure(error: ManifestVerificationError, verifiedAt: string, manifestUrl?: string): DeploymentVerificationResponse {
  return { verified: false, manifestUrl, verifiedAt, error: { code: error.code, message: error.message } };
}
