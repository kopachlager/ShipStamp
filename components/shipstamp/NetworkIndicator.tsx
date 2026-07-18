"use client";

import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { monadTestnet } from "@/lib/chain/monad-testnet";

export function NetworkIndicator() {
  const { chainId, isConnected } = useAccount();
  const correctNetwork = chainId === monadTestnet.id;
  const label =
    isConnected && !correctNetwork ? "Wrong network" : "Monad Testnet";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="h-7 gap-2 rounded-full border-border/70 bg-background/70 px-2.5 font-mono text-[0.62rem] tracking-[0.1em] uppercase"
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              !isConnected
                ? "bg-muted-foreground"
                : correctNetwork
                  ? "bg-[var(--success)]"
                  : "bg-primary"
            }`}
          />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {!isConnected
          ? "Connect a wallet to continue"
          : correctNetwork
            ? "Connected to chain 10143"
            : "Switch to Monad Testnet"}
      </TooltipContent>
    </Tooltip>
  );
}
