import {
  COMMIT_SHA_LENGTH,
  MAX_DEPLOYMENT_URL_LENGTH,
  MAX_MILESTONE_BYTES,
  MAX_PROJECT_BYTES,
  MAX_REPOSITORY_URL_LENGTH,
} from "@/lib/validation/constants";
import { InputValidationError } from "@/lib/validation/errors";

export type NormalizedRepository = {
  owner: string;
  repository: string;
  identifier: string;
  url: string;
};

const OWNER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const REPOSITORY_PATTERN = /^[a-z\d._-]+$/i;
const FULL_COMMIT_PATTERN = new RegExp(`^[a-fA-F0-9]{${COMMIT_SHA_LENGTH}}$`);

export function parseGitHubRepositoryUrl(input: string): NormalizedRepository {
  const value = input.trim();
  if (!value) {
    throw new InputValidationError("EMPTY_VALUE", "Enter a public GitHub repository URL.");
  }
  if (value.length > MAX_REPOSITORY_URL_LENGTH) {
    throw new InputValidationError("INVALID_GITHUB_URL", "The GitHub URL is too long.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InputValidationError("INVALID_GITHUB_URL", "Enter a complete GitHub repository URL.");
  }

  if (url.protocol !== "https:") {
    throw new InputValidationError("INVALID_GITHUB_URL", "GitHub repository URLs must use HTTPS.");
  }
  if (url.hostname.toLowerCase() !== "github.com") {
    throw new InputValidationError(
      "UNSUPPORTED_GIT_PROVIDER",
      "ShipStamp currently supports public repositories on github.com only.",
    );
  }
  if (url.username || url.password || url.port) {
    throw new InputValidationError("INVALID_GITHUB_URL", "The GitHub URL contains unsupported credentials or a port.");
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new InputValidationError(
      "INVALID_GITHUB_URL",
      "Use a repository URL in the form https://github.com/owner/repository.",
    );
  }

  let owner: string;
  let repository: string;
  try {
    owner = decodeURIComponent(segments[0]);
    repository = decodeURIComponent(segments[1]).replace(/\.git$/i, "");
  } catch {
    throw new InputValidationError("INVALID_GITHUB_URL", "The GitHub URL contains invalid characters.");
  }

  if (
    !OWNER_PATTERN.test(owner) ||
    owner.includes("--") ||
    repository.length === 0 ||
    repository.length > 100 ||
    !REPOSITORY_PATTERN.test(repository) ||
    repository === "." ||
    repository === ".."
  ) {
    throw new InputValidationError("INVALID_GITHUB_URL", "The GitHub owner or repository name is malformed.");
  }

  const normalizedOwner = owner.toLowerCase();
  const normalizedRepository = repository.toLowerCase();
  return {
    owner: normalizedOwner,
    repository: normalizedRepository,
    identifier: `${normalizedOwner}/${normalizedRepository}`,
    url: `https://github.com/${normalizedOwner}/${normalizedRepository}`,
  };
}

export function normalizeCommitSha(input: string): string {
  const value = input.trim();
  if (!FULL_COMMIT_PATTERN.test(value)) {
    throw new InputValidationError(
      "INVALID_COMMIT_SHA",
      "Enter the full 40-character hexadecimal Git commit SHA.",
    );
  }
  return value.toLowerCase();
}

export function normalizeDeploymentUrl(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new InputValidationError("EMPTY_VALUE", "Enter the live deployment URL.");
  }
  if (value.length > MAX_DEPLOYMENT_URL_LENGTH) {
    throw new InputValidationError("INVALID_DEPLOYMENT_URL", "The deployment URL is too long.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InputValidationError("INVALID_DEPLOYMENT_URL", "Enter a complete deployment URL.");
  }

  if (url.protocol !== "https:") {
    throw new InputValidationError(
      "INVALID_DEPLOYMENT_URL",
      "Public production submissions must use HTTPS.",
    );
  }
  if (url.username || url.password || !url.hostname || url.port) {
    throw new InputValidationError(
      "INVALID_DEPLOYMENT_URL",
      "The deployment URL contains unsupported credentials, a custom port, or no hostname.",
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (!isPublicHostname(hostname)) {
    throw new InputValidationError(
      "PRIVATE_DEPLOYMENT_HOST",
      "Use a publicly reachable production hostname, not a local or private address.",
    );
  }

  if ((url.pathname && url.pathname !== "/") || url.search) {
    throw new InputValidationError(
      "INVALID_DEPLOYMENT_URL",
      "ShipStamp supports deployment origins only, without paths or query parameters.",
    );
  }

  return `https://${hostname}`;
}

export function normalizeProjectName(input: string): string {
  const value = input.trim().replace(/\s+/g, " ");
  const byteLength = new TextEncoder().encode(value).length;
  if (!value) {
    throw new InputValidationError("INVALID_PROJECT", "Enter a project name.");
  }
  if (byteLength > MAX_PROJECT_BYTES) {
    throw new InputValidationError(
      "INVALID_PROJECT",
      `Keep the project name within ${MAX_PROJECT_BYTES} UTF-8 bytes.`,
    );
  }
  return value;
}

export function normalizeMilestone(input: string): string {
  const value = input.trim();
  const byteLength = new TextEncoder().encode(value).length;
  if (!value) {
    throw new InputValidationError("INVALID_MILESTONE", "Describe the build milestone.");
  }
  if (byteLength > MAX_MILESTONE_BYTES) {
    throw new InputValidationError(
      "INVALID_MILESTONE",
      `Keep the milestone within ${MAX_MILESTONE_BYTES} UTF-8 bytes.`,
    );
  }
  return value;
}

function isPublicHostname(hostname: string): boolean {
  const plainHostname = hostname.replace(/^\[|\]$/g, "");
  if (
    plainHostname === "localhost" ||
    plainHostname.endsWith(".localhost") ||
    plainHostname.endsWith(".local") ||
    plainHostname === "::1" ||
    plainHostname.startsWith("fe80:")
  ) {
    return false;
  }

  const ipv4 = plainHostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet > 255)) return false;
    const [first, second] = octets;
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  return plainHostname.includes(".");
}
