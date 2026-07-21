"use client";
import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { saveLocal, loadLocal, clearLocal } from "@/lib/idb";
import type { SyncState } from "@/components/canvas/SyncStatus";
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

function CanvasLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1a1a2e]">
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

  const setSyncState = useCallback(
    (state: SyncState) => onSyncStateChange?.(state),
    [onSyncStateChange],
  );

  // ── Sync to server ─────────────────────────────────────────────────────────
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
          // Token expired — try refresh
          await fetch("/api/auth/refresh", { method: "POST" });
          // Retry once
          await syncToServer(sceneData, force);
        }
      } catch {
        setSyncState("offline");
      }
    },
    [diagramId, onConflict, setSyncState],
  );

  // ── Debounced handlers ─────────────────────────────────────────────────────
  const debouncedLocalSave = useDebounce(
    async (sceneData: object) => {
      await saveLocal(diagramId, sceneData, serverVersionRef.current);
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

      const sceneData = {
        elements,
        // We don't persist appState to avoid locking viewport across sessions
      };
      sceneDataRef.current = sceneData;
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
    };
  }, [diagramId]);

  // ── Initial scene — prefer IDB (faster), fall back to server data ──────────
  const [initialData, setInitialData] = useState<{
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
  }>({
    elements:
      (initialSceneData as { elements?: ExcalidrawElement[] }).elements ?? [],
    appState: {
      viewBackgroundColor: "#1a1a2e",
      theme: "dark",
    },
  });

  useEffect(() => {
    loadLocal(diagramId).then((local) => {
      if (local && local.sceneData) {
        const localScene = local.sceneData as {
          elements?: ExcalidrawElement[];
        };
        setInitialData((prev) => ({
          ...prev,
          elements: localScene.elements ?? [],
        }));
      }
    });
  }, [diagramId]);

  return (
    <div id="excalidraw-wrapper" className="flex-1 h-full">
      <Excalidraw
        excalidrawAPI={(api) => {
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
      />
    </div>
  );
});

export default ExcalidrawCanvas;
