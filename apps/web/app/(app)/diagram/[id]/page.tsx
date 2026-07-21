"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Pencil } from "lucide-react";
import ExcalidrawCanvas from "@/components/canvas/ExcalidrawCanvas";
import SyncStatus, { type SyncState } from "@/components/canvas/SyncStatus";
import ConflictModal from "@/components/canvas/ConflictModal";
import { clearLocal } from "@/lib/idb";

interface DiagramData {
  id: string;
  title: string;
  sceneData: object;
  version: number;
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
  const sceneDataRef = useRef<object>({});
  const serverVersionRef = useRef<number>(0);
  const [diagramId, setDiagramId] = useState<string | null>(null);

  // Resolve dynamic params
  useEffect(() => {
    params.then(({ id }) => setDiagramId(id));
  }, [params]);

  // Fetch diagram from server
  useEffect(() => {
    if (!diagramId) return;
    fetch(`/api/diagrams/${diagramId}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: DiagramData | null) => {
        if (!data) return;
        setDiagram(data);
        setTitleValue(data.title);
        sceneDataRef.current = data.sceneData;
        serverVersionRef.current = data.version;
      })
      .finally(() => setLoading(false));
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
    const res = await fetch(`/api/diagrams/${diagramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rename", title: trimmed }),
    });
    if (res.ok) {
      setDiagram((prev) => (prev ? { ...prev, title: trimmed } : prev));
    }
  }, [diagram, diagramId, titleValue]);

  // Conflict resolution
  const handleKeepMine = useCallback(async () => {
    if (!diagramId) return;
    setShowConflict(false);
    setSyncState("syncing");
    const res = await fetch(`/api/diagrams/${diagramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "sync",
        sceneData: sceneDataRef.current,
        version: serverVersionRef.current,
        force: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      serverVersionRef.current = data.version;
      setSyncState("saved");
    }
  }, [diagramId]);

  const handleLoadServer = useCallback(async () => {
    if (!diagramId) return;
    setShowConflict(false);
    setLoading(true);
    const res = await fetch(`/api/diagrams/${diagramId}`);
    if (res.ok) {
      const data: DiagramData = await res.json();
      await clearLocal(diagramId);
      serverVersionRef.current = data.version;
      setDiagram(data);
      setSyncState("saved");
    }
    setLoading(false);
  }, [diagramId]);

  if (loading || !diagramId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a2e] text-slate-400">
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
          key={diagram.id} // re-mount on diagram switch
          diagramId={diagramId}
          initialSceneData={diagram.sceneData}
          initialVersion={diagram.version}
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
