"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Pencil } from "lucide-react";
import ExcalidrawCanvas, {
  type ExcalidrawCanvasHandle,
} from "@/components/canvas/ExcalidrawCanvas";
import SyncStatus, { type SyncState } from "@/components/canvas/SyncStatus";
import ConflictModal from "@/components/canvas/ConflictModal";
import { loadLocal, saveLocal } from "@/lib/idb";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

interface DiagramData {
  id: string;
  title: string;
  sceneData: object;
  version: number;
  // Whether this content is confirmed saved on the server. Undefined/true
  // means yes (e.g. it just came from the server); false means it was
  // loaded from a local cache written while offline and still needs a push.
  synced?: boolean;
}

interface DiagramEditorProps {
  params: Promise<{ id: string }>;
}

export default function DiagramEditorPage({ params }: DiagramEditorProps) {
  const router = useRouter();
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("saved");
  const [showConflict, setShowConflict] = useState(false);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);
  const [diagramId, setDiagramId] = useState<string | null>(null);

  // Resolve dynamic params
  useEffect(() => {
    params.then(({ id }) => setDiagramId(id));
  }, [params]);

  // Load diagram — local cache first (instant paint, no network wait),
  // server fetch happens in the background to refresh title/version and
  // to cover the case where there's no local cache yet (new device, etc).
  useEffect(() => {
    if (!diagramId) return;
    let cancelled = false;

    async function load() {
      const local = await loadLocal(diagramId!);
      if (cancelled) return;

      if (local) {
        // We have a local copy — paint immediately, don't block on network.
        setDiagram({
          id: diagramId!,
          title: local.title ?? "Untitled Diagram",
          sceneData: local.sceneData,
          version: local.version,
          // Treat unknown as "not confirmed" — worst case is one harmless
          // extra sync attempt, which is better than silently losing edits
          // that were made offline before this field existed.
          synced: local.synced ?? false,
        });
        setTitleValue(local.title ?? "Untitled Diagram");
        setLoading(false);
      }

      // Always reconcile with the server in the background — this is the
      // source of truth for title/version even when we rendered from cache.
      try {
        const res = await fetchWithAuth(`/api/diagrams/${diagramId}`);
        if (cancelled) return;

        if (res.status === 401) {
          // Refresh already failed inside fetchWithAuth — the refresh token
          // itself is gone/expired, so this is a genuine logged-out state.
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          // Network/server hiccup — if we already painted from cache, stay
          // on that; otherwise there's nothing to show.
          if (!local) setLoading(false);
          return;
        }

        const data: DiagramData = await res.json();
        if (cancelled) return;

        // Only overwrite what's on screen if we didn't already load a local
        // copy (avoids clobbering newer local edits with a stale server
        // version — the canvas's own conflict handling covers real edits).
        if (!local) {
          setDiagram(data);
          setTitleValue(data.title);
        } else {
          // Keep the title in sync even when scene content came from cache.
          setDiagram((prev) => (prev ? { ...prev, title: data.title } : prev));
          setTitleValue((prev) => (prev === local.title ? data.title : prev));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [diagramId, router]);

  // Focus title input when renaming
  useEffect(() => {
    if (renamingTitle) {
      setTimeout(() => titleInputRef.current?.select(), 50);
    }
  }, [renamingTitle]);

  const handleTitleSave = useCallback(async () => {
    if (!diagram || !diagramId) return;
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === diagram.title) {
      setRenamingTitle(false);
      setTitleValue(diagram.title);
      return;
    }
    setRenamingTitle(false);
    const res = await fetchWithAuth(`/api/diagrams/${diagramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rename", title: trimmed }),
    });
    if (res.ok) {
      setDiagram((prev) => (prev ? { ...prev, title: trimmed } : prev));
      const local = await loadLocal(diagramId);
      await saveLocal(diagramId, local?.sceneData ?? diagram.sceneData, local?.version ?? diagram.version, trimmed);
    }
  }, [diagram, diagramId, titleValue]);

  // Conflict resolution — delegate to the canvas, which owns the live
  // scene data and server version refs (this page's copies would be stale).
  const handleKeepMine = useCallback(async () => {
    setShowConflict(false);
    await canvasRef.current?.keepMine();
  }, []);

  const handleLoadServer = useCallback(async () => {
    setShowConflict(false);
    await canvasRef.current?.loadServer();
  }, []);

  if (loading || !diagramId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Opening diagram…</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="text-lg font-medium text-foreground">Diagram not found</p>
        <p className="text-muted-foreground text-sm">
          This diagram doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div id="diagram-editor" className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Canvas toolbar */}
      <div className="h-12 border-b border-border/50 bg-card/60 backdrop-blur-md flex items-center px-4 gap-3 shrink-0 z-30">
        {/* Back */}
        <Link
          href="/"
          id="back-to-dashboard"
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        <div className="w-px h-5 bg-border" />

        {/* Title */}
        {renamingTitle ? (
          <input
            ref={titleInputRef}
            id="diagram-title-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setRenamingTitle(false);
                setTitleValue(diagram?.title ?? "");
              }
            }}
            className="text-sm font-medium bg-input border border-primary/50 rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-[200px] max-w-[400px]"
          />
        ) : (
          <button
            id="diagram-title-btn"
            onClick={() => setRenamingTitle(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors group"
          >
            {diagram?.title}
            <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sync status */}
        <SyncStatus state={syncState} />
      </div>

      {/* Canvas area */}
      {diagram && !loading && (
        <ExcalidrawCanvas
          ref={canvasRef}
          key={diagram.id} // re-mount on diagram switch
          diagramId={diagramId}
          initialSceneData={diagram.sceneData}
          initialVersion={diagram.version}
          initialSynced={diagram.synced}
          onSyncStateChange={setSyncState}
          onConflict={() => setShowConflict(true)}
        />
      )}

      {/* Conflict modal */}
      {showConflict && (
        <ConflictModal
          onKeepMine={handleKeepMine}
          onLoadServer={handleLoadServer}
        />
      )}
    </div>
  );
}
