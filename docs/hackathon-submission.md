# Spark submission package

## Form fields

### Cover image

Upload `public/submission/shipstamp-cover.png` (PNG, 1672 × 941, approximately 2 MB).

### Title

```text
ShipStamp
```

### Description

```text
ShipStamp creates wallet-signed software build receipts on Monad. A builder verifies a real public GitHub commit, publishes a versioned manifest at the live deployment, and confirms that the manifest names the same repository, commit, deployment origin, project, and connected wallet. ShipStamp canonicalizes those values and records the manifest hash, milestone, builder, proof version, and chain timestamp in ShipStampRegistry on Monad Testnet.

Public receipts and chronological project timelines read from the contract without an account or application database. Anyone can inspect the transaction and contract record, then recheck whether the currently served manifest still matches the onchain hash.

I built ShipStamp because, as an indie builder, a current repository or polished deployment does not show which specific build was intentionally shipped when. The project taught me to keep onchain proof narrow and honest: ShipStamp does not prove every deployed file came from the commit or that a wallet owns the repository. It proves the public commit existed, the live deployment served a matching manifest, and the named wallet recorded that manifest hash on Monad. ShipStamp used itself: receipt #1 records the release of live deployment manifest verification.
```

### Project URL

```text
https://ship-stamp.vercel.app
```

### GitHub repository

```text
https://github.com/kopachlager/ShipStamp
```

### Category

```text
testnet
```

### Contract address

```text
0x51C73D47f44527922ddca87767d27774091618b5
```

### Demo video

Add the final public video URL after recording. The video must be shorter than three minutes.

### Social media post URL

Optional for the base submission, but required to compete for Most Viral Solution. Add the public post URL after publishing the draft below.

### What problem are you trying to solve?

```text
As an indie builder, I regularly ship applications and demos, but a live website and the current state of a GitHub repository do not show which exact commit was intentionally connected to a deployment at a particular time. They also do not provide a durable, wallet-signed development history that another person can inspect independently.
```

### How is your project the solution to your problem?

```text
ShipStamp verifies that a full commit exists in a public GitHub repository, generates a minimal manifest connecting that commit to the deployment origin and builder wallet, and requires the live site to serve the matching manifest. It then records the canonical manifest hash and milestone through the same wallet on Monad. Public receipt and timeline pages read directly from the contract, link to GitHub and the explorer, and let anyone recheck the current live manifest. The first real receipt is ShipStamp verifying its own deployment.
```

## Social post draft

```text
Every build leaves a receipt.

I built ShipStamp for the Spark BuildAnything hackathon on Monad.

GitHub confirms the commit exists. A manifest on the live deployment connects that commit and deployment to a wallet. Monad records the permanent public receipt.

ShipStamp used itself for its first verified build:
https://ship-stamp.vercel.app/stamp/1

Try it: https://ship-stamp.vercel.app
Source: https://github.com/kopachlager/ShipStamp

#BuildAnything #Monad
```

## Evidence links

- Receipt #1: https://ship-stamp.vercel.app/stamp/1
- Project timeline: https://ship-stamp.vercel.app/project/kopachlager/shipstamp
- Live manifest: https://ship-stamp.vercel.app/.well-known/shipstamp.json
- Receipt transaction: https://testnet.monadscan.com/tx/0x05b6f2f6a0aa927255baf6b23d37b705647e9ffc92dfc1efd539938141701f01
- Registry: https://testnet.monadscan.com/address/0x51C73D47f44527922ddca87767d27774091618b5
- Verified commit: https://github.com/kopachlager/ShipStamp/commit/c0425fb09144001fdb57e7b13e977d5b85d1e1ae

