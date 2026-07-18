import type { NormalizedRepository } from "@/lib/artifact/normalization";
import type { VerifiedGitHubCommit } from "@/lib/github/types";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_TIMEOUT_MS = 8_000;

export class GitHubClientError extends Error {
  constructor(
    public readonly code:
      | "REPOSITORY_UNAVAILABLE"
      | "PRIVATE_REPOSITORY"
      | "COMMIT_NOT_FOUND"
      | "GITHUB_RATE_LIMIT"
      | "GITHUB_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "GitHubClientError";
  }
}

type GitHubRepositoryResponse = {
  full_name?: string;
  html_url?: string;
  private?: boolean;
};

type GitHubCommitResponse = {
  sha?: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: { name?: string; date?: string } | null;
    committer?: { date?: string } | null;
  };
  author?: { login?: string } | null;
};

export async function verifyPublicGitHubCommit(
  repository: NormalizedRepository,
  commitSha: string,
): Promise<VerifiedGitHubCommit> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "ShipStamp/0.1",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const repositoryResponse = await requestGitHub(
    `${GITHUB_API_URL}/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}`,
    headers,
  );
  if (repositoryResponse.status === 404) {
    throw new GitHubClientError(
      "REPOSITORY_UNAVAILABLE",
      "The public repository could not be found. Private repositories are not supported.",
    );
  }
  ensureGitHubSuccess(repositoryResponse);

  const repositoryData = (await readJson(repositoryResponse)) as GitHubRepositoryResponse;
  if (repositoryData.private) {
    throw new GitHubClientError("PRIVATE_REPOSITORY", "ShipStamp accepts public GitHub repositories only.");
  }
  if (!repositoryData.full_name || !repositoryData.html_url) {
    throw new GitHubClientError("GITHUB_UNAVAILABLE", "GitHub returned an incomplete repository response.");
  }

  const commitResponse = await requestGitHub(
    `${GITHUB_API_URL}/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/commits/${commitSha}`,
    headers,
  );
  if (commitResponse.status === 404 || commitResponse.status === 422) {
    throw new GitHubClientError("COMMIT_NOT_FOUND", "That commit was not found in the public repository.");
  }
  ensureGitHubSuccess(commitResponse);

  const commitData = (await readJson(commitResponse)) as GitHubCommitResponse;
  const fullSha = commitData.sha?.toLowerCase();
  const authorName = commitData.commit?.author?.name;
  const commitDate = commitData.commit?.author?.date ?? commitData.commit?.committer?.date;
  if (!fullSha || !commitData.html_url || !commitData.commit?.message || !authorName || !commitDate) {
    throw new GitHubClientError("GITHUB_UNAVAILABLE", "GitHub returned incomplete commit metadata.");
  }

  return {
    repositoryFullName: repositoryData.full_name,
    repositoryUrl: repositoryData.html_url,
    commitSha: fullSha,
    shortCommitSha: fullSha.slice(0, 7),
    commitMessage: commitData.commit.message.slice(0, 500),
    commitAuthorName: authorName,
    commitAuthorUsername: commitData.author?.login ?? null,
    commitDate,
    commitUrl: commitData.html_url,
  };
}

async function requestGitHub(url: string, headers: HeadersInit): Promise<Response> {
  try {
    return await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch {
    throw new GitHubClientError("GITHUB_UNAVAILABLE", "GitHub is temporarily unavailable. Try again shortly.");
  }
}

function ensureGitHubSuccess(response: Response): void {
  const rateLimited = response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0";
  if (rateLimited) {
    throw new GitHubClientError(
      "GITHUB_RATE_LIMIT",
      "GitHub's API rate limit was reached. Try again later or configure a server-side GitHub token.",
    );
  }
  if (!response.ok) {
    throw new GitHubClientError("GITHUB_UNAVAILABLE", "GitHub could not validate this build right now.");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GitHubClientError("GITHUB_UNAVAILABLE", "GitHub returned an unreadable response.");
  }
}

