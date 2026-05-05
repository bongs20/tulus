// src/components/verifikasi/AntrianTable.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePenerima } from '@/hooks/usePenerima';
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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MagnifyingGlass, Image as ImageIcon } from '@phosphor-icons/react'; // Using Image icon for foto count
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { DecryptedPenerimaWithRelations } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableState } from '@/components/shared/TableState';
import { cn } from '@/lib/utils';
import { getPusherClient } from '@/lib/pusher-client';

interface AntrianTableProps {
  onRowClick: (penerima: DecryptedPenerimaWithRelations | null) => void;
  selectedPenerimaId: string | null;
}

export function AntrianTable({ onRowClick, selectedPenerimaId }: AntrianTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10; // Items per page

  const { data: penerimaList, total, isLoading, mutate } = usePenerima({
    status: 'MATCH', // Only show penerima with status MATCH
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const pusherClient = getPusherClient();
    if (!pusherClient) {
      return;
    }

    const channel = pusherClient.subscribe('dashboard-channel');
    const refreshQueue = () => {
      void mutate();
    };

    channel.bind('verifikasi-update', refreshQueue);

    return () => {
      channel.unbind('verifikasi-update', refreshQueue);
      pusherClient.unsubscribe('dashboard-channel');
    };
  }, [mutate]);

  // Set selected penerima in global store when data loads if not already set
  // This is handled by the parent component onRowClick
  // useEffect(() => {
  //   if (penerimaList.length > 0 && !selectedPenerimaId) {
  //     onRowClick(penerimaList[0]);
  //   }
  // }, [penerimaList, selectedPenerimaId, onRowClick]);

  return (
    <Card className="h-full border-border/70 shadow-sm">
      <CardHeader className="bg-secondary/50 border-b">
        <CardTitle className="text-base text-primary">Daftar Antrian MATCH</CardTitle>
        <div className="relative mt-2">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Cari nama atau NIK..."
            className="w-full pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
      <div className="flex flex-col h-full">
      <div className="md:hidden space-y-2 p-3">
        {isLoading ? (
          <div className="rounded-lg border border-app bg-white p-4 text-sm text-muted-foreground">Memuat data antrian...</div>
        ) : penerimaList.length === 0 ? (
          <div className="rounded-lg border border-app bg-white p-4 text-sm text-muted-foreground">Tidak ada data antrian.</div>
        ) : (
          penerimaList.map((penerima) => (
            <button
              type="button"
              key={penerima.id}
              onClick={() => onRowClick(penerima)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                selectedPenerimaId === penerima.id
                  ? "border-primary bg-blue-50/80"
                  : "border-app bg-white hover:bg-secondary/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{penerima.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground">{penerima.nik}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Daftar: {format(new Date(penerima.created_at), 'dd/MM/yyyy')}</p>
                </div>
                <StatusBadge status={penerima.status_verifikasi} />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="hidden md:block">
      <div className="flex-1 overflow-auto border-t">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary/60 z-10">
            <TableRow>
              <TableHead className="w-[180px]">Nama / NIK</TableHead>
              <TableHead className="w-[80px]">Desil</TableHead>
              <TableHead className="w-[120px]">Tgl Daftar</TableHead>
              <TableHead className="text-center w-[80px]">Foto</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableState colSpan={5} state="loading" message="Memuat data antrian..." />
            ) : penerimaList.length === 0 ? (
              <TableState colSpan={5} state="empty" message="Tidak ada data antrian." />
            ) : (
              penerimaList.map((penerima) => (
                <TableRow
                  key={penerima.id}
                  onClick={() => onRowClick(penerima)}
                  className={selectedPenerimaId === penerima.id ? 'bg-blue-50/80 border-l-4 border-l-primary cursor-pointer' : 'cursor-pointer hover:bg-secondary/40'}
                >
                  <TableCell>
                    <div className="font-medium">{penerima.nama_lengkap}</div>
                    <div className="text-sm text-muted-foreground">{penerima.nik}</div>
                  </TableCell>
                  <TableCell>{penerima.desil_data.length > 0 ? penerima.desil_data[0].nilai_desil : '-'}</TableCell>
                  <TableCell>{format(new Date(penerima.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                      <ImageIcon className="h-3.5 w-3.5 mr-1" />
                      {penerima.fotos.length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={penerima.status_verifikasi} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t bg-secondary/20">
          <div className="flex justify-between items-center">
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
        </div>
      )}
    </div>
    </CardContent>
    </Card>
  );
}
