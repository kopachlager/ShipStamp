# P0 architecture

## Boundary

P0 establishes the contract as the authoritative source of build receipts. There is no frontend, GitHub API route, database, authentication system, indexer, or deployed contract yet.

## Onchain data model

Each `BuildStamp` stores a sequential ID, builder wallet, normalized repository, lowercase full commit SHA, normalized deployment URL, milestone, artifact hash, and block timestamp. The builder is always `msg.sender`; there is no delegated stamping, owner, administrator, upgrade proxy, mutation method, payable method, token, or approval.

The canonical repository string is also hashed into a project key. The registry maps this key to a chronological array of stamp IDs. It exposes bounded pagination for project stamps and a separate project count, avoiding reliance on historical log support or an external indexer. `BuildStamped` events remain available for explorers and independent event consumers.

## Canonical normalization

Normalization is performed by the application before contract submission. The contract enforces non-empty and maximum byte lengths, requires a 40-byte commit string, and independently checks the artifact hash. The P1 server and shared TypeScript utility will enforce URL syntax, hostname restrictions, lowercase hexadecimal characters, and the rules below.

### Repository

1. Parse an HTTPS GitHub URL whose hostname is exactly `github.com`.
2. Accept exactly two non-empty path segments: owner and repository.
3. Remove an optional `.git` suffix from the repository segment.
4. URL parsing removes the query and fragment; a trailing slash is accepted.
5. Lowercase the resulting `owner/repository` identifier.

### Commit

Require exactly 40 hexadecimal characters and lowercase them. Short or malformed SHAs are rejected rather than expanded or silently corrected.

### Deployment URL

1. Parse an absolute `https://` URL.
2. Reject credentials and an empty hostname.
3. Lowercase the hostname and remove the default HTTPS port.
4. Remove the fragment.
5. Remove the pathname only when it is exactly `/`; otherwise preserve the path.
6. Preserve query parameters and their submitted ordering. P1 will document that these are intentionally part of the artifact identity.

## Artifact hash

The canonical artifact input is UTF-8 text:

```text
normalizedRepository + ":" + lowercaseCommitSha + ":" + normalizedDeploymentUrl
```

The artifact hash is:

```text
keccak256(utf8Bytes(canonicalArtifactInput))
```

The frontend will display both values before transaction confirmation. The contract recomputes this hash from its three string arguments and rejects a mismatched value. ShipStamp does not download or hash deployed application files.

## Exact duplicates

The duplicate key is:

```text
keccak256(abi.encode(builderWallet, keccak256(repository), keccak256(commitSha), keccak256(deploymentUrl)))
```

Milestone text and artifact hash are intentionally excluded. The same builder cannot stamp the same canonical repository, commit, and deployment twice merely by changing the description. A changed commit, deployment URL, or builder wallet creates a different key and is accepted.

## Contract input limits

- repository: 1–200 bytes
- commit SHA: exactly 40 bytes
- deployment URL: 1–2,048 bytes
- milestone: 1–280 bytes
- project page size: at most 100 stamps per call

Solidity does not attempt complete URL normalization. Format validation belongs to the P1 server and shared client utility; the contract enforces essential bounds, immutability, builder identity, duplicate prevention, and hash integrity.

## Security notes

- All strings are untrusted display data and must be rendered as text by clients.
- Canonicalization must remain centralized in P1; a mismatch will revert onchain.
- `block.timestamp` is the chain timestamp, not an exact wall-clock oracle.
- Public RPC rate limits and temporary unavailability must be handled by clients.
- Contract storage is permanent and public; users should never submit secrets or personal data.

