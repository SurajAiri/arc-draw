"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { saveLocal, clearLocal } from "@/lib/idb";
import type { SyncState } from "@/components/canvas/SyncStatus";
// Required — Excalidraw ships its own stylesheet for the toolbar, panels,
// and icon sizing. Without this import the canvas renders as unstyled raw
// DOM (giant unscaled icons, no toolbar chrome, help text with no layout).
import "@excalidraw/excalidraw/index.css";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BinaryFiles = any;

// Dynamically import Excalidraw — it's browser-only (no SSR)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Excalidraw = dynamic<any>(
  () => import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
  { ssr: false, loading: () => <CanvasLoading /> }
);

// Curated canvas background presets — tuned to match the app's own
// dark/violet palette rather than Excalidraw's default swatch picker.
// "Black" leads the list since true-black dark mode is now the default.
const BACKGROUND_PRESETS: { label: string; value: string }[] = [
  { label: "Black", value: "#000000" },
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Charcoal", value: "#18181b" },
  { label: "Slate", value: "#1e293b" },
  { label: "Paper", value: "#f5f3ee" },
  { label: "Graphite", value: "#0f0f14" },
];

// Guide-only dotted grid: this is Excalidraw's built-in grid overlay, drawn
// on top of the canvas purely as a drawing aid. It is NOT a scene element,
// so it never appears in exports (PNG/SVG), never gets selected, and never
// gets saved/synced with the diagram.
const GRID_SIZE = 20;

// A handful of custom shortcuts layered on top of Excalidraw's own.
// Intercepted in the capture phase so they take priority; every other
// keystroke passes through untouched to Excalidraw's native handling.
const SHORTCUT_HINTS: { keys: string; label: string }[] = [
  { keys: "?", label: "Show this shortcuts panel" },
  { keys: "B", label: "Cycle canvas background color" },
  { keys: "Esc", label: "Close panels / deselect" },
  { keys: "V or 1", label: "Selection tool (Excalidraw default)" },
  { keys: "R or 2", label: "Rectangle (Excalidraw default)" },
  { keys: "A or 5", label: "Arrow (Excalidraw default)" },
  { keys: "Ctrl/Cmd+D", label: "Duplicate selection (Excalidraw default)" },
  { keys: "Ctrl/Cmd+G", label: "Group selection (Excalidraw default)" },
];

function CanvasLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-sm">Loading canvas…</span>
      </div>
    </div>
  );
}

interface ExcalidrawCanvasProps {
  diagramId: string;
  initialSceneData: object;
  initialVersion: number;
  onSyncStateChange?: (state: SyncState) => void;
  onConflict?: () => void;
}

export interface ExcalidrawCanvasHandle {
  /** Conflict resolution: force-write the current local scene, overwriting the server. */
  keepMine: () => Promise<void>;
  /** Conflict resolution: discard local changes and reload the server's scene into the canvas. */
  loadServer: () => Promise<void>;
}

