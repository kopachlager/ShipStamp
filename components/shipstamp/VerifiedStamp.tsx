export function VerifiedStamp({ children = "Recorded on Monad" }: { children?: React.ReactNode }) {
  return (
    <div className="inline-grid min-w-36 border border-primary bg-primary/5 p-1 text-primary">
      <div className="border border-primary/50 px-3 py-2 text-center">
        <span className="block font-mono text-[0.55rem] tracking-[0.18em] uppercase">Monad / confirmed</span>
        <span className="mt-1 block font-heading text-xl leading-none">{children}</span>
      </div>
    </div>
  );
}
