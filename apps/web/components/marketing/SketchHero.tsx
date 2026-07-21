"use client";

import type { CSSProperties } from "react";
import "./SketchHero.css";

/**
 * The page's signature element: a small system-architecture diagram that
 * sketches itself in, stroke by stroke, in the same hand-drawn register as
 * the product's own canvas. Boxes wobble slightly off-true (two overlaid
 * paths per rectangle, one offset a degree) to read as "drawn," not
 * vector-perfect — the same trick Excalidraw's renderer uses.
 *
 * v2 changes from the original:
 * - Box outlines are stroke-drawn (not faded in) using `pathLength="1"`,
 *   so the dash animation is always accurate regardless of each shape's
 *   actual rendered curve length — no more eyeballed dasharray values.
 * - Labels fade in just after their box finishes drawing, instead of
 *   fading in alongside a box that was also just fading.
 * - The pen-cursor dot now actually rides the closing squiggle path via
 *   `offset-path`, instead of sitting static (or being commented out).
 * - Delay pacing is no longer perfectly linear — connectors ease in a
 *   little faster relative to nodes so the sequence has some rhythm.
 *
 * Layout is a strict 3-column grid (client -> canvas/sync -> server) with
 * every connector's start/end point computed from the actual node
 * geometry below, so arrows always meet box edges exactly.
 *
 * Pure SVG + CSS animation, no JS animation library needed.
 */

// Node geometry — single source of truth, used for both the boxes and
// the connector paths so nothing can drift out of alignment.
const NODES = {
  browser: { x: 40, y: 40, w: 170, h: 60, color: "var(--sketch-blue)" },
  indexeddb: { x: 40, y: 130, w: 170, h: 60, color: "var(--sketch-green)" },
  canvas: { x: 270, y: 76, w: 210, h: 68, color: "var(--sketch-amber)" },
  syncQueue: { x: 270, y: 194, w: 210, h: 60, color: "var(--sketch-ink)" },
  api: { x: 540, y: 46, w: 170, h: 60, color: "var(--sketch-blue)" },
  postgres: { x: 540, y: 150, w: 170, h: 60, color: "var(--sketch-green)" },
} as const;

function center(n: (typeof NODES)[keyof typeof NODES]) {
  return { cx: n.x + n.w / 2, cy: n.y + n.h / 2 };
}

function rightEdge(n: (typeof NODES)[keyof typeof NODES]) {
  return { x: n.x + n.w, y: n.y + n.h / 2 };
}
function leftEdge(n: (typeof NODES)[keyof typeof NODES]) {
  return { x: n.x, y: n.y + n.h / 2 };
}

const browserRight = rightEdge(NODES.browser);
const indexeddbRight = rightEdge(NODES.indexeddb);
const canvasLeftTop = { x: NODES.canvas.x, y: NODES.canvas.y + 18 };
const canvasLeftBottom = {
  x: NODES.canvas.x,
  y: NODES.canvas.y + NODES.canvas.h - 14,
};
const canvasRight = rightEdge(NODES.canvas);
const syncQueueTop = {
  x: NODES.syncQueue.x + NODES.syncQueue.w / 2,
  y: NODES.syncQueue.y,
};
const canvasBottom = {
  x: center(NODES.canvas).cx,
  y: NODES.canvas.y + NODES.canvas.h,
};
const syncQueueRight = rightEdge(NODES.syncQueue);
const apiLeft = leftEdge(NODES.api);
const postgresLeft = leftEdge(NODES.postgres);

// Closing squiggle beneath the canvas node — defined once so the drawn
// path and the pen-dot's offset-path always stay in sync.
const SQUIGGLE_PATH = "M 300 272 Q 320 264, 349 266 T 400 270";

