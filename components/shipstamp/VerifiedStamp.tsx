export function VerifiedStamp({ children = "Recorded on Monad" }: { children?: React.ReactNode }) {
  return (
    <div className="inline-block -rotate-2 border-[3px] border-double border-[var(--stamp)] px-4 py-2 font-black uppercase tracking-[0.08em] text-[var(--stamp)]">
      {children}
    </div>
  );
}

