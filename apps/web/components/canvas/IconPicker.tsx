import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Developer and Architecture focused icons
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

export default function IconPicker({
  position,
  onSelect,
  onClose,
}: {
  position: { x: number, y: number };
  onSelect: (iconName: string, IconComponent: React.ElementType) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure modal is rendered before focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return availableIcons;
    const lower = search.toLowerCase();
    return availableIcons.filter((name) => name.toLowerCase().includes(lower));
  }, [search]);

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
        className="fixed z-[200] glass rounded-xl border border-border/60 flex flex-col w-[320px] shadow-2xl h-[360px] bg-card/95 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
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
              placeholder="Search developer icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-5 gap-2 content-start">
          {filteredIcons.map((name) => {
            const Icon = (LucideIcons as any)[name];
            return (
              <button
                key={name}
                onClick={() => onSelect(name, Icon)}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-primary/20 hover:text-primary text-foreground border border-transparent hover:border-primary/30 transition-all"
                title={name}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
              No icons found for "{search}"
            </div>
          )}
        </div>
      </div>
    </>
  );
}
