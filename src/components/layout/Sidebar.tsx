'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
}

const sidebarLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR'] },
  { href: '/antrian', label: 'Antrian Verifikasi', icon: 'fact_check', roles: ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR'] },
  { href: '/penyaluran', label: 'Penyaluran Bantuan', icon: 'volunteer_activism', roles: ['ADMINISTRATOR', 'PETUGAS_VERIFIKATOR'] },
  { href: '/laporan', label: 'Laporan', icon: 'analytics', roles: ['ADMINISTRATOR', 'KEPALA_BIDANG'] },
  { href: '/pengaturan', label: 'Pengaturan', icon: 'settings', roles: ['ADMINISTRATOR'] },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredLinks = sidebarLinks.filter((link) => userRole && link.roles.includes(userRole));

  return (
    <aside
      className={cn(
        'h-screen w-64 border-r border-border bg-card',
        mobile ? 'flex flex-col' : 'hidden md:flex md:flex-col'
      )}
    >
      <div className="px-6 py-6">
        <h1 className="text-lg font-black text-primary">TULUS</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Social Services Management</p>
      </div>

      <nav className="space-y-1 px-4">
        {filteredLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2 text-sm transition-all duration-200',
                active
                  ? 'border-r-4 border-primary bg-secondary font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground">{session?.user?.role || '-'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-3 flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Keluar
        </button>
      </div>
    </aside>
  );
}
