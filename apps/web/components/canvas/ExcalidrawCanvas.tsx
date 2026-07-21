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
import { renderToStaticMarkup } from "react-dom/server";
import { Cat } from "lucide-react";
import { saveLocal, clearLocal } from "@/lib/idb";
import type { SyncState } from "@/components/canvas/SyncStatus";
import IconPicker from "@/components/canvas/IconPicker";

const ICON_COLORS = [
  "#1e1e1e", // dark gray
  "#e03131", // red
  "#2f9e44", // green
  "#1971c2", // blue
  "#fcc419", // yellow
  "#9c36b5", // purple
  "#0c8599", // cyan
  "#e8590c", // orange
  "#ffffff", // white
  "custom", // custom picker
];

// Helper to counter-act Excalidraw's dark mode color swapping for icons.
// In dark mode, Excalidraw manually inverts black to white and white to black,
// but leaves all other vibrant colors (red, blue, etc.) completely alone.
function getActualRenderColor(hex: string, appState: any, isExporting: boolean) {
  if (hex === "transparent") return hex;
  // If we are exporting, we ALWAYS want the raw, actual color embedded in the SVG,
  // because the export canvas operates without the dark-mode filters.
  if (isExporting) return hex;

  if (appState?.theme !== "dark") return hex;
  
  const lowerHex = hex.toLowerCase();
  
  // If the user specifically selects the "White" swatch (#ffffff), they expect it to look white.
  // Because Excalidraw converts #ffffff to black (#121212) in dark mode, we must trick it
  // by feeding it #1e1e1e, which Excalidraw will then faithfully invert into white (#ececec).
  if (lowerHex === "#ffffff") return "#1e1e1e";
  
  // If the user selects the "Dark" swatch (#1e1e1e), they expect it to act as the default "adaptive" color
  // (looks white in dark mode, black in light mode). We pass it through untouched so Excalidraw handles it.
  if (lowerHex === "#1e1e1e" || lowerHex === "#000000") return hex;

  // All other colors (Red, Blue, Green, etc.) are drawn verbatim. No inversion needed!
  return hex;
}

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
  () =>
    import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
  { ssr: false, loading: () => <CanvasLoading /> },
);

// Curated canvas background presets — tuned to match the app's own
// dark/violet palette rather than Excalidraw's default swatch picker.
// "Transparent" leads the list as the default — lets Excalidraw's own
// dark theme control the canvas surface so shapes render with white
// strokes on the correct dark ground without color-clash issues.
const BACKGROUND_PRESETS: { label: string; value: string }[] = [
  { label: "Auto", value: "transparent" },
  { label: "Black", value: "#000000" },
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Charcoal", value: "#18181b" },
  { label: "Slate", value: "#1e293b" },
  { label: "Paper", value: "#f5f3ee" },
  { label: "Graphite", value: "#0f0f14" },
];

const BG_PREF_KEY = "excalidraw-bg-pref";

function loadBgPref(): string {
  if (typeof window === "undefined") return BACKGROUND_PRESETS[0].value;
  return localStorage.getItem(BG_PREF_KEY) ?? BACKGROUND_PRESETS[0].value;
}

function saveBgPref(color: string) {
  localStorage.setItem(BG_PREF_KEY, color);
}

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
  { keys: "I", label: "Insert Icon" },
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
  delay: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

const ExcalidrawCanvas = forwardRef<
  ExcalidrawCanvasHandle,
  ExcalidrawCanvasProps
