import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface ComparisonItem {
  id: string;
  text: string;
}

interface ComparisonColumn {
  id: string;
  label: string;
  tone: "positive" | "neutral";
  items: ComparisonItem[];
}

interface Feature30Props {
  label?: string;
  heading: string;
  description?: string;
  firstColumn: ComparisonColumn;
  secondColumn: ComparisonColumn;
  className?: string;
}

// Adapted from Beste UI's free Feature30 comparison block.
export function Feature30({
  label,
  heading,
  description,
  firstColumn,
  secondColumn,
  className,
}: Feature30Props) {
  const renderColumn = (column: ComparisonColumn) => (
    <section
      key={column.id}
      className="border-t border-border"
      aria-labelledby={`${column.id}-heading`}
    >
      <div className="flex items-center justify-between border-b border-border py-4">
        <h3
          id={`${column.id}-heading`}
          className="font-mono text-xs tracking-[0.1em] uppercase"
        >
          {column.label}
        </h3>
        <span
          className={
            column.tone === "positive"
              ? "technical-label text-primary"
              : "technical-label"
          }
        >
          {column.tone === "positive" ? "Recorded" : "Not asserted"}
        </span>
      </div>
      <ul>
        {column.items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[1.5rem_1fr] gap-3 border-b border-border py-4 text-sm leading-6"
          >
            {column.tone === "positive" ? (
              <Check
                className="mt-1 size-3.5 text-primary"
                aria-hidden="true"
              />
            ) : (
              <Minus
                className="mt-1 size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span className="text-muted-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <section
      className={cn("mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20", className)}
    >
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          {label && <p className="technical-label text-primary">{label}</p>}
          <h2 className="display-title mt-3 max-w-md text-5xl leading-[0.9] sm:text-6xl">
            {heading}
          </h2>
          {description && (
            <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {renderColumn(firstColumn)}
          {renderColumn(secondColumn)}
        </div>
      </div>
    </section>
  );
}
