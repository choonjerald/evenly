"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Member = {
  name: string;
  color?: string; // tailwind color class suffix
};

type SplitDemoProps = {
  label?: string;
  total?: number;
  currency?: string;
  members?: Member[];
  className?: string;
};

/**
 * Minimal, legible visualization of an even split.
 * Designed to hint at the product without adding interaction complexity.
 */
export function SplitDemo({
  label = "Dinner",
  total = 120,
  currency = "$",
  members = [
    { name: "Alex", color: "sky" },
    { name: "Bea", color: "violet" },
    { name: "Cam", color: "emerald" },
    { name: "Drew", color: "amber" },
  ],
  className,
}: SplitDemoProps) {
  const each = total / members.length;

  const palette: Record<string, { seg: string; segBorder: string; dot: string }> = {
    sky: { seg: "bg-sky-400/20", segBorder: "border-sky-400/30", dot: "bg-sky-500" },
    violet: { seg: "bg-violet-400/20", segBorder: "border-violet-400/30", dot: "bg-violet-500" },
    emerald: { seg: "bg-emerald-400/20", segBorder: "border-emerald-400/30", dot: "bg-emerald-500" },
    amber: { seg: "bg-amber-400/20", segBorder: "border-amber-400/30", dot: "bg-amber-500" },
  };

  return (
    <Card className={cn("relative w-full max-w-lg overflow-hidden border", className)}>
      <div className="grid gap-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{label}</p>
          <p className="font-medium">
            {currency}
            {total}
          </p>
        </div>

        {/* Even segments bar */}
        <div className="flex h-8 overflow-hidden rounded-md border bg-muted/30">
          {members.map((m, i) => (
            <div
              key={m.name}
              className={cn(
                "flex-1 border-r last:border-r-0",
                palette[m.color || "sky"].seg,
                palette[m.color || "sky"].segBorder
              )}
              title={`${m.name} — ${currency}${each}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-sm", palette[m.color || "sky"].dot)} />
              <span className="truncate text-muted-foreground">{m.name}</span>
              <span className="ml-auto font-medium text-foreground">
                {currency}
                {each}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
