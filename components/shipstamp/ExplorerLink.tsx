import { getExplorerTransactionUrl } from "@/lib/chain/monad-testnet";
import { Button } from "@/components/ui/button";

export function ExplorerLink({ transactionHash }: { transactionHash: string }) {
  return (
    <Button asChild variant="link">
      <a
        href={getExplorerTransactionUrl(transactionHash)}
        target="_blank"
        rel="noreferrer"
      >
        View transaction ↗
      </a>
    </Button>
  );
}
