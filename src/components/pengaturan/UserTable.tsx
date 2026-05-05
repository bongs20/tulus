// src/components/pengaturan/UserTable.tsx
'use client';

import { useMemo, useState } from 'react';
import { Role, StatusAkun } from '@prisma/client';
import type { tbl_pengguna } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MagnifyingGlass, PencilSimple, Trash } from '@phosphor-icons/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { toast } from 'sonner';
import useSWR from 'swr';
import { TableState } from '@/components/shared/TableState';
import type { UserFormData } from '@/components/pengaturan/UserForm';

type UserListItem = UserFormData & Pick<tbl_pengguna, 'login_attempts' | 'locked_until' | 'created_at'>;

interface UsersResponse {
  data: UserListItem[];
  total: number;
}

interface UserTableProps {
  onEditUser: (user: UserFormData) => void;
}

const fetcher = async (url: string): Promise<UsersResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Gagal memuat data pengguna.');
  }

  return response.json() as Promise<UsersResponse>;
};

const roleLabels: Record<Role, string> = {
  ADMINISTRATOR: 'Administrator',
  KEPALA_BIDANG: 'Kepala Bidang',
  PETUGAS_VERIFIKATOR: 'Petugas Verifikator',
};

const roleClassNames: Record<Role, string> = {
  ADMINISTRATOR: 'border-blue-200 bg-blue-50 text-blue-700',
  KEPALA_BIDANG: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PETUGAS_VERIFIKATOR: 'border-amber-200 bg-amber-50 text-amber-700',
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: Date | string | null) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('') || 'U';
}

function getSecurityText(user: UserListItem) {
  if (user.status_akun === StatusAkun.TERKUNCI && user.locked_until) {
    return `Terkunci sampai ${formatDate(user.locked_until)}`;
  }

  if (user.login_attempts > 0) {
    return `${user.login_attempts} percobaan gagal`;
  }

  return 'Normal';
}

export function UserTable({ onEditUser }: UserTableProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const usersUrl = useMemo(() => {
    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
    });
    const normalizedSearch = debouncedSearchTerm.trim();

    if (normalizedSearch) {
      queryParams.set('search', normalizedSearch);
    }

    return `/api/pengguna?${queryParams.toString()}`;
  }, [currentPage, debouncedSearchTerm]);

  const { data, error, isLoading, mutate } = useSWR<UsersResponse, Error>(
    usersUrl,
    fetcher,
    { refreshInterval: 5000 }
  );

  const users = data?.data || [];
  const totalUsers = data?.total || 0;
  const totalPages = Math.ceil(totalUsers / limit);
  const firstItem = totalUsers === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastItem = Math.min(currentPage * limit, totalUsers);

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/pengguna/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Pengguna berhasil dinonaktifkan.');
        void mutate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal menonaktifkan pengguna.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Terjadi kesalahan saat menonaktifkan pengguna.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Daftar Pengguna</p>
          <p className="text-xs text-muted-foreground">
            {totalUsers > 0 ? `Menampilkan ${firstItem}-${lastItem} dari ${totalUsers} akun` : 'Belum ada akun yang cocok dengan filter.'}
          </p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari username atau nama lengkap..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[240px]">Pengguna</TableHead>
              <TableHead className="min-w-[160px]">Role</TableHead>
              <TableHead className="min-w-[130px]">Status</TableHead>
              <TableHead className="min-w-[180px]">Keamanan</TableHead>
              <TableHead className="min-w-[130px]">Dibuat</TableHead>
              <TableHead className="w-[96px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableState colSpan={6} state="loading" message="Memuat data pengguna..." />
            ) : error ? (
              <TableState colSpan={6} state="error" message={error.message} />
            ) : users.length === 0 ? (
              <TableState colSpan={6} state="empty" message="Tidak ada pengguna yang ditemukan." />
            ) : (
              users.map((user) => {
                const isCurrentUser = session?.user?.id === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {getInitials(user.nama_lengkap)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{user.nama_lengkap}</p>
                          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleClassNames[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status_akun} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getSecurityText(user)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditUser(user)}
                        title="Edit pengguna"
                      >
                        <PencilSimple className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      {user.status_akun !== StatusAkun.NONAKTIF && (
                        isCurrentUser ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            disabled
                            title="Akun sendiri tidak bisa dinonaktifkan"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Nonaktifkan</span>
                          </Button>
                        ) : (
                          <ConfirmModal
                            onConfirm={() => handleDeleteUser(user.id)}
                            title="Nonaktifkan Akun Pengguna"
                            description={`Anda yakin ingin menonaktifkan akun ${user.username}? Akun ini tidak akan bisa login.`}
                            confirmText="Nonaktifkan"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              title="Nonaktifkan pengguna"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Nonaktifkan</span>
                            </Button>
                          </ConfirmModal>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Halaman {currentPage} dari {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
