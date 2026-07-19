export function VerifiedStamp({
  children = "Recorded on Monad",
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="receipt-impression inline-grid min-w-40 rotate-[-1deg] px-3 py-3 text-primary">
      <div className="text-center">
        <span className="block font-mono text-[0.55rem] tracking-[0.18em] uppercase">
          Monad / confirmed
        </span>
        <span className="mt-1 block font-heading text-xl leading-none">
          {children}
        </span>
      </div>
    </div>
  );
}
