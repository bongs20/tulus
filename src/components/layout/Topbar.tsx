'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Fetch pending sanggahan count for notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/sanggahan?status=PENDING');
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/antrian?search=${encodeURIComponent(searchTerm)}`);
    }
  };

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
          <form onSubmit={handleSearch} className="relative hidden w-full max-w-md sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">search</span>
            <input
              type="text"
              placeholder="Cari NIK atau Nama di Antrian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-ring/40"
            />
          </form>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sanggahan">
            <button className="relative rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button" title="Sanggahan Baru">
              <span className="material-symbols-outlined">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          </Link>
          <Link href="/publik">
            <button className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button" title="Lihat Portal Publik">
              <span className="material-symbols-outlined">help</span>
            </button>
          </Link>
          <Link href="/pengaturan">
            <button className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted" type="button" title="Pengaturan">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </Link>
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
