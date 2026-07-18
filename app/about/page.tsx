import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
      <p className="technical-label">About the record</p>
      <h1 className="mt-4 text-5xl font-black tracking-[-0.055em]">A narrow, public build claim.</h1>
      <div className="mt-10 grid gap-10 border-t border-[var(--rule)] pt-8 sm:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">What ShipStamp proves</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            A wallet recorded a specific repository, commit, deployment URL, and milestone at a
            Monad block timestamp.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">What it does not prove</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Code authorship, repository ownership, deployment security, or that the live site
            currently serves the submitted commit.
          </p>
        </section>
      </div>
    </main>
  );
}

