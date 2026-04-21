// src/app/(dashboard)/penyaluran/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePenerima } from '@/hooks/usePenerima'; // To get DISETUJUI recipients
import { Penyaluran, JenisBantuan, MetodePenyaluran, StatusPenyaluran } from '@prisma/client';
import { toast } from 'sonner';
import PusherClient from 'pusher-js';

const programSchema = z.object({
  jenis_bantuan: z.enum([JenisBantuan.PKH, JenisBantuan.BPNT, JenisBantuan.BLT], {
    required_error: 'Jenis bantuan tidak boleh kosong.',
  }),
  nominal_bantuan: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive({ message: 'Nominal bantuan harus angka positif.' })
  ),
  metode_penyaluran: z.enum([MetodePenyaluran.BANK, MetodePenyaluran.EWALLET, MetodePenyaluran.FISIK], {
    required_error: 'Metode penyaluran tidak boleh kosong.',
  }),
  catatan: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programSchema>;

// Extend Penyaluran type to include Penerima data for display
type PenyaluranWithPenerima = Penyaluran & {
  penerima: {
    id: string;
    nik: string;
    nama_lengkap: string;
    status_verifikasi: string;
  };
};

export default function PenyaluranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [penyaluranData, setPenyaluranData] = useState<PenyaluranWithPenerima[]>([]);
  const [penyaluranTotal, setPenyaluranTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // For form submission

  // Fetch recipients who are 'DISETUJUI' for the table
  const { data: disetujuiPenerima, isLoading: isLoadingPenerima, mutate: mutatePenerima } = usePenerima({
    status: 'DISETUJUI',
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
  });

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      jenis_bantuan: JenisBantuan.PKH,
      nominal_bantuan: 0,
      metode_penyaluran: MetodePenyaluran.BANK,
      catatan: '',
    },
  });

  // Fetch initial penyaluran records
  useEffect(() => {
    const fetchPenyaluran = async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());
      if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);

      try {
        const response = await fetch(`/api/penyaluran?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setPenyaluranData(data.data);
          setPenyaluranTotal(data.total);
        } else {
          toast.error('Gagal mengambil data penyaluran.');
        }
      } catch (error) {
        console.error('Error fetching penyaluran:', error);
        toast.error('Terjadi kesalahan saat memuat data penyaluran.');
      }
    };
    fetchPenyaluran();
  }, [currentPage, debouncedSearchTerm]);

  // Pusher Client-side integration
  useEffect(() => {
    const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      // Add other options like forceTLS, authEndpoint if needed
    });

    const channel = pusherClient.subscribe('penyaluran-channel');

    channel.bind('penyaluran-update', function (data: { penyaluranId: string; status: StatusPenyaluran; catatan: string }) {
      setPenyaluranData((prevData) =>
        prevData.map((record) =>
          record.id === data.penyaluranId
            ? { ...record, status_penyaluran: data.status, catatan: data.catatan || record.catatan }
            : record
        )
      );
      toast.info(`Status penyaluran diperbarui untuk ID: ${data.penyaluranId} menjadi ${data.status}`);
    });

    return () => {
      pusherClient.unsubscribe('penyaluran-channel');
      pusherClient.disconnect();
    };
  }, []);

  const handleProsesPenyaluran = async (penerimaId: string, programData: ProgramFormValues) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/penyaluran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...programData, id_penerima: penerimaId }),
      });

      if (response.ok) {
        toast.success('Proses penyaluran dimulai.');
        // Re-fetch penyaluran data to show new record
        // setPenyaluranData(prev => [{ ...response.json(), penerima: { id: penerimaId, nama_lengkap: '...', nik: '...' } }, ...prev]);
        const newRecord = await response.json();
        const updatedPenerimaList = disetujuiPenerima.filter(p => p.id !== penerimaId);
        mutatePenerima(updatedPenerimaList, false); // Optimistic UI update for penerima list

        // Manually add the new record to penyaluranData with limited penerima info
        const newPenyaluranWithPenerima: PenyaluranWithPenerima = {
          ...newRecord,
          penerima: disetujuiPenerima.find(p => p.id === penerimaId) || { id: penerimaId, nik: '', nama_lengkap: '', status_verifikasi: '' }
        };
        setPenyaluranData((prev) => [newPenyaluranWithPenerima, ...prev]);

      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal memulai proses penyaluran.');
      }
    } catch (error) {
      console.error('Error initiating penyaluran:', error);
      toast.error('Terjadi kesalahan saat memulai penyaluran.');
    } finally {
      setIsProcessing(false);
    }
  };


  const totalPages = Math.ceil(penyaluranTotal / limit);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Program Mapping & Penyaluran</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="jenis_bantuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Bantuan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProcessing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis bantuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={JenisBantuan.PKH}>PKH</SelectItem>
                          <SelectItem value={JenisBantuan.BPNT}>BPNT</SelectItem>
                          <SelectItem value={JenisBantuan.BLT}>BLT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nominal_bantuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal Bantuan</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 300000" {...field} disabled={isProcessing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metode_penyaluran"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metode Penyaluran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProcessing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih metode penyaluran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={MetodePenyaluran.BANK}>BANK</SelectItem>
                          <SelectItem value={MetodePenyaluran.EWALLET}>E-WALLET</SelectItem>
                          <SelectItem value={MetodePenyaluran.FISIK}>FISIK</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="catatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Catatan program" {...field} disabled={isProcessing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Penerima Bantuan Disetujui</CardTitle>
          <div className="relative w-48">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari nama atau NIK..."
              className="w-full pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isProcessing}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPenerima ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Memuat data penerima...</TableCell>
                  </TableRow>
                ) : disetujuiPenerima.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Tidak ada penerima dengan status DISETUJUI.</TableCell>
                  </TableRow>
                ) : (
                  disetujuiPenerima.map((penerima) => (
                    <TableRow key={penerima.id}>
                      <TableCell>{penerima.nama_lengkap}</TableCell>
                      <TableCell>{penerima.nik}</TableCell>
                      <TableCell>
                        <StatusBadge status={penerima.status_verifikasi} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={form.handleSubmit((programData) => handleProsesPenyaluran(penerima.id, programData))}
                          disabled={isProcessing || !form.formState.isValid}
                        >
                          Proses Penyaluran
                        </Button>
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
                disabled={currentPage === 1 || isProcessing}
              >
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isProcessing}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penyaluran Bantuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jenis Bantuan</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penyaluranData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Tidak ada riwayat penyaluran.</TableCell>
                  </TableRow>
                ) : (
                  penyaluranData.map((penyaluran) => (
                    <TableRow key={penyaluran.id}>
                      <TableCell>{penyaluran.penerima.nama_lengkap}</TableCell>
                      <TableCell>{penyaluran.penerima.nik}</TableCell>
                      <TableCell>{penyaluran.jenis_bantuan}</TableCell>
                      <TableCell>{penyaluran.metode_penyaluran}</TableCell>
                      <TableCell>{penyaluran.nominal_bantuan.toString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={penyaluran.status_penyaluran} />
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
                disabled={currentPage === 1 || isProcessing}
              >
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isProcessing}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
