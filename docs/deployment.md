# Monad Testnet deployment

ShipStamp targets Monad Testnet only. The values below were checked against official Monad documentation on 2026-07-18.

| Setting | Value |
| --- | --- |
| Network | Monad Testnet |
| Chain ID | `10143` |
| Native token | `MON` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadscan.com` |
| Alternative explorer | `https://testnet.monadvision.com` |
| Faucet | `https://faucet.monad.xyz` |

Official sources:

- [Monad Testnet network information](https://docs.monad.xyz/developer-essentials/testnets)
- [Deploy with Monad Foundry](https://docs.monad.xyz/guides/deploy-smart-contract/foundry)
- [Verify with Monad Foundry](https://docs.monad.xyz/guides/verify-smart-contract/foundry)

## Install Monad Foundry

Use the Monad-maintained Foundry distribution:

```bash
curl -L https://foundry.category.xyz | bash
foundryup --network monad
```

The repository currently compiles with Monad Foundry `v1.7.1-monad-v1.0.0`, Solidity `0.8.28`, the Prague EVM target, optimizer enabled, and 200 optimizer runs.

## Environment

Copy `.env.example` to an untracked local `.env` and load only the values needed by the current command. Contract tooling uses:

```text
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_EXPLORER_API_KEY=
```

`MONAD_EXPLORER_API_KEY` is needed only for Etherscan-compatible verification. Sourcify verification on MonadVision does not require it. `DEPLOYER_PRIVATE_KEY` is documented for CI compatibility but is not the recommended local workflow.

Never commit `.env`, a private key, a wallet seed, a keystore, or an API token.

## Build and test

```bash
cd contracts
forge fmt --check
forge build
forge test
```

## Prepare a deployer

Monad recommends a Foundry keystore instead of passing a private key in terminal history or an environment variable:

```bash
cast wallet import monad-deployer --interactive
cast wallet address --account monad-deployer
```

Fund that address with test MON from the [official faucet](https://faucet.monad.xyz). Confirm the balance before broadcasting:

```bash
cast balance <DEPLOYER_ADDRESS> --rpc-url monad_testnet
```

## Simulate and deploy

From `contracts/`, load `MONAD_TESTNET_RPC_URL`, then simulate without `--broadcast`:

```bash
forge script script/DeployShipStamp.s.sol:DeployShipStamp \
  --rpc-url monad_testnet \
  --account monad-deployer
```

Broadcast only after the simulation succeeds and the deployer is funded:

```bash
forge script script/DeployShipStamp.s.sol:DeployShipStamp \
  --rpc-url monad_testnet \
  --account monad-deployer \
  --broadcast
```

Record the resulting contract address, deployment block, and transaction. Set
`NEXT_PUBLIC_SHIPSTAMP_CONTRACT_ADDRESS` and
`NEXT_PUBLIC_SHIPSTAMP_DEPLOYMENT_BLOCK` to those real values; the application
must not ship with a placeholder address.

## Verify source

MonadVision/Sourcify verification requires no API key:

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/ShipStampRegistry.sol:ShipStampRegistry \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org/
```

For Etherscan-compatible Monadscan verification:

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/ShipStampRegistry.sol:ShipStampRegistry \
  --chain 10143 \
  --verifier etherscan \
  --etherscan-api-key "$MONAD_EXPLORER_API_KEY" \
  --watch
```

After verification, independently compare the deployed bytecode and source settings on the explorer.

## Deployment checklist

- Contract tests and clean compilation pass on the exact commit being deployed.
- Deployer is a dedicated hackathon wallet with only required test MON.
- Chain ID returned by the RPC is `10143`.
- Simulation uses the intended deployer and has no unexpected calls.
- Broadcast output is saved locally but not committed if it contains sensitive paths.
- Contract address and transaction are checked on the explorer.
- Source verification succeeds before the address is added to the application.
- No self-stamp is created until its described milestone genuinely exists.

## Application and self-verification order

1. Add the verified registry address and deployment block to the hosting environment.
2. Deploy the application to a stable public HTTPS origin.
3. Choose a completed ShipStamp commit and generate a manifest naming that commit, origin, and the wallet that will submit the receipt.
4. Add the manifest at `public/.well-known/shipstamp.json`, commit it, and redeploy.
5. Confirm the public URL serves the exact JSON with an application/json-compatible content type.
6. Verify the GitHub commit and live manifest through ShipStamp.
7. Submit the receipt from the same wallet and wait for confirmation.
8. Check the receipt, project timeline, current-manifest recheck, and explorer links.

The manifest may intentionally reference the preceding feature-complete commit;
the following manifest-only commit publishes proof for that genuine completed
milestone without creating a circular commit-SHA dependency.
