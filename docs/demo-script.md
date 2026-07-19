# ShipStamp demo script — target 2:45

## Before recording

- Use a 1440 × 900 browser window at 100% zoom.
- Hide bookmarks, unrelated tabs, notifications, wallet balances, and personal data.
- Prepare tabs for the homepage, receipt #1, live manifest, GitHub commit, and Monad transaction.
- Keep the cursor deliberate and avoid waiting on network calls during narration.
- Use the existing real receipt; do not create a fake result or unnecessary second transaction.

## Script

### 0:00–0:18 — Personal problem

Show the homepage hero.

> I ship small products and demos regularly, but a live site and the current GitHub repository do not show which exact build I intentionally published at a particular time. ShipStamp gives that build a public receipt.

### 0:18–0:38 — The proof model

Scroll to the four-stage flow.

> GitHub confirms that the public commit exists. The live deployment serves a versioned manifest connecting the repository, commit, deployment origin, and builder wallet. Monad records the matching manifest hash and timestamp.

### 0:38–0:58 — Self-verification timeline

Show the ShipStamp build log and open receipt #1.

> ShipStamp uses its own proof system. This is its first genuine receipt for the release of live deployment manifest verification, read directly from the registry contract.

### 0:58–1:22 — Public receipt and recheck

Show the three completed checks, manifest hash, builder, contract, and current deployment status.

> The receipt exposes the GitHub proof, live manifest proof, wallet, manifest hash, and Monad record. The current deployment can be rechecked at any time. This says the manifest matches now; it does not claim uninterrupted deployment history.

### 1:22–1:48 — Verify a build

Return to the form and show the real ShipStamp project, repository, commit, deployment, and milestone. Select Verify public commit.

> To create a receipt, I provide a full GitHub commit and deployment origin. ShipStamp validates the public commit server-side and never treats GitHub author metadata as wallet identity.

### 1:48–2:10 — Manifest proof

Show the generated JSON, then the live `/.well-known/shipstamp.json` tab. Return and select Verify live deployment.

> The generated manifest is served from the live deployment. ShipStamp fetches that fixed path server-side, validates it safely, matches every field to the connected wallet, and computes a deterministic Solidity-compatible hash.

### 2:10–2:33 — Monad record

Return to receipt #1 and open the transaction in Monadscan.

> The wallet records that hash in ShipStampRegistry on Monad Testnet. There is no database, administrator, upgrade proxy, token, or placeholder blockchain data. Anyone can inspect the transaction and contract state independently.

### 2:33–2:48 — Honest boundary

Return to the receipt or homepage.

> ShipStamp does not prove that every deployed file came from the commit or that the wallet owns the repository. It proves that the commit existed, the live site intentionally served the matching manifest, and the wallet recorded that receipt on Monad.

