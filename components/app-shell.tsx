"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";

export function AppShell({
  children,
  topbarPlaceholder,
}: {
  children: React.ReactNode;
  topbarPlaceholder?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="md:grid md:min-h-screen md:grid-cols-[240px_1fr]">
      <Sidebar drawerOpen={drawerOpen} onCloseDrawer={() => setDrawerOpen(false)} />
      <div className="min-w-0">
        <Topbar
          placeholder={topbarPlaceholder}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="px-4 py-8 md:px-8 md:py-12 max-w-350 mx-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
