// src/components/verifikasi/AntrianTable.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { tbl_penerima } from '@prisma/client';
import { usePenerima } from '@/hooks/usePenerima';
import { useAppStore } from '@/store/useAppStore';
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
import { Pagination } from '@/components/ui/pagination'; // Assuming a generic Pagination component
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';

interface AntrianTableProps {
  onRowClick: (penerima: tbl_penerima | null) => void;
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

  // Set selected penerima in global store when data loads if not already set
  // This is handled by the parent component onRowClick
  // useEffect(() => {
  //   if (penerimaList.length > 0 && !selectedPenerimaId) {
  //     onRowClick(penerimaList[0]);
  //   }
  // }, [penerimaList, selectedPenerimaId, onRowClick]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Cari nama atau NIK..."
          className="w-full pl-9"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
        />
      </div>

      <div className="flex-1 overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
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
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell>
              </TableRow>
            ) : penerimaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada data antrian.</TableCell>
              </TableRow>
            ) : (
              penerimaList.map((penerima) => (
                <TableRow
                  key={penerima.id}
                  onClick={() => onRowClick(penerima)}
                  className={selectedPenerimaId === penerima.id ? 'bg-muted cursor-pointer' : 'cursor-pointer'}
                >
                  <TableCell>
                    <div className="font-medium">{penerima.nama_lengkap}</div>
                    <div className="text-sm text-muted-foreground">{penerima.nik}</div>
                  </TableCell>
                  <TableCell>{penerima.desil_data.length > 0 ? penerima.desil_data[0].nilai_desil : '-'}</TableCell>
                  <TableCell>{format(new Date(penerima.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-center flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    {penerima.fotos.length}
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

      {totalPages > 1 && (
        <div className="mt-4">
          {/* This Pagination component is a placeholder, assuming shadcn/ui or custom */}
          {/* For now, just simple prev/next buttons */}
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
  );
}
