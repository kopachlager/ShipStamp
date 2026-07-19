import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";

export type CanonicalManifest = {
  schemaVersion: string;
  project: string;
  repository: string;
  commit: string;
  deploymentUrl: string;
  wallet: Address;
};

export function getCanonicalManifestLines(manifest: CanonicalManifest): string {
  return [
    `schemaVersion=${manifest.schemaVersion}`,
    `project=${manifest.project}`,
    `repository=${manifest.repository}`,
    `commit=${manifest.commit}`,
    `deploymentUrl=${manifest.deploymentUrl}`,
    `wallet=${manifest.wallet.toLowerCase()}`,
  ].join("\n");
}

export function getManifestHash(manifest: CanonicalManifest): Hex {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "string schemaVersion, string project, string repository, string commitSha, string deploymentUrl, address builder",
      ),
      [
        manifest.schemaVersion,
        manifest.project,
        manifest.repository,
        manifest.commit,
        manifest.deploymentUrl,
        getAddress(manifest.wallet),
      ],
    ),
  );
}

export function getDuplicateKey(
  builder: Address,
  repository: string,
  commitSha: string,
  deploymentUrl: string,
  manifestHash: Hex,
): Hex {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "address builder, bytes32 repositoryHash, bytes32 commitHash, bytes32 deploymentHash, bytes32 manifestHash",
      ),
      [
        getAddress(builder),
        keccak256(new TextEncoder().encode(repository)),
        keccak256(new TextEncoder().encode(commitSha)),
        keccak256(new TextEncoder().encode(deploymentUrl)),
        manifestHash,
      ],
    ),
  );
}
