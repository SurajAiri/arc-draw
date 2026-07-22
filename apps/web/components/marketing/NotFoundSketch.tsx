"use client";

import type { CSSProperties } from "react";
import "./SketchHero.css";

/**
 * The 404 itself, drawn as a little architecture diagram — three sketched
 * nodes reading "4", "0", "4", wired together like boxes on the product's
 * own canvas, with one connector snapping mid-line and a stray "?" sitting
 * in the gap. This replaces having a small illustration *above* a small
 * "404" label; the numerals now carry the visual weight the page needs.
 *
 * Reuses the .sketch-shape / .sketch-label draw-in animation and the
 * --sketch-* color tokens from SketchHero so it reads as part of the same
 * product, not a generic error graphic.
 */
export default function NotFoundSketch() {
  return (
    <svg
      viewBox="0 0 560 260"
      className="w-full max-w-[520px] mx-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* "4" node */}
      <g className="sketch-node">
        <rect
          x="30"
          y="60"
          width="150"
          height="140"
          rx="14"
          pathLength="1"
          className="sketch-shape"
          stroke="var(--sketch-blue)"
          strokeWidth="3"
          style={{ "--sketch-delay": "0s" } as CSSProperties}
          transform="rotate(-1 105 130)"
        />
        <text
          x="105"
          y="150"
          textAnchor="middle"
          className="sketch-label"
          style={{
            "--sketch-delay": "0.5s",
            fill: "var(--sketch-ink)",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "72px",
          } as CSSProperties}
        >
          4
        </text>
      </g>

      {/* "0" node — drawn as a broken circle instead of a box, the odd one out */}
      <g className="sketch-node">
        <ellipse
          cx="280"
          cy="130"
          rx="70"
          ry="68"
          pathLength="1"
          className="sketch-shape"
          stroke="var(--marker)"
          strokeWidth="3"
          style={{ "--sketch-delay": "0.15s" } as CSSProperties}
        />
        <text
          x="280"
          y="150"
          textAnchor="middle"
          className="sketch-label"
          style={{
            "--sketch-delay": "0.65s",
            fill: "var(--sketch-ink)",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "72px",
          } as CSSProperties}
        >
          0
        </text>
      </g>

      {/* "4" node */}
      <g className="sketch-node">
        <rect
          x="380"
          y="60"
          width="150"
          height="140"
          rx="14"
          pathLength="1"
          className="sketch-shape"
          stroke="var(--sketch-green)"
          strokeWidth="3"
          style={{ "--sketch-delay": "0.3s" } as CSSProperties}
          transform="rotate(1 455 130)"
        />
        <text
          x="455"
          y="150"
          textAnchor="middle"
          className="sketch-label"
          style={{
            "--sketch-delay": "0.8s",
            fill: "var(--sketch-ink)",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "72px",
          } as CSSProperties}
        >
          4
        </text>
      </g>

      {/* Connector: 4 -> 0, drawn clean and complete */}
      <path
        d="M 180 130 Q 195 126, 210 130"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ "--sketch-delay": "0.5s", opacity: 0.55 } as CSSProperties}
      />

      {/* Connector: 0 -> 4, breaks mid-line — the actual "404" */}
      <path
        d="M 350 130 Q 362 134, 372 130"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ "--sketch-delay": "0.65s", opacity: 0.55 } as CSSProperties}
      />
      <path
        d="M 388 130 Q 375 126, 380 130"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ "--sketch-delay": "0.65s", opacity: 0.55 } as CSSProperties}
      />

      {/* Dangling "?" sitting in the break, like an unresolved node label */}
      <text
        x="365"
        y="112"
        textAnchor="middle"
        className="sketch-label"
        style={{
          "--sketch-delay": "1.05s",
          fill: "var(--marker)",
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "22px",
        } as CSSProperties}
      >
        ?
      </text>

      {/* Small scatter of stray marks below, like an abandoned sketch */}
      <path
        d="M 250 220 Q 257 213, 264 220"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-amber)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ "--sketch-delay": "1.2s", opacity: 0.5 } as CSSProperties}
      />
      <path
        d="M 280 226 Q 287 219, 294 226"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-amber)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ "--sketch-delay": "1.3s", opacity: 0.5 } as CSSProperties}
      />
      <path
        d="M 310 220 Q 317 213, 324 220"
        pathLength="1"
        className="sketch-shape"
        stroke="var(--sketch-amber)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ "--sketch-delay": "1.4s", opacity: 0.5 } as CSSProperties}
      />
    </svg>
  );
}
