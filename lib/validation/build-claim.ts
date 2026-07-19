import {
  normalizeCommitSha,
  normalizeDeploymentUrl,
  normalizeMilestone,
  normalizeProjectName,
  parseGitHubRepositoryUrl,
} from "@/lib/artifact/normalization";

export type BuildClaimInput = {
  project: string;
  repositoryUrl: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
};

export type PreparedBuildClaim = {
  project: string;
  repository: string;
  repositoryUrl: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
};

export function prepareBuildClaim(input: BuildClaimInput): PreparedBuildClaim {
  const repository = parseGitHubRepositoryUrl(input.repositoryUrl);
  return {
    project: normalizeProjectName(input.project),
    repository: repository.identifier,
    repositoryUrl: repository.url,
    commitSha: normalizeCommitSha(input.commitSha),
    deploymentUrl: normalizeDeploymentUrl(input.deploymentUrl),
    milestone: normalizeMilestone(input.milestone),
  };
}
