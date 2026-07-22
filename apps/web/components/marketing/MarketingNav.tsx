import BrandMark from "@/components/marketing/BrandMark";
import MarketingNavBackground from "@/components/marketing/MarketingNavBackground";
import MarketingNavInteractive from "@/components/marketing/MarketingNavInteractive";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#preview", label: "Preview" },
];

/**
 * Server component shell — renders immediately with no client JS wait.
 * The logo and text nav links are static, so they no longer sit behind
 * hydration (previously the whole nav was "use client" just for scroll
 * state / mobile menu / auth-aware CTA, which delayed even this plain
 * text from painting and could get misidentified as the LCP element).
 * Interactive bits (scroll background, mobile menu, auth CTA) are
 * layered in via MarketingNavInteractive, a small client island.
 */
export default function MarketingNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 relative">
      <MarketingNavBackground />
      <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <BrandMark priority />

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <MarketingNavInteractive />
      </div>
    </header>
  );
}