function Node({
  node,
  label,
  boxDelay,
  labelDelay,
  bold = false,
}: {
  node: (typeof NODES)[keyof typeof NODES];
  label: string;
  boxDelay: string;
  labelDelay: string;
  bold?: boolean;
}) {
  const { x, y, w, h, color } = node;
  const cx = x + w / 2;
  const cy = y + h / 2 + 5;
  return (
    <g className="sketch-node">
      {/* Outer wobble stroke — drawn, not faded */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill="none"
        stroke={color}
        strokeWidth={bold ? 3 : 2.5}
        pathLength={1}
        transform={`rotate(${bold ? 0.5 : -0.5} ${cx} ${y + h / 2})`}
        className="sketch-shape"
        style={{ "--sketch-delay": boxDelay } as CSSProperties}
      />
      {/* Inner wobble stroke — drawn slightly after the outer one so the
          "second pass of the pen" reads as a distinct stroke rather than
          two paths animating in perfect lockstep */}
      <rect
        x={x + 3}
        y={y + 3}
        width={w - 6}
        height={h - 6}
        rx={8}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
        pathLength={1}
        transform={`rotate(${bold ? -0.4 : 0.4} ${cx} ${y + h / 2})`}
        className="sketch-shape"
        style={
          {
            "--sketch-delay": `calc(${boxDelay} + 0.08s)`,
          } as CSSProperties
        }
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        fontSize={15}
        fontWeight={bold ? 500 : 400}
        fill={color}
        className="sketch-label"
        style={{ "--sketch-delay": labelDelay } as CSSProperties}
      >
        {label}
      </text>
    </g>
  );
}

export default function SketchHero() {
  return (
    <svg
      viewBox="0 0 760 300"
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

      {/* Connectors — drawn first, underneath the nodes. Every path's
          endpoints are derived from NODES above, so they always meet the
          box edges cleanly regardless of future layout tweaks. Each uses
          pathLength="1" so the stroke-draw animation is always exactly
          right regardless of the curve's actual rendered length. */}
      <g
        stroke="var(--sketch-ink)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      >
        {/* Browser -> Arc canvas (upper-left entry point) */}
        <path
          d={`M ${browserRight.x} ${browserRight.y} C ${browserRight.x + 40} ${browserRight.y}, ${canvasLeftTop.x - 30} ${canvasLeftTop.y}, ${canvasLeftTop.x} ${canvasLeftTop.y}`}
          pathLength={1}
          className="sketch-shape"
          style={{ "--sketch-delay": "1.05s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        {/* IndexedDB -> Arc canvas (lower-left entry point) */}
        <path
          d={`M ${indexeddbRight.x} ${indexeddbRight.y} C ${indexeddbRight.x + 40} ${indexeddbRight.y}, ${canvasLeftBottom.x - 30} ${canvasLeftBottom.y}, ${canvasLeftBottom.x} ${canvasLeftBottom.y}`}
          pathLength={1}
          className="sketch-shape"
          style={{ "--sketch-delay": "1.2s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        {/* Arc canvas -> Sync queue (straight down) */}
        <path
          d={`M ${canvasBottom.x} ${canvasBottom.y} L ${syncQueueTop.x} ${syncQueueTop.y}`}
          pathLength={1}
          className="sketch-shape"
          style={{ "--sketch-delay": "1.35s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        {/* Arc canvas -> API */}
        <path
          d={`M ${canvasRight.x} ${canvasRight.y} C ${canvasRight.x + 40} ${canvasRight.y}, ${apiLeft.x - 40} ${apiLeft.y}, ${apiLeft.x} ${apiLeft.y}`}
          pathLength={1}
          className="sketch-shape"
          style={{ "--sketch-delay": "1.5s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
        {/* Sync queue -> Postgres */}
        <path
          d={`M ${syncQueueRight.x} ${syncQueueRight.y} C ${syncQueueRight.x + 40} ${syncQueueRight.y}, ${postgresLeft.x - 40} ${postgresLeft.y}, ${postgresLeft.x} ${postgresLeft.y}`}
          pathLength={1}
          className="sketch-shape"
          style={{ "--sketch-delay": "1.65s" } as CSSProperties}
          markerEnd="url(#arrow)"
        />
      </g>

      <Node
        node={NODES.browser}
        label="Browser"
        boxDelay="0.05s"
        labelDelay="0.35s"
      />
      <Node
        node={NODES.indexeddb}
        label="IndexedDB"
        boxDelay="0.15s"
        labelDelay="0.45s"
      />
      <Node
        node={NODES.canvas}
        label="Arc canvas"
        boxDelay="0.3s"
        labelDelay="0.6s"
        bold
      />
      <Node
        node={NODES.syncQueue}
        label="Sync queue"
        boxDelay="0.45s"
        labelDelay="0.75s"
      />
      <Node node={NODES.api} label="API" boxDelay="0.6s" labelDelay="0.9s" />
      <Node
        node={NODES.postgres}
        label="Postgres"
        boxDelay="0.75s"
        labelDelay="1.05s"
      />

      {/* A small freehand squiggle beneath the canvas node, reading as
          "still sketching" — kept short and contained so it never
          collides with the sync queue box above it. A pen-dot rides the
          same path via offset-path so it looks like it's actively
          drawing the line, then fades out once it reaches the end. */}
      <path
        d={SQUIGGLE_PATH}
        stroke="var(--sketch-amber)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        className="sketch-shape"
        style={{ "--sketch-delay": "2.0s" } as CSSProperties}
      />
      <circle
        r={4}
        fill="var(--sketch-amber)"
        className="pen-dot"
        style={{ offsetPath: `path('${SQUIGGLE_PATH}')` } as CSSProperties}
      />
    </svg>
  );
}
