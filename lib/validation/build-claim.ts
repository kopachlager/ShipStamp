import {
  normalizeCommitSha,
  normalizeDeploymentUrl,
  normalizeMilestone,
  parseGitHubRepositoryUrl,
} from "@/lib/artifact/normalization";
import { getArtifactHash, getCanonicalArtifactInput } from "@/lib/artifact/hash";

export type BuildClaimInput = {
  repositoryUrl: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
};

export type PreparedBuildClaim = {
  repository: string;
  repositoryUrl: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
  canonicalArtifactInput: string;
  artifactHash: `0x${string}`;
};

export function prepareBuildClaim(input: BuildClaimInput): PreparedBuildClaim {
  const repository = parseGitHubRepositoryUrl(input.repositoryUrl);
  const commitSha = normalizeCommitSha(input.commitSha);
  const deploymentUrl = normalizeDeploymentUrl(input.deploymentUrl);
  const milestone = normalizeMilestone(input.milestone);
  const canonicalArtifactInput = getCanonicalArtifactInput(
    repository.identifier,
    commitSha,
    deploymentUrl,
  );

  return {
    repository: repository.identifier,
    repositoryUrl: repository.url,
    commitSha,
    deploymentUrl,
    milestone,
    canonicalArtifactInput,
    artifactHash: getArtifactHash(repository.identifier, commitSha, deploymentUrl),
  };
}

