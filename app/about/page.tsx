import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="flex items-center gap-3">
        <p className="technical-label text-primary">Specification / about</p>
        <Badge variant="outline" className="rounded-[2px] font-mono text-[0.58rem] tracking-[0.1em] uppercase">Rev. 01</Badge>
      </div>
      <h1 className="display-title mt-7 max-w-4xl text-6xl leading-[0.95] sm:text-8xl">
        A narrow, public build claim.
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
        ShipStamp addresses a practical indie-builder problem: a polished application and a current
        repository do not show when a specific build was publicly claimed or how it progressed.
      </p>

      <div className="mt-14 border-t border-border">
        <AboutSection number="01" title="The solution">
          A builder verifies a public GitHub commit, reviews a deterministic artifact identity, and
          signs one Monad transaction. Public receipt and timeline pages read the immutable claim.
        </AboutSection>
        <AboutSection number="02" title="Why onchain">
          The record should remain independently inspectable without trusting ShipStamp&apos;s server,
          database, or continued operation. The wallet signature and chain timestamp are the useful part.
        </AboutSection>
        <AboutSection number="03" title="What ShipStamp proves">
          A wallet recorded a repository, commit SHA, deployment URL, milestone, and artifact hash at
          a Monad block timestamp. The referenced public commit existed when GitHub verification ran.
        </AboutSection>
        <AboutSection number="04" title="What it does not prove">
          Code authorship, repository ownership, deployment security, current deployment contents,
          project trustworthiness, repository immutability, or legal ownership.
        </AboutSection>
      </div>

      <section className="mt-16 grid gap-8 lg:grid-cols-[0.4fr_1fr]">
        <div>
          <p className="technical-label text-primary">System boundary</p>
          <h2 className="display-title mt-3 text-5xl">No application database.</h2>
        </div>
        <div>
          <Separator />
          <p className="mt-6 max-w-3xl leading-7 text-muted-foreground">
          Next.js validates public commits server-side through GitHub&apos;s REST API. An injected EVM
          wallet submits the canonical build claim to ShipStampRegistry on Monad Testnet. Receipt and
          project pages use direct contract reads; GitHub supplies display metadata only when available.
          </p>
          <div className="mt-8 border border-border bg-card p-5 font-mono text-[0.68rem] leading-6 text-muted-foreground">
            <p><span className="text-primary">USER</span> → NEXT.JS → GITHUB REST</p>
            <p><span className="text-primary">WALLET</span> → SHIPSTAMP REGISTRY → MONAD</p>
            <p><span className="text-primary">PUBLIC READS</span> → CONTRACT STATE + EVENTS</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function AboutSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border py-7 sm:grid-cols-[4rem_13rem_1fr] sm:items-start">
      <p className="font-heading text-3xl text-primary">{number}</p>
      <h2 className="font-mono text-xs font-medium tracking-[0.08em] uppercase">{title}</h2>
      <p className="max-w-2xl leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}
