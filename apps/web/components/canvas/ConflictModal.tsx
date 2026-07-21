"use client";

import { AlertTriangle, RefreshCw, Save } from "lucide-react";

interface ConflictModalProps {
  onKeepMine: () => void;
  onLoadServer: () => void;
}

export default function ConflictModal({
  onKeepMine,
  onLoadServer,
}: ConflictModalProps) {
  return (
    <div
      id="conflict-modal-overlay"
      className="fixed inset-0 z-[999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div
        id="conflict-modal"
        className="glass rounded-2xl border border-amber-500/30 p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-2">
          Sync Conflict Detected
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          This diagram was modified in another tab or session. Your local
          changes conflict with the server version. Choose how to resolve this:
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="conflict-keep-mine"
            onClick={onKeepMine}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
          >
            <Save className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-medium text-foreground">Keep mine</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overwrite server with local changes
              </p>
            </div>
          </button>

          <button
            id="conflict-load-server"
            onClick={onLoadServer}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-secondary transition-colors text-center group"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
            <div>
              <p className="text-sm font-medium text-foreground">Load server</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Discard local, load server version
              </p>
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground/70 mt-4 text-center">
          Tip: &ldquo;Keep mine&rdquo; will force-write your version to the server.
        </p>
      </div>
    </div>
  );
}
