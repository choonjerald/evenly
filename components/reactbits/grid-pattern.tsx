"use client";

import { cn } from "@/lib/utils";

type GridPatternProps = {
  className?: string;
  /** Grid cell size in px */
  size?: number;
  /** Line color; defaults to border color */
  stroke?: string;
  /** Opacity of the lines */
  opacity?: number;
  /** Optional mask via linear-gradient to fade edges */
  mask?: string;
};

export function GridPattern({
  className,
  size = 28,
  stroke = "hsl(var(--border))",
  opacity = 0.3,
  mask = "radial-gradient(60% 60% at 50% 40%, black, transparent)",
}: GridPatternProps) {
  const id = `grid-${size}`;
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 h-full w-full", className)}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke={stroke}
            strokeOpacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} style={{ maskImage: mask, WebkitMaskImage: mask }} />
    </svg>
  );
}

