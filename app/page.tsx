export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <p className="technical-label">Build record / Monad Testnet</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl">
        Every build leaves a receipt.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        Verify a GitHub commit, connect it to a live deployment, and permanently stamp the build
        on Monad.
      </p>
      <section className="mt-10 border-y border-[var(--rule)] py-8" aria-labelledby="p1-status">
        <h2 id="p1-status" className="technical-label">
          P1 implementation in progress
        </h2>
        <p className="mt-3 max-w-xl leading-7">
          The real verification and wallet transaction flow is being assembled here. No sample
          blockchain records are shown.
        </p>
      </section>
    </main>
  );
}

