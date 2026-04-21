// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client'; // Assuming Role enum is accessible

// Phosphor Icons for menu items
import { LayoutDashboard, UserPlus, ListChecks, ArrowRightLeft, ScrollText, Settings, LogOut } from '@phosphor-icons/react';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const sidebarLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMINISTRATOR', 'KEPALA_BIDANG'] },
  { href: '/input-data', label: 'Input Data', icon: UserPlus, roles: ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR'] },
  { href: '/antrian', label: 'Antrian Verifikasi', icon: ListChecks, roles: ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR'] },
  { href: '/penyaluran', label: 'Penyaluran Bantuan', icon: ArrowRightLeft, roles: ['ADMINISTRATOR', 'KEPALA_BIDANG', 'PETUGAS_VERIFIKATOR'] },
  { href: '/laporan', label: 'Laporan Akuntabilitas', icon: ScrollText, roles: ['ADMINISTRATOR', 'KEPALA_BIDANG'] },
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: ['ADMINISTRATOR'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Filter links based on user role
  const filteredLinks = sidebarLinks.filter(link => userRole && link.roles.includes(userRole));

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/" className="text-xl font-semibold text-primary">TULUS</Link>
      </div>
      <nav className="flex flex-col flex-1 px-4 py-6 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === link.href
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t p-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{session.user.name}</span>
              <span className="text-xs text-muted-foreground">{session.user.role}</span>
            </div>
          </div>
        )}
        <div className="mt-4">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
