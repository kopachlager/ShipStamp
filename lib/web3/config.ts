import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet, MONAD_TESTNET_RPC_URL } from "@/lib/chain/monad-testnet";

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [monadTestnet.id]: http(MONAD_TESTNET_RPC_URL),
  },
  ssr: true,
});

