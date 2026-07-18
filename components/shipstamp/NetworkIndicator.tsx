"use client";

import { useAccount } from "wagmi";
import { monadTestnet } from "@/lib/chain/monad-testnet";

export function NetworkIndicator() {
  const { chainId, isConnected } = useAccount();
  const correctNetwork = chainId === monadTestnet.id;
  const label = !isConnected
    ? "Wallet disconnected"
    : correctNetwork
      ? "Monad Testnet"
      : "Wrong network";

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.1em]">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          !isConnected ? "bg-[var(--muted)]" : correctNetwork ? "bg-emerald-700" : "bg-[var(--stamp)]"
        }`}
      />
      <span>{label}</span>
    </div>
  );
}

