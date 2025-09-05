import { cn } from "@/lib/utils";

type Props = {
  label: string;
  total: number;
  members: string[];
  currency?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
};

export function SplitVisual({ label, total, members, currency = "$", size = "md", animated = true, className }: Props) {
  const each = total / Math.max(1, members.length);
  const h = size === "sm" ? "h-6" : size === "lg" ? "h-12" : "h-8";
  const colors = (i: number) => `var(--chart-${(i % 5) + 1})`;
  return (
    <div className={cn("grid gap-4", className)}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .rb-sv { --rb-delay-step: 70ms; }
          @keyframes rbFill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
          .rb-sv[data-animate] .seg { transform-origin: left; animation: rbFill .6s ease forwards; }
          @media (prefers-reduced-motion: reduce) { .rb-sv[data-animate] .seg { animation: none; transform: none; } }
        `,
        }}
      />
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">
          {currency}
          {total}
        </p>
      </div>
      <div className={cn("rb-sv flex overflow-hidden rounded-md border bg-secondary/30", h)} data-animate={animated || undefined}>
        {members.map((m, i) => (
          <div
            key={m}
            className="seg relative flex-1 last:after:hidden"
            aria-label={`${m} share`}
            style={{
              background: colors(i),
              // soft divider between segments
              // use inset box-shadow for crisp 1px separators without layout
              boxShadow: i === members.length - 1 ? undefined : "inset -1px 0 0 var(--border)",
              animationDelay: animated ? `${i * 70}ms` : undefined,
              transform: animated ? "scaleX(0)" : undefined,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {members.map((m, i) => (
          <div key={m} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: colors(i) }} />
            <span className="truncate text-muted-foreground">{m}</span>
            <span className="ml-auto font-medium text-foreground">
              {currency}
              {each}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
