import type { Metadata } from "next";
import Link from "next/link";
import { Web3Provider } from "@/components/shipstamp/Web3Provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/instrument-serif";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShipStamp — Every build leaves a receipt",
    template: "%s — ShipStamp",
  },
  description:
    "Verify a GitHub commit, connect it to a live deployment, and permanently stamp the build on Monad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Web3Provider>
          <TooltipProvider>
            <header className="border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
                <div className="flex items-center gap-5">
                  <Link
                    href="/"
                    className="font-mono text-sm font-medium tracking-[-0.03em] no-underline"
                    aria-label="ShipStamp home"
                  >
                    <span className="text-primary">[</span>SHIPSTAMP<span className="text-primary">]</span>
                  </Link>
                  <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
                  <span className="technical-label hidden sm:block">Registry interface · Testnet</span>
                </div>
                <nav aria-label="Primary" className="flex items-center gap-5 font-mono text-[0.7rem] uppercase tracking-[0.08em]">
                  <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                    About
                  </Link>
                  <a
                    href="https://github.com/kopachlager/ShipStamp"
                    target="_blank"
                    rel="noreferrer"
                    className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
                  >
                    Source ↗
                  </a>
                </nav>
              </div>
              <div className="noise-band h-px opacity-80" aria-hidden="true" />
            </header>
            {children}
            <Toaster theme="dark" position="bottom-right" />
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
