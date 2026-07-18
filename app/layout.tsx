import type { Metadata } from "next";
import Link from "next/link";
import { Web3Provider } from "@/components/shipstamp/Web3Provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Footer10 } from "@/components/beste/block/footer10";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShipStamp — Every build leaves a receipt",
    template: "%s — ShipStamp",
  },
  description:
    "Verify a GitHub commit, connect it to a live deployment, and permanently stamp the build on Monad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Web3Provider>
          <TooltipProvider>
            <header className="bg-background/95 backdrop-blur-sm">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
                <div className="flex items-center">
                  <Link
                    href="/"
                    className="font-mono text-sm font-medium tracking-[-0.03em] no-underline"
                    aria-label="ShipStamp home"
                  >
                    <span className="text-primary">[</span>SHIPSTAMP
                    <span className="text-primary">]</span>
                  </Link>
                </div>
                <nav
                  aria-label="Primary"
                  className="flex items-center gap-5 font-mono text-[0.7rem] uppercase tracking-[0.08em]"
                >
                  <Link
                    href="/about"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
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
            </header>
            {children}
            <Footer10
              links={[
                { label: "About", href: "/about" },
                { label: "Contract", href: "https://testnet.monadscan.com" },
                {
                  label: "GitHub",
                  href: "https://github.com/kopachlager/ShipStamp",
                },
              ]}
            />
            <Toaster theme="dark" position="bottom-right" />
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
