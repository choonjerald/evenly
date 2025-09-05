import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps, ReactElement } from "react";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto max-w-6xl px-6", className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-20", className)} {...props} />;
}

type StackProps = ComponentProps<"div"> & {
  space?: "xs" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end";
};

export function Stack({ className, space = "md", align, ...props }: StackProps) {
  const gap = space === "xs" ? "gap-2" : space === "sm" ? "gap-3" : space === "lg" ? "gap-6" : "gap-4";
  const ai = align === "center" ? "items-center" : align === "end" ? "items-end" : "items-start";
  return <div className={cn("flex flex-col", gap, ai, className)} {...props} />;
}

export function Columns({
  className,
  children,
  stackOn = "md",
  divide = false,
  ...props
}: ComponentProps<"div"> & {
  stackOn?: "sm" | "md" | "lg" | "xl";
  divide?: boolean;
}) {
  const grid = cn(
    "relative grid gap-8",
    stackOn === "sm" && "sm:grid-cols-2",
    stackOn === "md" && "md:grid-cols-2",
    stackOn === "lg" && "lg:grid-cols-2",
    stackOn === "xl" && "xl:grid-cols-2",
    className
  );
  const kids = Array.isArray(children) ? (children as unknown as ReactElement[]) : [children as unknown as ReactElement];
  return (
    <div className={grid} {...props}>
      {divide && <div aria-hidden className={cn("absolute inset-y-0 left-1/2 hidden w-px bg-border", stackOn === "sm" ? "sm:block" : stackOn === "md" ? "md:block" : stackOn === "lg" ? "lg:block" : "xl:block")} />}
      {kids[0]}
      {kids[1]}
    </div>
  );
}

export function Divider({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical"; className?: string }) {
  if (orientation === "vertical") return <div aria-hidden className={cn("h-full w-px bg-border", className)} />;
  return <hr className={cn("h-px w-full bg-border", className)} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border bg-card p-6", className)} {...props} />;
}

export function Grid({ className, cols = {}, ...props }: ComponentProps<"div"> & { cols?: Partial<Record<"base" | "sm" | "md" | "lg" | "xl", number>> }) {
  const mk = (n?: number) => (n ? `grid-cols-${n}` : "");
  return (
    <div
      className={cn(
        "grid gap-6",
        mk(cols.base),
        cols.sm && `sm:${mk(cols.sm)}`,
        cols.md && `md:${mk(cols.md)}`,
        cols.lg && `lg:${mk(cols.lg)}`,
        cols.xl && `xl:${mk(cols.xl)}`,
        className
      )}
      {...props}
    />
  );
}

type ButtonProps = {
  asChild?: boolean;
  intent?: "primary" | "outline" | "ghost";
  href?: string;
  className?: string;
  children?: React.ReactNode;
} & ComponentProps<"a">;

export function Button({ asChild, intent = "primary", className, href = "#", children, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const pad = "h-10 px-4 py-2";
  const styles =
    intent === "primary"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : intent === "outline"
      ? "border border-border bg-background hover:bg-accent"
      : "hover:bg-accent";

  const cls = cn(base, pad, styles, className);
  if (asChild) return children as unknown as ReactElement;
  return (
    <Link className={cls} href={href} {...(rest as any)}>
      {children}
    </Link>
  );
}
