import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16"
      aria-label="Loading ShipStamp"
    >
      <div className="space-y-5">
        <Skeleton className="h-4 w-44 rounded-[2px]" />
        <Skeleton className="h-48 w-full rounded-[2px]" />
        <Skeleton className="h-20 w-4/5 rounded-[2px]" />
      </div>
      <div className="border border-border bg-card p-6">
        <Skeleton className="h-8 w-52 rounded-[2px]" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-[2px]" />
          <Skeleton className="h-16 rounded-[2px]" />
          <Skeleton className="h-16 rounded-[2px]" />
          <Skeleton className="h-24 rounded-[2px]" />
        </div>
      </div>
    </main>
  );
}
