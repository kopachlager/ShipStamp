# ShipStamp proof architecture

The current architecture replaces ShipStamp's original timestamped deployment claim with a verified live-manifest proof. The complete product and operational documentation lives in the [README](../README.md); this document records the implementation boundary that must remain stable across the contract and application.

## Proof boundary

GitHub proves that the specified public commit existed when its API was queried. The live deployment proves that it currently serves a ShipStamp manifest intentionally naming the repository, commit, deployment origin, project, and wallet. Monad records the canonical manifest hash, wallet sender, milestone, and chain timestamp.

The contract cannot fetch offchain data and does not pretend to. It independently recomputes the hash from the receipt fields and `msg.sender`, preventing a caller from substituting another builder address.

## Canonical version 1 fields

The fixed ABI-encoding order is `schemaVersion`, `project`, `repository`, `commit`, `deploymentUrl`, `wallet`. The hash is `keccak256(abi.encode(...))`. The TypeScript and Solidity suites share the fixed vector documented in the README.

Deployment URLs are HTTPS origins only. The manifest path is always `/.well-known/shipstamp.json`. Unknown JSON fields are rejected so schema extensions require an explicit new version.

## Retrieval and duplicates

The repository identifier is hashed to a project key that indexes a chronological array of stamp IDs. Clients page through contract calls, while events provide transaction hashes when the configured RPC supports the requested block range.

The exact duplicate key includes builder, repository, commit, deployment origin, and manifest hash. Milestone is deliberately excluded. The registry has no administrator, mutation function, proxy, payable entry point, token, or approval mechanism.

## Offchain safety boundary

The deployment verifier resolves and inspects DNS results, rejects local/private destinations, validates every redirect, limits redirects, time, request size, and response size, and fetches without user credentials. Public receipt pages use the same verifier for current-state rechecks. See the README for known residual limitations.
