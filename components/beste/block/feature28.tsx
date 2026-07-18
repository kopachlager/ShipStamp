import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  note?: string;
}

interface Feature28Props {
  label?: string;
  heading: string;
  description?: string;
  steps: TimelineStep[];
  className?: string;
}

// Adapted from Beste UI's free Feature28 process timeline.
export function Feature28({
  label,
  heading,
  description,
  steps,
  className,
}: Feature28Props) {
  return (
    <section className={cn("bg-card/20", className)}>
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-7 pb-9 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            {label && <p className="technical-label text-primary">{label}</p>}
            <h2 className="display-title mt-3 max-w-xl text-5xl leading-[0.9] sm:text-6xl">
              {heading}
            </h2>
          </div>
          {description && (
            <p className="max-w-xl self-end text-sm leading-6 text-muted-foreground lg:justify-self-end">
              {description}
            </p>
          )}
        </div>

        <ol className="relative grid md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="relative grid grid-cols-[3.5rem_1fr] gap-4 py-7 md:block md:px-7 md:py-10 md:first:pl-0 md:last:pr-0"
            >
              <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary md:mx-auto">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="md:mt-8 md:text-center">
                {step.note && (
                  <p className="font-mono text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
                    {step.note}
                  </p>
                )}
                <h3 className="mt-2 font-mono text-xs font-medium tracking-[0.08em] uppercase">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
