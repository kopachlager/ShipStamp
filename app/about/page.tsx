import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
      <p className="technical-label">About the record</p>
      <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.055em] sm:text-6xl">
        A narrow, public build claim.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        ShipStamp addresses a practical indie-builder problem: a polished application and a current
        repository do not show when a specific build was publicly claimed or how it progressed.
      </p>

      <div className="mt-12 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
        <AboutSection title="The solution">
          A builder verifies a public GitHub commit, reviews a deterministic artifact identity, and
          signs one Monad transaction. Public receipt and timeline pages read the immutable claim.
        </AboutSection>
        <AboutSection title="Why onchain">
          The record should remain independently inspectable without trusting ShipStamp&apos;s server,
          database, or continued operation. The wallet signature and chain timestamp are the useful part.
        </AboutSection>
        <AboutSection title="What ShipStamp proves">
          A wallet recorded a repository, commit SHA, deployment URL, milestone, and artifact hash at
          a Monad block timestamp. The referenced public commit existed when GitHub verification ran.
        </AboutSection>
        <AboutSection title="What it does not prove">
          Code authorship, repository ownership, deployment security, current deployment contents,
          project trustworthiness, repository immutability, or legal ownership.
        </AboutSection>
      </div>

      <section className="mt-12 border-t border-[var(--ink)] pt-8">
        <p className="technical-label">Architecture</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">No application database.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          Next.js validates public commits server-side through GitHub&apos;s REST API. An injected EVM
          wallet submits the canonical build claim to ShipStampRegistry on Monad Testnet. Receipt and
          project pages use direct contract reads; GitHub supplies display metadata only when available.
        </p>
      </section>
    </main>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--paper-raised)] p-6 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-[var(--muted)]">{children}</p>
    </section>
  );
}

