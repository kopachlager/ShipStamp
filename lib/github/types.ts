export type VerifiedGitHubCommit = {
  repositoryFullName: string;
  repositoryUrl: string;
  commitSha: string;
  shortCommitSha: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorUsername: string | null;
  commitDate: string;
  commitUrl: string;
};

export type GitHubVerificationErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_GITHUB_URL"
  | "UNSUPPORTED_GIT_PROVIDER"
  | "INVALID_COMMIT_SHA"
  | "REPOSITORY_UNAVAILABLE"
  | "PRIVATE_REPOSITORY"
  | "COMMIT_NOT_FOUND"
  | "GITHUB_RATE_LIMIT"
  | "GITHUB_UNAVAILABLE"
  | "REQUEST_RATE_LIMIT";

export type GitHubVerificationError = {
  error: {
    code: GitHubVerificationErrorCode;
    message: string;
  };
};

