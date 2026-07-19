import type { Address, Hex } from "viem";

export type BuildStampRecord = {
  id: bigint;
  builder: Address;
  project: string;
  repository: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
  manifestHash: Hex;
  proofSchemaVersion: string;
  timestamp: bigint;
};
