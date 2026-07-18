import { parseGitHubRepositoryUrl } from "@/lib/artifact/normalization";
import type { BuildStampRecord } from "@/lib/contract/types";
import { verifyPublicGitHubCommit } from "@/lib/github/client";
import type { VerifiedGitHubCommit } from "@/lib/github/types";

export async function readGitHubMetadataForStamp(
  stamp: BuildStampRecord,
): Promise<VerifiedGitHubCommit | null> {
  try {
    const repository = parseGitHubRepositoryUrl(`https://github.com/${stamp.repository}`);
    return await verifyPublicGitHubCommit(repository, stamp.commitSha);
  } catch {
    return null;
  }
}