// Debounce helper
function useDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, ExcalidrawCanvasProps>(
  function ExcalidrawCanvas(
    {
      diagramId,
      initialSceneData,
      initialVersion,
      onSyncStateChange,
      onConflict,
    },
    ref
  ) {
  // Track the server version we last successfully synced
  const serverVersionRef = useRef<number>(initialVersion);
  const sceneDataRef = useRef<object>(initialSceneData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawApiRef = useRef<any>(null);
  const [backgroundColor, setBackgroundColor] = useState(
    BACKGROUND_PRESETS[0].value
  );
  const [showShortcuts, setShowShortcuts] = useState(false);

  const setSyncState = useCallback(
    (state: SyncState) => onSyncStateChange?.(state),
    [onSyncStateChange]
  );

  // ── Sync to server ─────────────────────────────────────────────────────────
  // Uses a ref-to-latest-function pattern so the retry-after-refresh branch
  // can call the current version of syncToServer without a stale/TDZ
  // self-reference inside its own useCallback body.
  const syncToServerRef = useRef<(sceneData: object, force?: boolean) => Promise<void>>(
    async () => {}
  );

  const syncToServer = useCallback(
    async (sceneData: object, force = false) => {
      setSyncState("syncing");
      try {
        const res = await fetch(`/api/diagrams/${diagramId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "sync",
            sceneData,
            version: serverVersionRef.current,
            force,
          }),
        });

        if (res.status === 409) {
          setSyncState("conflict");
          onConflict?.();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          serverVersionRef.current = data.version;
          setSyncState("saved");
        } else if (res.status === 401) {
          // Token expired — try refresh, then retry once (only if the
          // refresh itself succeeded, otherwise we'd just 401 again).
          const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
          if (refreshRes.ok) {
            await syncToServerRef.current(sceneData, force);
          } else {
            setSyncState("offline");
          }
        } else {
          setSyncState("offline");
        }
      } catch {
        setSyncState("offline");
      }
    },
    [diagramId, onConflict, setSyncState]
  );

  useEffect(() => {
    syncToServerRef.current = syncToServer;
  }, [syncToServer]);

  // ── Debounced handlers ─────────────────────────────────────────────────────
  const debouncedLocalSave = useDebounce(
    async (sceneData: object) => {
      await saveLocal(diagramId, sceneData, serverVersionRef.current);
    },
    1000 // 1s debounce for IDB
  );

  const debouncedServerSync = useDebounce(
    async (sceneData: object) => {
      await syncToServer(sceneData, false);
    },
    10000 // 10s idle debounce for server, per PRD §8
  );

  const initialMountRef = useRef(true);

  // ── onChange handler ───────────────────────────────────────────────────────
  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      _appState: AppState,
      _files: BinaryFiles
    ) => {
      if (initialMountRef.current) {
        initialMountRef.current = false;
        return;
      }
      
      const sceneData = {
        elements,
        // We don't persist appState to avoid locking viewport across sessions
      };
      sceneDataRef.current = sceneData;
      setSyncState("saving");
      debouncedLocalSave(sceneData);
      debouncedServerSync(sceneData);
    },
    [debouncedLocalSave, debouncedServerSync, setSyncState]
  );

  // ── Imperative handle for conflict-modal resolution ─────────────────────────
  // Operates on this component's own live refs, unlike the page's stale copies.
  useImperativeHandle(
    ref,
    () => ({
      keepMine: async () => {
        setSyncState("syncing");
        await syncToServer(sceneDataRef.current, true);
      },
      loadServer: async () => {
        setSyncState("syncing");
        const res = await fetch(`/api/diagrams/${diagramId}`);
        if (!res.ok) {
          setSyncState("offline");
          return;
        }
        const data = await res.json();
        serverVersionRef.current = data.version;
        sceneDataRef.current = data.sceneData;
        await clearLocal(diagramId);
        const elements =
          (data.sceneData as { elements?: ExcalidrawElement[] })?.elements ?? [];
        excalidrawApiRef.current?.updateScene({ elements });
        setSyncState("saved");
      },
    }),
    [diagramId, syncToServer, setSyncState]
  );

  // ── Force-flush on tab hide / page unload ──────────────────────────────────
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        const data = sceneDataRef.current;
        // navigator.sendBeacon for reliable delivery on tab close
        const blob = new Blob(
          [
            JSON.stringify({
              type: "sync",
              sceneData: data,
              version: serverVersionRef.current,
              force: false,
            }),
          ],
          { type: "application/json" }
        );
        navigator.sendBeacon(`/api/diagrams/${diagramId}`, blob);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, [diagramId]);

  // ── Initial scene ────────────────────────────────────────────────────────
  // The page component has already resolved local-vs-server and picked the
  // right sceneData/version before this component is mounted, so this only
  // needs to be computed once (lazy initializer) for Excalidraw's
  // initialData prop, which it reads only on mount.
  const [initialData] = useState<{
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
  }>(() => ({
    elements:
      (initialSceneData as { elements?: ExcalidrawElement[] }).elements ?? [],
    appState: {
      viewBackgroundColor: BACKGROUND_PRESETS[0].value,
      theme: "dark",
      gridModeEnabled: true,
      gridSize: GRID_SIZE,
      currentItemStrokeColor: "#ffffff",
    },
  }));

  // ── Custom canvas background color ──────────────────────────────────────────
  const applyBackground = useCallback((color: string) => {
    setBackgroundColor(color);
    excalidrawApiRef.current?.updateScene({ appState: { viewBackgroundColor: color } });
  }, []);

  const cycleBackground = useCallback(() => {
    const idx = BACKGROUND_PRESETS.findIndex((p) => p.value === backgroundColor);
    const next = BACKGROUND_PRESETS[(idx + 1) % BACKGROUND_PRESETS.length];
    applyBackground(next.value);
  }, [backgroundColor, applyBackground]);

  // ── Custom keyboard shortcuts ────────────────────────────────────────────────
  // Runs in the capture phase on the wrapper div so it sees keys before
  // Excalidraw's own handler does. Only the keys below are intercepted —
  // everything else (Excalidraw's native shortcuts) passes through untouched.
  // We deliberately skip when focus is inside a text input/contentEditable
  // (e.g. editing a text element or renaming) so typing "b" or "?" there
  // isn't hijacked.
  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowShortcuts((v) => !v);
        return;
      }

      if (e.key === "Escape" && showShortcuts) {
        e.preventDefault();
        e.stopPropagation();
        setShowShortcuts(false);
        return;
      }

      if ((e.key === "b" || e.key === "B") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        cycleBackground();
        return;
      }
    },
    [showShortcuts, cycleBackground]
  );

  return (
    <div
      id="excalidraw-wrapper"
      className="dstudio-canvas flex-1 h-full relative"
      onKeyDownCapture={handleKeyDownCapture}
    >
      <Excalidraw
        excalidrawAPI={(api: unknown) => {
          excalidrawApiRef.current = api;
        }}
        initialData={initialData}
        onChange={handleChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: true },
          },
        }}
        renderTopRightUI={() => (
          <div className="flex items-center gap-1.5 bg-card/90 border border-border/60 rounded-lg px-2 py-1.5 backdrop-blur-md">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-0.5">
              Background
            </span>
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={`${preset.label} (${preset.value})`}
                onClick={() => applyBackground(preset.value)}
                className="w-5 h-5 rounded-md border transition-transform hover:scale-110"
                style={{
                  background: preset.value,
                  borderColor:
                    backgroundColor === preset.value
                      ? "var(--primary)"
                      : "rgba(255,255,255,0.15)",
                  outline:
                    backgroundColor === preset.value
                      ? "2px solid var(--primary)"
                      : "none",
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        )}
      />

      {/* Custom shortcuts cheat-sheet — toggled with "?" */}
      {showShortcuts && (
        <div
          id="shortcuts-panel"
          className="absolute inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="glass rounded-2xl border border-border/60 p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-xs">?</kbd> anytime to toggle this panel.
            </p>
            <div className="space-y-2">
              {SHORTCUT_HINTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono text-foreground">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }
);

export default ExcalidrawCanvas;
