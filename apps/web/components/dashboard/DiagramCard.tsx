"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Pencil,
  FileType,
  Loader2,
} from "lucide-react";

interface DiagramCardProps {
  id: string;
  title: string;
  updatedAt: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DiagramCard({
  id,
  title,
  updatedAt,
  onDelete,
  onDuplicate,
  onRename,
}: DiagramCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when renaming
  useEffect(() => {
    if (renaming) {
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [renaming]);

  async function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === title) {
      setRenaming(false);
      setRenameValue(title);
      return;
    }
    setBusy(true);
    await onRename(id, trimmed);
    setRenaming(false);
    setBusy(false);
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    await onDelete(id);
  }

  async function handleDuplicate() {
    setMenuOpen(false);
    setBusy(true);
    await onDuplicate(id);
    setBusy(false);
  }

  return (
    <div
      id={`diagram-card-${id}`}
      className="group relative glass rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer overflow-hidden"
      onClick={() => {
        if (!menuOpen && !renaming) router.push(`/diagram/${id}`);
      }}
    >
      {/* Diagram preview area */}
      <div className="h-36 bg-gradient-to-br from-secondary/50 to-accent/30 flex items-center justify-center border-b border-border/30">
        <div className="opacity-20 group-hover:opacity-30 transition-opacity">
          <FileType className="w-12 h-12 text-primary" />
        </div>
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Card footer */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              ref={inputRef}
              id={`rename-input-${id}`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setRenaming(false);
                  setRenameValue(title);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium bg-input border border-primary/50 rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          ) : (
            <p className="text-sm font-medium text-foreground truncate">{title}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {timeAgo(updatedAt)}
          </p>
        </div>

        {/* Actions menu */}
        <div className="relative" ref={menuRef}>
          <button
            id={`diagram-menu-${id}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-40 glass rounded-xl border border-border shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
              <button
                id={`rename-btn-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setRenaming(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Rename
              </button>
              <button
                id={`duplicate-btn-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <div className="h-px bg-border mx-2 my-1" />
              <button
                id={`delete-btn-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
