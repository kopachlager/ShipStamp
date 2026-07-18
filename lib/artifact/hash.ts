import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbiParameters,
  stringToBytes,
  type Address,
  type Hex,
} from "viem";

export function getCanonicalArtifactInput(
  repository: string,
  commitSha: string,
  deploymentUrl: string,
): string {
  return `${repository}:${commitSha}:${deploymentUrl}`;
}

export function getArtifactHash(
  repository: string,
  commitSha: string,
  deploymentUrl: string,
): Hex {
  return keccak256(stringToBytes(getCanonicalArtifactInput(repository, commitSha, deploymentUrl)));
}

export function getDuplicateKey(
  builder: Address,
  repository: string,
  commitSha: string,
  deploymentUrl: string,
): Hex {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("address builder, bytes32 repositoryHash, bytes32 commitHash, bytes32 deploymentHash"),
      [
        getAddress(builder),
        keccak256(stringToBytes(repository)),
        keccak256(stringToBytes(commitSha)),
        keccak256(stringToBytes(deploymentUrl)),
      ],
    ),
  );
}

