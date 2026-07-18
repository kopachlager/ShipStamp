import type { Metadata } from "next";
import Link from "next/link";
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
    <html lang="en">
      <body>
        <header className="border-b border-[var(--rule)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <Link
              href="/"
              className="font-black tracking-[-0.05em] no-underline"
              aria-label="ShipStamp home"
            >
              SHIP<span className="text-[var(--stamp)]">STAMP</span>
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-5 text-sm font-semibold">
              <Link href="/about" className="underline-offset-4 hover:underline">
                About
              </Link>
              <a
                href="https://github.com/kopachlager/ShipStamp"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

