import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Shapes,
  GitMerge,
  ExternalLink,
  MousePointerClick,
  CloudUpload,
  Laptop,
} from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import Reveal from "@/components/marketing/Reveal";
import SketchHero from "@/components/marketing/SketchHero";
import BrandMark from "@/components/marketing/BrandMark";
import Image from "next/image";

const features = [
  {
    icon: InfinityIcon,
    title: "Infinite canvas",
    description:
      "A smooth, hand-drawn canvas powered by Excalidraw — pan, zoom, and sketch without ever hitting an edge.",
  },
  {
    icon: WifiOff,
    title: "Local-first by design",
    description:
      "Every stroke saves instantly to your browser. Keep drawing on a plane, in a tunnel, or with spotty wifi.",
  },
  {
    icon: RefreshCw,
    title: "Background sync",
    description:
      "Changes quietly push to the cloud the moment you're back online — no spinners, no blocking, no lost work.",
  },
  {
    icon: GitMerge,
    title: "Conflict resolution",
    description:
      "Built-in safeguards catch clashing edits so an offline change never silently overwrites a newer version.",
  },
  {
    icon: Shapes,
    title: "Thousands of icons",
    description:
      "Search, stamp, and recolor icons from Lucide and Iconify directly on the canvas as you diagram.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "JWT-based auth with Argon2 password hashing keeps every workspace private to you.",
  },
];

const steps = [
  {
    icon: MousePointerClick,
    title: "Sketch your idea",
    description:
      "Drop shapes, icons, and connectors on an infinite canvas the moment inspiration strikes.",
  },
  {
    icon: CloudUpload,
    title: "It saves itself",
    description:
      "Every change lands in IndexedDB instantly, then syncs to the cloud in the background.",
  },
  {
    icon: Laptop,
    title: "Pick up anywhere",
    description:
      "Open any device, online or off, and your diagrams are exactly where you left them.",
  },
];

const stack = [
  "Next.js",
  "Excalidraw",
  "PostgreSQL",
  "Drizzle ORM",
  "Tailwind CSS",
  "AWS S3",
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.has("access_token") || cookieStore.has("refresh_token");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <MarketingNav isAuthenticated={isAuthenticated} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-mono text-muted-foreground mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_155)]" />
              Runs offline · syncs when you&apos;re back
            </div>

            <h1
              className="fade-up text-[2.75rem] sm:text-6xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] mb-6 font-[family-name:var(--font-heading)]"
              style={{ animationDelay: "80ms" }}
            >
              Diagram at the
              <br />
              speed of <span className="marker-underline">thought</span>
            </h1>

            <p
              className="fade-up text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
              style={{ animationDelay: "160ms" }}
            >
              Arc Draw is an infinite-canvas whiteboard for architecture
              diagrams and system design — built local-first, so it&apos;s
              never blocked by a network.
            </p>

            <div
              className="fade-up flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
              >
                {isAuthenticated ? "Go to dashboard" : "Start diagramming free"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com/SurajAiri/arc-draw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/60 text-foreground font-medium text-sm hover:bg-card transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </a>
            </div>

            <p
              className="fade-up text-xs text-muted-foreground/70 mt-6 font-mono"
              style={{ animationDelay: "280ms" }}
            >
              Free to use · no credit card · works the moment you open it
            </p>
          </div>

          {/* Signature hero illustration — the product's own diagram, sketching itself in */}
          <Reveal delay={150} className="relative">
            <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
              <SketchHero />
            </div>
            <p className="text-center text-xs text-muted-foreground/60 mt-3 font-mono">
              how a diagram synced by Arc actually looks
            </p>
          </Reveal>
        </div>

        {/* Product screenshot, framed like a browser window */}
        <Reveal delay={250} className="relative max-w-5xl mx-auto mt-20">
          <div className="rounded-2xl border border-border bg-card/40 p-2 sm:p-3">
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-[11px] font-mono text-muted-foreground/50">
                arcdraw.app/diagram
              </span>
            </div>
            <Image
              src="/screenshots/dashboard.jpg"
              width={1452}
              height={774}
              alt="Arc Draw canvas with a system architecture diagram"
              className="w-full rounded-xl border border-border/60"
              priority
            />
          </div>
        </Reveal>
      </section>

      {/* ---------------- Logos / tech row ---------------- */}
      <section className="px-6 pb-24">
        <Reveal>
          <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            Built on a modern, reliable stack
          </p>
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
            {stack.map((tech) => (
              <span
                key={tech}
                className="text-sm font-medium text-muted-foreground/80 border border-border rounded-lg px-3.5 py-1.5"
              >
                {tech}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--marker)] mb-3">
              Why Arc Draw
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 font-[family-name:var(--font-heading)]">
              Everything a fast whiteboard needs
            </h2>
            <p className="text-muted-foreground">
              No bloat, no lag, no lost work — just a clean canvas backed by an
              architecture built to keep it that way.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="hover-lift h-full rounded-2xl border border-border bg-card/50 p-6">
                  <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center mb-5">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section
        id="how-it-works"
        className="px-6 py-24 border-t border-border bg-card/20"
      >
        <div className="max-w-5xl mx-auto">
          <Reveal className="max-w-xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--marker)] mb-3">
              The flow
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 font-[family-name:var(--font-heading)]">
              From idea to diagram in seconds
            </h2>
            <p className="text-muted-foreground">
              Arc Draw gets out of your way so the only thing slowing you down
              is how fast you can think.
            </p>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="hidden md:block absolute top-7 left-[16.6%] right-[16.6%] h-px bg-border"
              aria-hidden
            />
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="relative">
                <div className="w-14 h-14 rounded-2xl border border-border bg-card flex items-center justify-center mb-5 relative z-10 font-mono text-sm text-muted-foreground">
                  <step.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Screenshot showcase ---------------- */}
      <section id="preview" className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-xl mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--marker)] mb-3">
              Inside the canvas
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 font-[family-name:var(--font-heading)]">
              A calm, monochrome workspace
            </h2>
            <p className="text-muted-foreground">
              Dark-mode-first and distraction-free, so the diagram stays the
              only thing on screen.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal className="hover-lift rounded-2xl border border-border overflow-hidden">
              <Image
                src="/screenshots/dashboard.jpg"
                alt="Arc Draw dashboard showing a grid of diagrams"
                width={1452}
                height={774}
                className="w-full h-auto"
              />
            </Reveal>
            <Reveal
              delay={100}
              className="hover-lift rounded-2xl border border-border overflow-hidden"
            >
              <Image
                src="/screenshots/canvas-icons.jpg"
                alt="Arc Draw canvas with icon picker open"
                width={1452}
                height={774}
                className="w-full h-auto"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- CTA banner ---------------- */}
      <section className="px-6 py-24 border-t border-border">
        <Reveal className="max-w-4xl mx-auto text-center relative rounded-3xl border border-border bg-card/50 p-12 sm:p-16 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" aria-hidden />
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 relative font-[family-name:var(--font-heading)]">
            {isAuthenticated
              ? "Pick up right where you left off"
              : (
                <>
                  Ready to sketch your <span className="marker-underline">next system</span>?
                </>
              )}
          </h2>
          <p className="text-muted-foreground mb-8 relative">
            {isAuthenticated
              ? "Your diagrams are waiting in your dashboard."
              : "Free to use, no credit card, offline from the first click."}
          </p>
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
          >
            {isAuthenticated ? "Go to dashboard" : "Create your workspace"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandMark size="sm" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Arc Draw. All rights reserved.
          </p>
          <a
            href="https://github.com/SurajAiri/arc-draw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub repository"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
