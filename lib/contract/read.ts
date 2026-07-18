import { createPublicClient, http, type Hex } from "viem";
import { MONAD_TESTNET_RPC_URL, monadTestnet } from "@/lib/chain/monad-testnet";
import { shipStampRegistryAbi } from "@/lib/contract/abi";
import {
  SHIPSTAMP_CONTRACT_ADDRESS,
  SHIPSTAMP_DEPLOYMENT_BLOCK,
} from "@/lib/contract/config";
import type { BuildStampRecord } from "@/lib/contract/types";

const PAGE_SIZE = 100n;
const MAX_TIMELINE_STAMPS = 1_000n;

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_TESTNET_RPC_URL, { timeout: 10_000, retryCount: 2 }),
});

export class ContractNotConfiguredError extends Error {
  constructor() {
    super("ShipStampRegistry has not been configured for this application.");
    this.name = "ContractNotConfiguredError";
  }
}

export class ContractReadUnavailableError extends Error {
  constructor() {
    super("Monad contract data is temporarily unavailable.");
    this.name = "ContractReadUnavailableError";
  }
}

export async function readStamp(stampId: bigint): Promise<BuildStampRecord | null> {
  const address = requireContractAddress();
  try {
    const total = await publicClient.readContract({
      address,
      abi: shipStampRegistryAbi,
      functionName: "totalStamps",
    });
    if (stampId <= 0n || stampId > total) return null;

    return await publicClient.readContract({
      address,
      abi: shipStampRegistryAbi,
      functionName: "getStamp",
      args: [stampId],
    });
  } catch (error) {
    if (error instanceof ContractNotConfiguredError) throw error;
    throw new ContractReadUnavailableError();
  }
}

export async function readProjectStamps(repository: string): Promise<BuildStampRecord[]> {
  const address = requireContractAddress();
  try {
    const count = await publicClient.readContract({
      address,
      abi: shipStampRegistryAbi,
      functionName: "getProjectStampCount",
      args: [repository],
    });
    if (count === 0n) return [];
    if (count > MAX_TIMELINE_STAMPS) {
      throw new Error("Project timeline exceeds the current safe read limit.");
    }

    const stamps: BuildStampRecord[] = [];
    for (let offset = 0n; offset < count; offset += PAGE_SIZE) {
      const page = await publicClient.readContract({
        address,
        abi: shipStampRegistryAbi,
        functionName: "getProjectStamps",
        args: [repository, offset, PAGE_SIZE],
      });
      stamps.push(...page);
    }
    return stamps;
  } catch (error) {
    if (error instanceof ContractNotConfiguredError) throw error;
    throw new ContractReadUnavailableError();
  }
}

export async function readStampTransactionHashes(stampIds: bigint[]): Promise<Map<bigint, Hex>> {
  const address = requireContractAddress();
  if (stampIds.length === 0 || SHIPSTAMP_DEPLOYMENT_BLOCK === null) return new Map();

  try {
    const logs = await publicClient.getContractEvents({
      address,
      abi: shipStampRegistryAbi,
      eventName: "BuildStamped",
      fromBlock: SHIPSTAMP_DEPLOYMENT_BLOCK,
      toBlock: "latest",
      strict: true,
    });
    const requestedIds = new Set(stampIds);
    const result = new Map<bigint, Hex>();
    for (const log of logs) {
      if (log.args.stampId !== undefined && requestedIds.has(log.args.stampId)) {
        result.set(log.args.stampId, log.transactionHash);
      }
    }
    return result;
  } catch {
    return new Map();
  }
}

function requireContractAddress() {
  if (!SHIPSTAMP_CONTRACT_ADDRESS) throw new ContractNotConfiguredError();
  return SHIPSTAMP_CONTRACT_ADDRESS;
}

