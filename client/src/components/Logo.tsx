import { cn } from "@/lib/utils";

interface LogoProps {
  /** Mark size in px (width & height). Default 28. */
  size?: number;
  /** Render the "Trackly" wordmark next to the mark. */
  showWordmark?: boolean;
  /** Extra classes for the wordmark text. */
  wordmarkClassName?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
}

/**
 * Trackly brand mark: three kanban columns of ascending height inside a
 * rounded tile. Uses theme colors (primary / primary-foreground) so it
 * adapts to dark mode automatically, and stays crisp at any size since
 * it's pure SVG.
 */
export default function Logo({
  size = 28,
  showWordmark = true,
  wordmarkClassName,
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Trackly"
        className="shrink-0"
      >
        {/* Tile */}
        <rect width="32" height="32" rx="8" className="fill-primary" />
        {/* Kanban columns */}
        <rect x="8.5" y="16" width="4" height="8" rx="2" className="fill-primary-foreground opacity-60" />
        <rect x="14" y="12" width="4" height="12" rx="2" className="fill-primary-foreground opacity-80" />
        <rect x="19.5" y="8" width="4" height="16" rx="2" className="fill-primary-foreground" />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            wordmarkClassName
          )}
        >
          Trackly
        </span>
      )}
    </span>
  );
}
