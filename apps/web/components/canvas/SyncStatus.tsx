"use client";

import { Cloud, CloudOff, Check, AlertTriangle, Loader2 } from "lucide-react";

export type SyncState = "saved" | "saving" | "syncing" | "conflict" | "offline";

interface SyncStatusProps {
  state: SyncState;
}

const stateConfig: Record<
  SyncState,
  { icon: React.ElementType; label: string; className: string }
> = {
  saved: {
    icon: Check,
    label: "Saved",
    className: "text-emerald-400",
  },
  saving: {
    icon: Loader2,
    label: "Saving…",
    className: "text-muted-foreground",
  },
  syncing: {
    icon: Cloud,
    label: "Syncing…",
    className: "text-primary",
  },
  conflict: {
    icon: AlertTriangle,
    label: "Conflict!",
    className: "text-amber-400",
  },
  offline: {
    icon: CloudOff,
    label: "Offline",
    className: "text-muted-foreground",
  },
};

export default function SyncStatus({ state }: SyncStatusProps) {
  const { icon: Icon, label, className } = stateConfig[state];

  return (
    <div
      id="sync-status"
      className={`flex items-center gap-1.5 text-xs font-medium ${className} transition-all`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${state === "saving" || state === "syncing" ? "animate-spin" : ""}`}
      />
      <span>{label}</span>
    </div>
  );
}
