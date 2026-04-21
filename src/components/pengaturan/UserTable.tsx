// src/components/pengaturan/UserTable.tsx
'use client';

import { useState, useMemo } from 'react';
import { tbl_pengguna, Role, StatusAkun } from '@prisma/client';
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserTableProps {
  onEditUser: (user: tbl_pengguna) => void;
  // onUserDeleted: () => void; // Callback to refresh user list
}

export function UserTable({ onEditUser }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10; // Items per page

  const { data, error, isLoading, mutate } = useSWR(
    `/api/pengguna?search=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds for updates
  );

  const users: tbl_pengguna[] = data?.data || [];
  const totalUsers: number = data?.total || 0;
  const totalPages = Math.ceil(totalUsers / limit);

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/pengguna/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Pengguna berhasil dinonaktifkan.');
        mutate(); // Revalidate SWR cache to update the list
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
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Cari username atau nama lengkap..."
          className="w-full pl-9"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status Akun</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat data pengguna...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada pengguna yang ditemukan.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.nama_lengkap}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status_akun} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEditUser(user)}
                    >
                      <PencilSimple className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {user.status_akun !== 'NONAKTIF' && (
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
                          disabled={user.status_akun === 'NONAKTIF' || user.id === 'CURRENT_USER_ID'} // Prevent deactivating self
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Nonaktifkan</span>
                        </Button>
                      </ConfirmModal>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
