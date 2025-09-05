import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  lines?: number;
  amplitude?: number; // vertical swing of curves
  strokeWidth?: number;
};

// Theme-aware SVG threads background (light: dark lines, dark: light lines)
export function ThreadsBackground({ className, lines = 7, amplitude = 120, strokeWidth = 1 }: Props) {
  const w = 1200;
  const h = 620;

  const paths = Array.from({ length: lines }).map((_, i) => {
    const t = i / Math.max(1, lines - 1);
    const y = 60 + t * (h - 120);
    const a = amplitude * (i % 2 === 0 ? 1 : -1) * (0.85 + 0.3 * Math.sin(i * 1.1));
    const c1x = w * 0.28;
    const c2x = w * 0.72;
    return `M 0 ${y} C ${c1x} ${y - a}, ${c2x} ${y + a}, ${w} ${y}`;
  });

  const mask = "radial-gradient(ellipse at center, black 65%, transparent 100%)";

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-0", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className={cn(
          "absolute inset-0 h-full w-full",
          "[mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_100%)]",
          "[-webkit-mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_100%)]"
        )}
        style={{ WebkitMaskImage: mask as any, maskImage: mask as any }}
      >
        <g className="dark:hidden" stroke="rgba(0,0,0,0.12)" fill="none" strokeWidth={strokeWidth}>
          {paths.map((d, idx) => (
            <path key={`l-${idx}`} d={d} />
          ))}
        </g>
        <g className="hidden dark:block" stroke="rgba(255,255,255,0.16)" fill="none" strokeWidth={strokeWidth}>
          {paths.map((d, idx) => (
            <path key={`d-${idx}`} d={d} />
          ))}
        </g>
      </svg>
      <div
        className="absolute left-1/2 top-[18%] -z-10 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-25 mix-blend-screen"
        style={{ background: "radial-gradient(closest-side, var(--primary), transparent 70%)" }}
      />
    </div>
  );
}

