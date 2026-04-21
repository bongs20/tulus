// src/app/publik/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useDebounce } from '@/hooks/useDebounce';
import { SanggahanFormModal } from '@/components/shared/SanggahanFormModal';
import Link from 'next/link';

interface PublicPenerima {
  id: string;
  nama_lengkap: string;
  nik: string; // Masked
  kecamatan: string;
  programs: string;
}

export default function PublikPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PublicPenerima[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  useEffect(() => {
    const fetchPublicData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', limit.toString());
        if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);

        const response = await fetch(`/api/publik/penerima?${queryParams.toString()}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
          setTotal(result.total);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch public data:', errorData.message);
        }
      } catch (error) {
        console.error('Error fetching public data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [currentPage, debouncedSearchTerm]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-5xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Portal Transparansi Publik TULUS</CardTitle>
          <p className="text-muted-foreground mt-2">Daftar Penerima Bantuan Sosial yang Telah Disetujui</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative mb-4">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari nama atau kecamatan..."
                className="w-full pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              *NIK penerima ditampilkan secara parsial untuk menjaga privasi.
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Kecamatan</TableHead>
                  <TableHead>Program Bantuan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada data penerima yang ditemukan.</TableCell>
                  </TableRow>
                ) : (
                  data.map((penerima) => (
                    <TableRow key={penerima.id}>
                      <TableCell>{penerima.nama_lengkap}</TableCell>
                      <TableCell>{penerima.nik}</TableCell>
                      <TableCell>{penerima.kecamatan}</TableCell>
                      <TableCell>{penerima.programs}</TableCell>
                      <TableCell>
                        <SanggahanFormModal id_penerima={penerima.id}>
                          <Button variant="outline" size="sm">Ajukan Sanggahan</Button>
                        </SanggahanFormModal>
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
        </CardContent>
      </Card>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:underline">Login Admin</Link>
      </div>
    </div>
  );
}
