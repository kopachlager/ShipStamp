import Link from "next/link";

import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface Footer10Props {
  links: NavLink[];
  className?: string;
}

// Adapted from Beste UI's free Footer10 split footer.
export function Footer10({ links, className }: Footer10Props) {
  return (
    <footer className={cn("bg-[#0b0a09]", className)}>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link
            href="/"
            className="font-mono text-sm tracking-[-0.03em]"
            aria-label="ShipStamp home"
          >
            <span className="text-primary">[</span>SHIPSTAMP
            <span className="text-primary">]</span>
          </Link>
          <p className="mt-3 max-w-md text-xs leading-5 text-muted-foreground">
            Public, wallet-signed build claims on Monad Testnet. A receipt
            records a claim; it does not prove authorship or deployment
            integrity.
          </p>
          <p className="mt-5 font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">
            Interface references from{" "}
            <a
              href="https://ui.beste.co/blocks"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
            >
              Beste UI
            </a>
            . Built with shadcn/ui.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[0.64rem] tracking-[0.08em] uppercase"
        >
          {links.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <Link
                key={link.href}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
                {external ? " ↗" : ""}
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
