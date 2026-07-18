# ShipStamp

ShipStamp creates wallet-signed, timestamped build receipts that connect a verified public GitHub commit to a claimed live deployment on Monad.

> Every build leaves a receipt.

## The personal problem

Indie builders ship applications, demos, client work, and hackathon projects continuously. A polished interface or the current state of a repository does not show when a particular build was publicly claimed, which commit the builder connected to a deployment, or how the project progressed over time.

ShipStamp creates a durable public record for that narrow claim. It does not prove code authorship, repository ownership, deployment security, that the deployment serves the submitted commit, or project trustworthiness.

## P0 scope

This checkpoint contains the onchain registry, its tests, and Monad Testnet deployment configuration. The Next.js application and GitHub validation flow intentionally begin in P1 only after approval.

## Contract model

`ShipStampRegistry` records one immutable build stamp per transaction. Each stamp contains:

- sequential stamp ID
- builder wallet (`msg.sender`)
- normalized `owner/repository` identifier
- lowercase full commit SHA
- normalized HTTPS deployment URL
- milestone description
- canonical artifact hash
- block timestamp

The registry stores project-to-stamp ID arrays in creation order. Public clients can page through those IDs and stamps directly through contract calls, without a database or third-party indexer.

See [docs/architecture.md](docs/architecture.md) for normalization, hashing, duplicate rules, limits, and the P0 architecture.

## Contract commands

ShipStamp uses [Monad Foundry](https://docs.monad.xyz/guides/deploy-smart-contract/foundry).

```bash
cd contracts
forge build
forge test
```

Deployment and verification commands are documented in [docs/deployment.md](docs/deployment.md).

## Hackathon context

ShipStamp is a new solo project for the BuildAnything Spark hackathon on Monad. This repository and its implementation are being created during the hackathon with a meaningful commit history. No code, branding, infrastructure, or project structure has been reused from the author's existing products.

## License

MIT

