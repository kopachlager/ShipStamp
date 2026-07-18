"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chain/monad-testnet";

export function WalletControl() {
  const { address, chainId, isConnected, isConnecting } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    const connector = connectors[0];
    if (!connector) {
      setError("No injected EVM wallet was detected. Install a compatible browser wallet.");
      return;
    }
    try {
      await connectAsync({ connector, chainId: monadTestnet.id });
    } catch (connectionError) {
      setError(getWalletError(connectionError, "Wallet connection was not completed."));
    }
  };

  const switchNetwork = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch (switchError) {
      setError(getWalletError(switchError, "Network switching was not completed."));
    }
  };

  if (!isConnected) {
    return (
      <div>
        <button
          type="button"
          onClick={connect}
          disabled={isConnecting}
          className="border border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-sm font-bold text-[var(--paper-raised)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting ? "Connecting wallet…" : "Connect wallet"}
        </button>
        {error ? <p className="mt-2 max-w-sm text-sm text-[var(--stamp-dark)]" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <div>
        <p className="technical-label">Connected builder</p>
        <p className="technical-value mt-1 text-xs">{shortenAddress(address)}</p>
      </div>
      {chainId !== monadTestnet.id ? (
        <button
          type="button"
          onClick={switchNetwork}
          disabled={isSwitching}
          className="border border-[var(--stamp)] px-4 py-2 text-sm font-bold text-[var(--stamp-dark)]"
        >
          {isSwitching ? "Switching…" : "Switch to Monad Testnet"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => disconnect()}
        className="border-b border-[var(--ink)] text-sm font-semibold"
      >
        Disconnect
      </button>
      {error ? <p className="basis-full text-sm text-[var(--stamp-dark)]" role="alert">{error}</p> : null}
    </div>
  );
}

function shortenAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Unavailable";
}

function getWalletError(error: unknown, fallback: string) {
  if (error instanceof Error && /reject|denied|cancel/i.test(error.message)) {
    return fallback;
  }
  return error instanceof Error ? error.message.split("\n")[0] : fallback;
}

