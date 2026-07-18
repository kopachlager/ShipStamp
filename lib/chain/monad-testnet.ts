import { defineChain } from "viem";

export const MONAD_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const monadTestnet = defineChain({
  id: 10_143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [MONAD_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Monadscan",
      url: "https://testnet.monadscan.com",
      apiUrl: "https://api-testnet.monadscan.com/api",
    },
    monadVision: {
      name: "MonadVision",
      url: "https://testnet.monadvision.com",
    },
  },
  testnet: true,
});

export const MONAD_EXPLORER_URL = monadTestnet.blockExplorers.default.url;

export function getExplorerTransactionUrl(transactionHash: string) {
  return `${MONAD_EXPLORER_URL}/tx/${transactionHash}`;
}

export function getExplorerAddressUrl(address: string) {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}

