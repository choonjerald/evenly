type Props = {
  label: string;
  total: number;
  members: string[];
  currency?: string;
};

export function SplitVisual({ label, total, members, currency = "$" }: Props) {
  const each = total / Math.max(1, members.length);
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">
          {currency}
          {total}
        </p>
      </div>
      <div className="flex h-8 overflow-hidden rounded-md border">
        {members.map((m, i) => (
          <div key={m} className="flex-1 border-r bg-muted last:border-r-0" aria-label={`${m} share`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {members.map((m) => (
          <div key={m} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-foreground/60" />
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