>(function ExcalidrawCanvas(
  {
    diagramId,
    initialSceneData,
    initialVersion,
    onSyncStateChange,
    onConflict,
  },
  ref,
) {
  // Track the server version we last successfully synced
  const serverVersionRef = useRef<number>(initialVersion);
  const sceneDataRef = useRef<object>(initialSceneData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawApiRef = useRef<any>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>(() =>
    loadBgPref(),
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeIconToInsert, setActiveIconToInsert] = useState<{
    name: string;
    component: React.ElementType;
  } | null>(null);

  const [hasSelectedIcon, setHasSelectedIcon] = useState(false);
  const [selectedIconColor, setSelectedIconColor] = useState("#ffffff");
  const lastHasSelectedIconRef = useRef(false);
  const lastSelectedIconColorRef = useRef<string | null>(null);
  const isExportingRef = useRef(false);

  const drawingIconRef = useRef<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);

  // Track mouse for opening the popover exactly at cursor
  const mousePosRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const setSyncState = useCallback(
    (state: SyncState) => onSyncStateChange?.(state),
    [onSyncStateChange],
  );

  // ── Sync to server ─────────────────────────────────────────────────────────
  // Uses a ref-to-latest-function pattern so the retry-after-refresh branch
  // can call the current version of syncToServer without a stale/TDZ
  // self-reference inside its own useCallback body.
  const syncToServerRef = useRef<
    (sceneData: object, force?: boolean) => Promise<void>
  >(async () => {});

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
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
          });
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
    [diagramId, onConflict, setSyncState],
  );

  useEffect(() => {
    syncToServerRef.current = syncToServer;
  }, [syncToServer]);

  // ── Debounced handlers ─────────────────────────────────────────────────────
  const debouncedLocalSave = useDebounce(
    async (sceneData: object) => {
      await saveLocal(diagramId, sceneData, serverVersionRef.current);
      // Mark as locally saved immediately — server sync happens separately
      // on a longer debounce. This prevents "Saving…" from lingering for 10s.
      setSyncState("saved");
    },
    1000, // 1s debounce for IDB
  );

  const debouncedServerSync = useDebounce(
    async (sceneData: object) => {
      await syncToServer(sceneData, false);
    },
    10000, // 10s idle debounce for server, per PRD §8
  );

  const initialMountRef = useRef(true);

  // Track the actual rendered color of each stamped icon
  const iconColorsRef = useRef<Record<string, string>>({});

  // ── onChange handler ───────────────────────────────────────────────────────
  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      _appState: AppState,
      _files: BinaryFiles,
    ) => {
      if (initialMountRef.current) {
        initialMountRef.current = false;
        return;
      }

      // -- Dynamic Color Syncing for Custom Icons --
      // Since Excalidraw SVGs inserted as images don't natively adapt to color
      // picker changes *after* placement, we intercept the change here. If the
      // user changes the element's stroke color, we re-render the SVG and update it!
      let needsSceneUpdate = false;
      const updatedElements = [...elements];
      const newFiles: any[] = [];

      const isExporting = _appState.openDialog?.name === "imageExport";
      if (isExporting !== isExportingRef.current) {
        isExportingRef.current = isExporting;
        needsSceneUpdate = true; // Force re-render of all SVGs to real colors!
      }

      for (let i = 0; i < updatedElements.length; i++) {
        const el = updatedElements[i];
        if (el.type === "image" && el.customData?.lucideIcon) {
          const currentTrackedColor = iconColorsRef.current[el.id];

          if (!currentTrackedColor) {
            iconColorsRef.current[el.id] = el.strokeColor;
          } else if (
            currentTrackedColor !== el.strokeColor &&
            el.strokeColor !== "transparent"
          ) {
            // User changed the color via the Excalidraw sidebar!
            iconColorsRef.current[el.id] = el.strokeColor;

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const LucideIcons = require("lucide-react");
            const IconComponent = LucideIcons[el.customData.lucideIcon];
            if (IconComponent) {
              const renderColor = getActualRenderColor(el.strokeColor, _appState, isExporting);
              const svgString = renderToStaticMarkup(
                <IconComponent
                  xmlns="http://www.w3.org/2000/svg"
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={renderColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />,
              );

              const dataURL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
              const newFileId = `icon-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

              newFiles.push({
                id: newFileId,
                dataURL,
                mimeType: "image/svg+xml",
                created: Date.now(),
              });

              updatedElements[i] = {
                ...el,
                fileId: newFileId,
                version: el.version + 1,
                versionNonce: Math.floor(Math.random() * 2147483648),
              };
              needsSceneUpdate = true;
            }
          }
        }
      }

      // -- Expose color picker UI state for selected icons --
      const currentlyHasSelectedIcon = updatedElements.some(
        (el: any) =>
          _appState.selectedElementIds[el.id] &&
          el.type === "image" &&
          el.customData?.lucideIcon,
      );

      let newSelectedColor = null;
      for (const el of updatedElements) {
        if (
          _appState.selectedElementIds[el.id] &&
          el.type === "image" &&
          el.customData?.lucideIcon
        ) {
          newSelectedColor = el.strokeColor;
          break;
        }
      }

      if (currentlyHasSelectedIcon !== lastHasSelectedIconRef.current) {
        lastHasSelectedIconRef.current = currentlyHasSelectedIcon;
        setHasSelectedIcon(currentlyHasSelectedIcon);
      }

      if (
        newSelectedColor &&
        newSelectedColor !== lastSelectedIconColorRef.current
      ) {
        lastSelectedIconColorRef.current = newSelectedColor;
        setSelectedIconColor(newSelectedColor);
      }

      if (needsSceneUpdate && excalidrawApiRef.current) {
        if (newFiles.length > 0) {
          excalidrawApiRef.current.addFiles(newFiles);
        }
        // Don't commit to history here to avoid breaking the undo stack while dragging the color picker
        excalidrawApiRef.current.updateScene({ elements: updatedElements });
        return; // Let the next onChange pass through for saving
      }

      const sceneData = {
        elements,
        // We don't persist appState to avoid locking viewport across sessions
      };
      sceneDataRef.current = sceneData;
      // Show "Saving…" only briefly — debouncedLocalSave will resolve it
      // to "Saved" once IDB write completes (~1 s), not after 10 s.
      setSyncState("saving");
      debouncedLocalSave(sceneData);
      debouncedServerSync(sceneData);
    },
    [debouncedLocalSave, debouncedServerSync, setSyncState],
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
          (data.sceneData as { elements?: ExcalidrawElement[] })?.elements ??
          [];
        excalidrawApiRef.current?.updateScene({ elements });
        setSyncState("saved");
      },
    }),
    [diagramId, syncToServer, setSyncState],
  );

  // ── Force-flush on tab hide / page unload ──────────────────────────────────
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        const data = sceneDataRef.current;
        if (data) {
          // Synchronous IDB flush for local persistence
          saveLocal(diagramId, data, serverVersionRef.current).catch(console.error);
        }

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
          { type: "application/json" },
        );
        navigator.sendBeacon(`/api/diagrams/${diagramId}`, blob);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
      // Final flush on unmount
      if (sceneDataRef.current) {
        saveLocal(diagramId, sceneDataRef.current, serverVersionRef.current).catch(console.error);
      }
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
    files?: Record<string, any>;
  }>(() => {
    const savedBg = loadBgPref();
    const elements =
      (initialSceneData as { elements?: ExcalidrawElement[] }).elements ?? [];
    const files: Record<string, any> = {};

    // Reconstruct missing binary SVG files for custom icons since we don't persist them to save space
    for (const el of elements) {
      if (el.type === "image" && el.customData?.lucideIcon) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const LucideIcons = require("lucide-react");
        const IconComponent = LucideIcons[el.customData.lucideIcon];
        if (IconComponent) {
          const renderColor = getActualRenderColor(
            el.strokeColor,
            { theme: "dark" },
            false,
          );
          const svgString = renderToStaticMarkup(
            <IconComponent
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill="none"
              stroke={renderColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />,
          );
          const dataURL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
          files[el.fileId!] = {
            id: el.fileId!,
            dataURL,
            mimeType: "image/svg+xml",
            created: Date.now(),
          };
        }
      }
    }

    return {
      elements,
      files,
      appState: {
        // Use the user's saved preference; "transparent" defers to Excalidraw's
        // own dark-theme canvas color so white-stroke shapes look correct.
        viewBackgroundColor: savedBg,
        theme: "dark",
        gridModeEnabled: true,
        gridSize: GRID_SIZE,
      },
    };
  });

  // ── Custom canvas background color ──────────────────────────────────────────
  const applyBackground = useCallback((color: string) => {
    setBackgroundColor(color);
    saveBgPref(color); // persist preference across sessions
    excalidrawApiRef.current?.updateScene({
      appState: { viewBackgroundColor: color },
    });
  }, []);

  const handleIconColorChange = useCallback((color: string) => {
    const excalidrawAPI = excalidrawApiRef.current;
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const updatedElements = elements.map((el: any) => {
      if (
        excalidrawAPI.getAppState().selectedElementIds[el.id] &&
        el.type === "image" &&
        el.customData?.lucideIcon
      ) {
        return {
          ...el,
          strokeColor: color,
          version: el.version + 1,
        };
      }
      return el;
    });
    excalidrawAPI.updateScene({
      elements: updatedElements,
      commitToHistory: true,
    });
  }, []);

  const cycleBackground = useCallback(() => {
    const idx = BACKGROUND_PRESETS.findIndex(
      (p) => p.value === backgroundColor,
    );
    const next = BACKGROUND_PRESETS[(idx + 1) % BACKGROUND_PRESETS.length];
    applyBackground(next.value);
  }, [backgroundColor, applyBackground]);

  // ── Handle Insert Icon (Stamp Mode) ───────────────────────────────────────
  const handleSelectIcon = useCallback(
    (name: string, IconComponent: React.ElementType) => {
      setActiveIconToInsert({ name, component: IconComponent });
      setIconPickerPos(null);
    },
    [],
  );

  const handlePointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      if (activeIconToInsert) {
        e.preventDefault();
        e.stopPropagation();

        const excalidrawAPI = excalidrawApiRef.current;
        if (!excalidrawAPI) {
          setActiveIconToInsert(null);
          return;
        }

        const appState = excalidrawAPI.getAppState();
        const zoom = appState.zoom.value;
        const scrollX = appState.scrollX;
        const scrollY = appState.scrollY;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const startX = (e.clientX - rect.left) / zoom - scrollX;
        const startY = (e.clientY - rect.top) / zoom - scrollY;

        const strokeColor = appState.currentItemStrokeColor || "#1e1e1e";
        const isExporting = appState.openDialog?.name === "imageExport";
        const renderColor = getActualRenderColor(strokeColor, appState, isExporting);

        const svgString = renderToStaticMarkup(
          <activeIconToInsert.component
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke={renderColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />,
        );

        const dataURL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
        const fileId = `icon-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const elementId = `icon_element_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        excalidrawAPI.addFiles([
          {
            id: fileId,
            dataURL,
            mimeType: "image/svg+xml",
            created: Date.now(),
          },
        ]);

        const newElement = {
          type: "image",
          id: elementId,
          fileId,
          status: "saved",
          width: 0,
          height: 0,
          x: startX,
          y: startY,
          angle: 0,
          strokeColor: strokeColor, // Set this so Excalidraw's color picker shows the correct color when selected!
          backgroundColor: "transparent",
          fillStyle: "hachure",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: Math.floor(Math.random() * 2147483648),
          version: 1,
          versionNonce: Math.floor(Math.random() * 2147483648),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
          customData: {
            lucideIcon: activeIconToInsert.name,
          },
        };

        drawingIconRef.current = { id: elementId, startX, startY };

        const currentElements = excalidrawAPI.getSceneElements();
        excalidrawAPI.updateScene({
          elements: [...currentElements, newElement],
        });

        // Handle drawing bounds via drag
        const handlePointerMove = (moveEv: PointerEvent) => {
          const moveZoom = excalidrawAPI.getAppState().zoom.value;
          const moveScrollX = excalidrawAPI.getAppState().scrollX;
          const moveScrollY = excalidrawAPI.getAppState().scrollY;

          const currentX =
            (moveEv.clientX - rect.left) / moveZoom - moveScrollX;
          const currentY = (moveEv.clientY - rect.top) / moveZoom - moveScrollY;

          const elWidth = currentX - startX;
          const elHeight = currentY - startY;

          const latestElements = excalidrawAPI.getSceneElements();
          const updatedElements = latestElements.map((el: any) => {
            if (el.id === elementId) {
              // Keep aspect ratio roughly 1:1 using the max dimension
              const size = Math.max(Math.abs(elWidth), Math.abs(elHeight));
              return {
                ...el,
                x: elWidth < 0 ? startX - size : startX,
                y: elHeight < 0 ? startY - size : startY,
                width: size,
                height: size,
                version: el.version + 1,
              };
            }
            return el;
          });

          excalidrawAPI.updateScene({ elements: updatedElements });
        };

        const handlePointerUp = (upEv: PointerEvent) => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);

          const latestElements = excalidrawAPI.getSceneElements();
          const finalElements = latestElements.map((el: any) => {
            if (el.id === elementId) {
              // If it was just a tiny click instead of a drag, assign a nice default size
              if (el.width < 15 && el.height < 15) {
                return {
                  ...el,
                  x: startX - 40,
                  y: startY - 40,
                  width: 80,
                  height: 80,
                  version: el.version + 1,
                };
              }
            }
            return el;
          });

          excalidrawAPI.updateScene({
            elements: finalElements,
            commitToHistory: true,
          });

          drawingIconRef.current = null;

          // Clear tool unless shift is held
          if (!upEv.shiftKey) {
            setActiveIconToInsert(null);
          }
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      }
    },
    [activeIconToInsert],
  );

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

      if (e.key === "Escape" && activeIconToInsert) {
        e.preventDefault();
        e.stopPropagation();
        setActiveIconToInsert(null);
        return;
      }

      if (e.key === "Escape" && iconPickerPos) {
        e.preventDefault();
        e.stopPropagation();
        setIconPickerPos(null);
        return;
      }

      if ((e.key === "i" || e.key === "I") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        setIconPickerPos((prev) => (prev ? null : { ...mousePosRef.current }));
        setShowShortcuts(false);
        setActiveIconToInsert(null);
        return;
      }

      if ((e.key === "b" || e.key === "B") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        cycleBackground();
        return;
      }
    },
    [showShortcuts, cycleBackground],
  );

  return (
    <div
      id="excalidraw-wrapper"
      className="dstudio-canvas flex-1 h-full relative"
      onKeyDownCapture={handleKeyDownCapture}
      onPointerDownCapture={handlePointerDownCapture}
      style={{ cursor: activeIconToInsert ? "crosshair" : undefined }}
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
          <div className="flex items-center gap-2">
            {/* Custom Icon Button inside Excalidraw's UI */}
            <div className="flex items-center gap-1.5 bg-card/90 border border-border/60 rounded-lg p-1 backdrop-blur-md shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setShowShortcuts(false);
                  setIconPickerPos((prev) =>
                    prev ? null : { x: window.innerWidth / 2 - 160, y: 100 },
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all font-medium ${
                  activeIconToInsert || iconPickerPos
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-secondary text-foreground"
                }`}
                title="Insert Icon (I)"
              >
                <Cat className="w-4 h-4" />
                <span>Icons</span>
              </button>
            </div>

            {/* Background Presets */}
            <div className="flex items-center gap-1.5 bg-card/90 border border-border/60 rounded-lg px-2 py-1.5 backdrop-blur-md shadow-sm">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-0.5">
                Background
              </span>
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={`${preset.label}${preset.value !== "transparent" ? ` (${preset.value})` : " – use Excalidraw dark theme default"}`}
                  onClick={() => applyBackground(preset.value)}
                  className="w-5 h-5 rounded-md border transition-transform hover:scale-110 relative overflow-hidden"
                  style={{
                    // Checkerboard for the transparent/Auto preset
                    background:
                      preset.value === "transparent"
                        ? "repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 0 0 / 8px 8px"
                        : preset.value,
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
          </div>
        )}
      />

      {/* Floating Left Color Picker (below Excalidraw's native properties panel) */}
      {hasSelectedIcon && (
        <div
          className="absolute left-4 top-[400px] z-[5] flex flex-col gap-3 p-3 bg-card border border-border/60 rounded-xl shadow-sm animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()} // prevent drawing behind the panel
        >
          <span className="text-[11px] font-semibold text-foreground tracking-wide uppercase">
            Icon Color
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {ICON_COLORS.map((color) =>
              color === "custom" ? (
                <div
                  key="custom"
                  className="relative w-6 h-6 rounded-md border border-border overflow-hidden hover:scale-110 transition-transform"
                >
                  <input
                    type="color"
                    value={
                      selectedIconColor === "transparent" ||
                      selectedIconColor === "custom"
                        ? "#ffffff"
                        : selectedIconColor
                    }
                    onChange={(e) => handleIconColorChange(e.target.value)}
                    className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                    title="Custom color"
                  />
                </div>
              ) : (
                <button
                  key={color}
                  onClick={() => handleIconColorChange(color)}
                  className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                    selectedIconColor === color
                      ? "ring-2 ring-primary ring-offset-1 border-transparent scale-110"
                      : "border-border/50"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ),
            )}
          </div>
        </div>
      )}

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
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-xs">
                ?
              </kbd>{" "}
              anytime to toggle this panel.
            </p>
            <div className="space-y-2">
              {SHORTCUT_HINTS.map((s) => (
                <div
                  key={s.keys}
                  className="flex items-center justify-between text-sm"
                >
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

      {/* Icon Picker popover */}
      {iconPickerPos && (
        <IconPicker
          position={iconPickerPos}
          onSelect={handleSelectIcon}
          onClose={() => setIconPickerPos(null)}
        />
      )}
    </div>
  );
});

export default ExcalidrawCanvas;
