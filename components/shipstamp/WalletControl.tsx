"use client";

import { useState, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { monadTestnet } from "@/lib/chain/monad-testnet";

export function WalletControl() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const { address, chainId, isConnected, isConnecting } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    const connector = connectors[0];
    if (!connector) {
      setError(
        "No injected EVM wallet was detected. Install a compatible browser wallet.",
      );
      return;
    }
    try {
      await connectAsync({ connector, chainId: monadTestnet.id });
    } catch (connectionError) {
      setError(
        getWalletError(connectionError, "Wallet connection was not completed."),
      );
    }
  };

  const switchNetwork = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch (switchError) {
      setError(
        getWalletError(switchError, "Network switching was not completed."),
      );
    }
  };

  if (!isHydrated || !isConnected) {
    return (
      <div>
        <Button
          type="button"
          onClick={connect}
          disabled={isHydrated && isConnecting}
          size="lg"
        >
          {isHydrated && isConnecting ? "Connecting wallet…" : "Connect wallet"}
        </Button>
        {error ? (
          <Alert variant="destructive" className="mt-3 max-w-md rounded-[2px]">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-44">
        <p className="technical-label">Connected builder</p>
        <p className="technical-value mt-1 text-xs">
          {shortenAddress(address)}
        </p>
      </div>
      {chainId !== monadTestnet.id ? (
        <Button
          type="button"
          onClick={switchNetwork}
          disabled={isSwitching}
          variant="outline"
        >
          {isSwitching ? "Switching…" : "Switch to Monad Testnet"}
        </Button>
      ) : null}
      <Button
        type="button"
        onClick={() => disconnect()}
        variant="ghost"
        size="sm"
      >
        Disconnect
      </Button>
      {error ? (
        <Alert variant="destructive" className="basis-full rounded-[2px]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function subscribeToHydration() {
  return () => undefined;
}

function getHydratedSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function shortenAddress(address?: string) {
  return address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "Unavailable";
}

function getWalletError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (
      /provider not found|connector not found|no provider/i.test(error.message)
    ) {
      return "No injected EVM wallet was detected. Install a compatible browser wallet.";
    }
    if (/reject|denied|cancel/i.test(error.message)) return fallback;
    return error.message.split("\n")[0];
  }
  return fallback;
}
