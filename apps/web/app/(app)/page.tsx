"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, LayoutGrid, Layers } from "lucide-react";
import DiagramCard from "@/components/dashboard/DiagramCard";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

interface DiagramMeta {
  id: string;
  title: string;
  updatedAt: string;
  version: number;
}

import LogoutButton from "@/components/dashboard/LogoutButton";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchDiagrams = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/diagrams");
      if (res.status === 401) {
        // Access token AND the 30-day refresh token are both no good —
        // this is a real logged-out state, not just routine token rotation.
        router.push("/login");
        return;
      }
      const data = await res.json();
      setDiagrams(data);
    } catch {
      setError("Failed to load diagrams");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetchWithAuth("/api/diagrams", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const diagram = await res.json();
      router.push(`/diagram/${diagram.id}`);
    } catch {
      setError("Failed to create diagram");
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
    const res = await fetchWithAuth(`/api/diagrams/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete diagram");
      fetchDiagrams(); // re-fetch to restore state
    }
  }

  async function handleDuplicate(id: string) {
    const res = await fetchWithAuth(`/api/diagrams/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      setError("Failed to duplicate diagram");
      return;
    }
    fetchDiagrams();
  }

  async function handleRename(id: string, title: string) {
    setDiagrams((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title } : d))
    );
    const res = await fetchWithAuth(`/api/diagrams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rename", title }),
    });
    if (!res.ok) {
      setError("Failed to rename diagram");
      fetchDiagrams();
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top nav */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight gradient-text">
            Diagram Studio
          </span>
        </Link>

        <div className="ml-auto">
          <LogoutButton />
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-primary" />
            My Diagrams
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {diagrams.length > 0
              ? `${diagrams.length} diagram${diagrams.length !== 1 ? "s" : ""}`
              : "No diagrams yet — create your first one"}
          </p>
        </div>

        <button
          id="create-diagram-btn"
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New diagram
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-4 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : diagrams.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Layers className="w-10 h-10 text-primary/50" />
          </div>
          <div>
            <p className="text-foreground font-medium">No diagrams yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Click &ldquo;New diagram&rdquo; to get started
            </p>
          </div>
          <button
            id="empty-create-btn"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all glow-primary disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create first diagram
          </button>
        </div>
      ) : (
        // Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {diagrams.map((diagram) => (
            <DiagramCard
              key={diagram.id}
              id={diagram.id}
              title={diagram.title}
              updatedAt={diagram.updatedAt}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
