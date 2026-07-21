"use client";

import type { CSSProperties } from "react";

/**
 * The page's signature element: a small system-architecture diagram that
 * sketches itself in, stroke by stroke, in the same hand-drawn register as
 * the product's own canvas. Boxes wobble slightly off-true (two overlaid
 * paths per rectangle, one offset a degree) to read as "drawn," not
 * vector-perfect — the same trick Excalidraw's renderer uses.
 *
 * Pure SVG + CSS animation, no JS animation library needed.
 */
export default function SketchHero() {
  return (
    <svg
      viewBox="0 0 760 340"
      fill="none"
      className="w-full h-auto"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 L2.5,5 Z" fill="var(--sketch-ink)" />
        </marker>
      </defs>

      {/* Connectors — drawn first, underneath the nodes */}
      <g stroke="var(--sketch-ink)" strokeWidth="2" strokeLinecap="round" opacity="0.75">
        <path
          d="M 195 78 C 230 78, 235 78, 268 78"
          className="sketch-line"
          style={{ "--sketch-length": 90, "--sketch-delay": "1.0s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        <path
          d="M 195 122 C 225 150, 235 165, 266 182"
          className="sketch-line"
          style={{ "--sketch-length": 130, "--sketch-delay": "1.15s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        <path
          d="M 430 90 C 460 90, 466 90, 494 90"
          className="sketch-line"
          style={{ "--sketch-length": 90, "--sketch-delay": "1.35s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        <path
          d="M 420 178 C 450 178, 460 178, 494 168"
          className="sketch-line"
          style={{ "--sketch-length": 100, "--sketch-delay": "1.5s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        <path
          d="M 355 150 C 355 100, 355 90, 355 130"
          className="sketch-line"
          style={{ "--sketch-length": 60, "--sketch-delay": "1.25s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
      </g>

      {/* Node: Client */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.05s" } as CSSProperties}
      >
        <rect x="40" y="52" width="150" height="52" rx="9" stroke="var(--sketch-blue)" strokeWidth="2.5" transform="rotate(-0.6 115 78)" />
        <rect x="42" y="54" width="146" height="48" rx="8" stroke="var(--sketch-blue)" strokeWidth="1" opacity="0.4" transform="rotate(0.4 115 78)" />
        <text x="115" y="83" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fill="var(--sketch-blue)">Browser</text>
      </g>

      {/* Node: IndexedDB */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.15s" } as CSSProperties}
      >
        <rect x="40" y="98" width="150" height="52" rx="9" stroke="var(--sketch-green)" strokeWidth="2.5" transform="rotate(0.7 115 124)" />
        <rect x="42" y="100" width="146" height="48" rx="8" stroke="var(--sketch-green)" strokeWidth="1" opacity="0.4" transform="rotate(-0.3 115 124)" />
        <text x="115" y="129" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fill="var(--sketch-green)">IndexedDB</text>
      </g>

      {/* Node: Canvas (center, emphasized with marker accent) */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.3s" } as CSSProperties}
      >
        <rect x="268" y="52" width="162" height="56" rx="10" stroke="var(--sketch-amber)" strokeWidth="3" transform="rotate(0.5 349 80)" />
        <rect x="271" y="55" width="156" height="50" rx="9" stroke="var(--sketch-amber)" strokeWidth="1" opacity="0.45" transform="rotate(-0.4 349 80)" />
        <text x="349" y="85" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fontWeight="500" fill="var(--sketch-amber)">Arc canvas</text>
      </g>

      {/* Node: Sync worker */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.45s" } as CSSProperties}
      >
        <rect x="270" y="156" width="150" height="52" rx="9" stroke="var(--sketch-ink)" strokeWidth="2" transform="rotate(-0.5 345 182)" />
        <rect x="272" y="158" width="146" height="48" rx="8" stroke="var(--sketch-ink)" strokeWidth="1" opacity="0.35" transform="rotate(0.3 345 182)" />
        <text x="345" y="187" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fill="var(--sketch-ink)">Sync queue</text>
      </g>

      {/* Node: API */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.6s" } as CSSProperties}
      >
        <rect x="496" y="66" width="150" height="52" rx="9" stroke="var(--sketch-blue)" strokeWidth="2.5" transform="rotate(0.6 571 92)" />
        <rect x="498" y="68" width="146" height="48" rx="8" stroke="var(--sketch-blue)" strokeWidth="1" opacity="0.4" transform="rotate(-0.4 571 92)" />
        <text x="571" y="97" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fill="var(--sketch-blue)">API</text>
      </g>

      {/* Node: Postgres */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "0.75s" } as CSSProperties}
      >
        <rect x="496" y="142" width="150" height="52" rx="9" stroke="var(--sketch-green)" strokeWidth="2.5" transform="rotate(-0.4 571 168)" />
        <rect x="498" y="144" width="146" height="48" rx="8" stroke="var(--sketch-green)" strokeWidth="1" opacity="0.4" transform="rotate(0.5 571 168)" />
        <text x="571" y="173" textAnchor="middle" fontFamily="var(--font-mono, monospace)" fontSize="15" fill="var(--sketch-green)">Postgres</text>
      </g>

      {/* A loose freehand squiggle + cursor, like mid-sketch on the canvas node */}
      <g
        className="sketch-node"
        style={{ "--sketch-delay": "1.7s" } as CSSProperties}
      >
        <circle cx="349" cy="80" r="3" fill="var(--sketch-amber)" />
        <path
          d="M 300 250 Q 320 230, 349 235 T 400 245"
          stroke="var(--sketch-amber)"
          strokeWidth="2"
          strokeLinecap="round"
          className="sketch-line"
          style={{ "--sketch-length": 130, "--sketch-delay": "1.8s" } as CSSProperties}
        />
      </g>
    </svg>
  );
}
