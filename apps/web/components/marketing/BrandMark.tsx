import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Where clicking the mark should go. Defaults to the marketing homepage. */
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Preload the mark — use only for the one instance visible above the fold. */
  priority?: boolean;
}

const SIZES = {
  sm: { box: "w-6 h-6", text: "text-sm" },
  md: { box: "w-7 h-7", text: "text-sm" },
  lg: { box: "w-10 h-10", text: "text-xl" },
} as const;

/**
 * The Arc Draw wordmark + icon, used in the nav, footer, dashboard header,
 * and auth screens. Always links back to the marketing landing page by
 * default so the brand is a consistent "home" affordance everywhere.
 */
export default function BrandMark({ href = "/", size = "md", className, priority = false }: BrandMarkProps) {
  const { box, text } = SIZES[size];
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 hover:opacity-80 transition-opacity", className)}
    >
      <Image
        src="/logo.png"
        alt="Arc Draw"
        width={40}
        height={40}
        priority={priority}
        className={cn(box, "rounded-lg object-contain")}
      />
      <span className={cn("font-semibold tracking-tight text-foreground font-[family-name:var(--font-heading)]", text)}>
        Arc Draw
      </span>
    </Link>
  );
}
