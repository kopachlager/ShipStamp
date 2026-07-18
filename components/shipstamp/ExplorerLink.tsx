import { getExplorerTransactionUrl } from "@/lib/chain/monad-testnet";

export function ExplorerLink({ transactionHash }: { transactionHash: string }) {
  return (
    <a
      href={getExplorerTransactionUrl(transactionHash)}
      target="_blank"
      rel="noreferrer"
      className="font-semibold underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
    >
      View transaction ↗
    </a>
  );
}

