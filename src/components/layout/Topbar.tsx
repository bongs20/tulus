'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';

export function Topbar() {
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
        <div className="flex flex-1 items-center gap-4">
          <button
            type="button"
            className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
            onClick={() => setOpenMobile(true)}
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative hidden w-full max-w-md sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">search</span>
            <input
              type="text"
              placeholder="Cari data penerima..."
              className="w-full rounded border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-50 flex bg-black/30 md:hidden" onClick={() => setOpenMobile(false)}>
          <div className="h-full" onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile onNavigate={() => setOpenMobile(false)} />
          </div>
        </div>
      )}
    </>
  );
}
