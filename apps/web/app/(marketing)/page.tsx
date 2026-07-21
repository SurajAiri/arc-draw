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
  Sparkles,
  MousePointerClick,
  CloudUpload,
  Laptop,
} from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import Reveal from "@/components/marketing/Reveal";
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

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.has("access_token") || cookieStore.has("refresh_token");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <MarketingNav isAuthenticated={isAuthenticated} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative pt-40 pb-28 px-6">
        <div className="absolute inset-0 grid-bg-animated opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div
          className="blob-a absolute -top-24 left-1/4 w-[28rem] h-[28rem] rounded-full bg-white/[0.05] blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="blob-b absolute top-10 right-1/4 w-[24rem] h-[24rem] rounded-full bg-white/[0.04] blur-3xl pointer-events-none"
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="fade-up inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Local-first diagramming, reimagined
          </div>

          <h1
            className="fade-up text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6"
            style={{ animationDelay: "80ms" }}
          >
            Diagram at the
            <br />
            <span className="gradient-text-animated">speed of thought</span>
          </h1>

          <p
            className="fade-up text-lg text-muted-foreground max-w-xl mx-auto mb-10"
            style={{ animationDelay: "160ms" }}
          >
            Arc Draw is an infinite-canvas whiteboard for architecture diagrams
            and system design — built local-first, so it&apos;s never blocked by
            a network.
          </p>

          <div
            className="fade-up flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all glow-primary"
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
        </div>

        {/* Hero preview frame */}
        <Reveal delay={200} className="relative max-w-5xl mx-auto mt-20">
          <div className="glass rounded-2xl p-2 sm:p-3 glow-primary">
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <Image
              src="/screenshots/dashboard.jpg"
              width={1200}
              height={800}
              alt="Arc Draw canvas with a system architecture diagram"
              className="w-full rounded-xl border border-border/60"
            />
          </div>
        </Reveal>
      </section>

      {/* ---------------- Logos / tech row ---------------- */}
      <section className="px-6 pb-24">
        <Reveal>
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Built on a modern, reliable stack
          </p>
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground/70 text-sm font-medium">
            <span>Next.js</span>
            <span>Excalidraw</span>
            <span>PostgreSQL</span>
            <span>Drizzle ORM</span>
            <span>Tailwind CSS</span>
            <span>AWS S3</span>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
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
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <feature.icon className="w-5 h-5 text-primary" />
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
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
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
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5 relative z-10">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {i + 1}. {step.title}
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
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              A calm, monochrome workspace
            </h2>
            <p className="text-muted-foreground">
              Dark-mode-first and distraction-free, so the diagram stays the
              only thing on screen.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal className="hover-lift rounded-2xl border border-border overflow-hidden">
              <img
                src="/screenshots/dashboard.jpg"
                alt="Arc Draw dashboard showing a grid of diagrams"
                className="w-full"
              />
            </Reveal>
            <Reveal
              delay={100}
              className="hover-lift rounded-2xl border border-border overflow-hidden"
            >
              <img
                src="/screenshots/canvas-icons.jpg"
                alt="Arc Draw canvas with icon picker open"
                className="w-full"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- CTA banner ---------------- */}
      <section className="px-6 py-24 border-t border-border">
        <Reveal className="max-w-4xl mx-auto text-center relative rounded-3xl glass p-12 sm:p-16 overflow-hidden">
          <div
            className="blob-a absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/[0.06] blur-3xl pointer-events-none"
            aria-hidden
          />
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 relative">
            {isAuthenticated
              ? "Pick up right where you left off"
              : "Ready to sketch your next system?"}
          </h2>
          <p className="text-muted-foreground mb-8 relative">
            {isAuthenticated
              ? "Your diagrams are waiting in your dashboard."
              : "Free to use, no credit card, offline from the first click."}
          </p>
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all glow-primary"
          >
            {isAuthenticated ? "Go to dashboard" : "Create your workspace"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Arc Draw"
              className="w-6 h-6 rounded-lg object-contain"
            />
            <span className="text-sm font-medium gradient-text">Arc Draw</span>
          </div>
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
