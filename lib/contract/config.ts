import { getAddress, isAddress, type Address } from "viem";

const configuredAddress = process.env.NEXT_PUBLIC_SHIPSTAMP_CONTRACT_ADDRESS;

export const SHIPSTAMP_CONTRACT_ADDRESS: Address | null =
  configuredAddress && isAddress(configuredAddress) ? getAddress(configuredAddress) : null;

const configuredDeploymentBlock = process.env.NEXT_PUBLIC_SHIPSTAMP_DEPLOYMENT_BLOCK;

export const SHIPSTAMP_DEPLOYMENT_BLOCK =
  configuredDeploymentBlock && /^\d+$/.test(configuredDeploymentBlock)
    ? BigInt(configuredDeploymentBlock)
    : null;

