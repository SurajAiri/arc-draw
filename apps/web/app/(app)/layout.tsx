import Link from "next/link";
import { Layers } from "lucide-react";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
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

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
