import type { Address, Hex } from "viem";

export type BuildStampRecord = {
  id: bigint;
  builder: Address;
  repository: string;
  commitSha: string;
  deploymentUrl: string;
  milestone: string;
  artifactHash: Hex;
  timestamp: bigint;
};

