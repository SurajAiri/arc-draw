import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Developer and Architecture focused icons — shown instantly with no network
// call, both as the default grid and as priority matches while searching.
const DEV_ICONS = [
  // Infrastructure / Cloud
  "Server", "Database", "HardDrive", "Cpu", "Cloud", "CloudLightning", "CloudRain", "Zap", "Network", "Wifi", "Globe",
  // Code / Development
  "Code", "Terminal", "TerminalSquare", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest", "Webhook", "Box", "Layers", "Layout",
  // Files
  "FileJson", "FileCode", "FileText", "Folder", "Archive",
  // Devices
  "Monitor", "Laptop", "Smartphone", "Tablet", "Tv", "Watch",
  // Security
  "Shield", "Lock", "Unlock", "Key",
  // UI / General
  "User", "Users", "Settings", "Search", "Mail", "Bell", "Calendar", "Home", "Activity", "Link", "ExternalLink", "Share", "Trash", "Edit", "Plus", "Minus", "Check", "X", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
  // Social / Brands (Lucide has limited brands natively, but includes a few)
  "Github", "Gitlab", "Trello", "Slack", "Figma", "Framer", "Twitter", "Youtube", "Linkedin", "Instagram", "Facebook", "Twitch"
];

// Verify they exist in lucide-react to prevent runtime errors
const availableIcons = DEV_ICONS.filter(name => (LucideIcons as any)[name]);

// The result of picking an icon — either a bundled Lucide icon (rendered
// live, no network needed) or an Iconify icon. For Iconify we hand back the
// raw SVG template (with `currentColor` placeholders) fetched once at
// selection time, so the canvas never needs to hit the network again to
// recolor or reload it.
export type PickedIcon =
  | { kind: "lucide"; name: string }
  | { kind: "iconify"; id: string; svgTemplate: string };

const ICONIFY_SEARCH_URL = "https://api.iconify.design/search";
const ICONIFY_ICON_URL = "https://api.iconify.design";

function iconifyThumbnailSrc(iconId: string) {
  // Iconify bakes the color directly into the returned SVG for monochrome
  // icons, so a plain <img> works fine as a thumbnail — cheap, cached by
  // the browser, no extra fetch/parse work on our side.
  const [prefix, name] = iconId.split(":");
  return `${ICONIFY_ICON_URL}/${prefix}/${name}.svg?height=22&color=%23d4d4d8`;
}

// Small debounce hook local to this component.
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function IconPicker({
  position,
  onSelect,
  onClose,
}: {
  position: { x: number, y: number };
  onSelect: (icon: PickedIcon) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Iconify search state
  const [iconifyResults, setIconifyResults] = useState<string[]>([]);
  const [iconifyLoading, setIconifyLoading] = useState(false);
  const [iconifyError, setIconifyError] = useState(false);
  // Icon ids currently being fetched for insertion (disables the button briefly)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);

  useEffect(() => {
    // Small delay to ensure modal is rendered before focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const filteredLucideIcons = useMemo(() => {
    if (!debouncedSearch) return availableIcons;
    const lower = debouncedSearch.toLowerCase();
    return availableIcons.filter((name) => name.toLowerCase().includes(lower));
  }, [debouncedSearch]);

  // Search the Iconify API (200,000+ icons across every major open-source
  // icon set) whenever the query changes. Skipped entirely when the search
  // box is empty — the curated Lucide grid above covers that case for free.
  useEffect(() => {
    if (!debouncedSearch) {
      setIconifyResults([]);
      setIconifyLoading(false);
      setIconifyError(false);
      return;
    }

    const controller = new AbortController();
    setIconifyLoading(true);
    setIconifyError(false);

    fetch(
      `${ICONIFY_SEARCH_URL}?query=${encodeURIComponent(debouncedSearch)}&limit=64`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Iconify search failed");
        return res.json();
      })
      .then((data: { icons?: string[] }) => {
        setIconifyResults(data.icons ?? []);
        setIconifyLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setIconifyError(true);
        setIconifyLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  const handleSelectLucide = (name: string) => {
    onSelect({ kind: "lucide", name });
  };

  const handleSelectIconify = async (iconId: string) => {
    if (pendingSelection) return;
    setPendingSelection(iconId);
    try {
      const [prefix, name] = iconId.split(":");
      const res = await fetch(`${ICONIFY_ICON_URL}/${prefix}/${name}.svg`);
      if (!res.ok) throw new Error("Failed to fetch icon");
      const svgTemplate = await res.text();
      onSelect({ kind: "iconify", id: iconId, svgTemplate });
    } catch {
      setPendingSelection(null);
    }
  };

  // Adjust position to avoid screen overflow
  const [pos, setPos] = useState(position);
  useEffect(() => {
    if (pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      let newX = position.x;
      let newY = position.y;
      
      // Add a small offset so the cursor isn't directly on top of the modal
      newX += 10;
      newY += 10;

      if (newX + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 20;
      }
      if (newY + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 20;
      }
      
      setPos({ x: Math.max(10, newX), y: Math.max(10, newY) });
    }
  }, [position]);

  const showIconifySection = debouncedSearch.length > 0;
  const noResults =
    debouncedSearch &&
    !iconifyLoading &&
    filteredLucideIcons.length === 0 &&
    iconifyResults.length === 0;

  return (
    <>
      <div 
        className="fixed inset-0 z-[190]" 
        onClick={onClose} 
        onContextMenu={(e) => { e.preventDefault(); onClose(); }} 
      />
      <div 
        ref={pickerRef}
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-[200] glass rounded-xl border border-border/60 flex flex-col w-[320px] shadow-2xl h-[400px] bg-card/95 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="p-3 border-b border-border/60 bg-secondary/30">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 200,000+ icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Lucide matches — instant, no network */}
          {filteredLucideIcons.length > 0 && (
            <div className="grid grid-cols-5 gap-2 content-start mb-1">
              {filteredLucideIcons.map((name) => {
                const Icon = (LucideIcons as any)[name];
                return (
                  <button
                    key={`lucide-${name}`}
                    onClick={() => handleSelectLucide(name)}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/20 hover:text-primary text-foreground border border-transparent hover:border-primary/30 transition-all"
                    title={name}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Iconify matches — larger library, fetched on demand */}
          {showIconifySection && iconifyResults.length > 0 && (
            <>
              {filteredLucideIcons.length > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">More icons</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              )}
              <div className="grid grid-cols-5 gap-2 content-start">
                {iconifyResults.map((iconId) => (
                  <button
                    key={iconId}
                    onClick={() => handleSelectIconify(iconId)}
                    disabled={pendingSelection === iconId}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/20 hover:text-primary text-foreground border border-transparent hover:border-primary/30 transition-all disabled:opacity-40"
                    title={iconId}
                  >
                    {pendingSelection === iconId ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconifyThumbnailSrc(iconId)} alt={iconId} width={20} height={20} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {showIconifySection && iconifyLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching more icons…
            </div>
          )}

          {showIconifySection && iconifyError && !iconifyLoading && (
            <div className="text-center py-4 text-muted-foreground text-xs">
              Couldn&apos;t reach the icon library — check your connection.
            </div>
          )}

          {noResults && (
            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
              No icons found for &quot;{debouncedSearch}&quot;
            </div>
          )}
        </div>
      </div>
    </>
  );
}
