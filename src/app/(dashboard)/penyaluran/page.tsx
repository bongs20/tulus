'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { usePenerima } from '@/hooks/usePenerima';
import { tbl_penyaluran, JenisBantuan, MetodePenyaluran, StatusPenyaluran } from '@prisma/client';
import { toast } from 'sonner';
import { getPusherClient } from '@/lib/pusher-client';

const programSchema = z.object({
  jenis_bantuan: z.nativeEnum(JenisBantuan),
  nominal_bantuan: z.coerce.number().positive({ message: 'Nominal bantuan harus angka positif.' }),
  metode_penyaluran: z.nativeEnum(MetodePenyaluran),
  catatan: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programSchema>;
type PenyaluranWithPenerima = tbl_penyaluran & { penerima: { id: string; nik: string; nama_lengkap: string; status_verifikasi: string } };

export default function PenyaluranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [penyaluranData, setPenyaluranData] = useState<PenyaluranWithPenerima[]>([]);
  const [penyaluranTotal, setPenyaluranTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: disetujuiPenerima, isLoading: isLoadingPenerima, mutate: mutatePenerima } = usePenerima({
    status: 'DISETUJUI', search: debouncedSearchTerm, page: currentPage, limit,
  });

  const form = useForm<z.input<typeof programSchema>, unknown, ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: { jenis_bantuan: JenisBantuan.PKH, nominal_bantuan: 0, metode_penyaluran: MetodePenyaluran.BANK, catatan: '' },
  });

  useEffect(() => {
    const fetchPenyaluran = async () => {
      const queryParams = new URLSearchParams({ page: String(currentPage), limit: String(limit) });
      if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);
      const response = await fetch(`/api/penyaluran?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPenyaluranData(data.data);
        setPenyaluranTotal(data.total);
      }
    };
    void fetchPenyaluran();
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    const pusherClient = getPusherClient();
    if (!pusherClient) {
      return;
    }

    const channel = pusherClient.subscribe('penyaluran-channel');
    channel.bind('penyaluran-update', (data: { penyaluranId: string; status: StatusPenyaluran; catatan: string }) => {
      setPenyaluranData((prev) => prev.map((record) => (record.id === data.penyaluranId ? { ...record, status_penyaluran: data.status, catatan: data.catatan || record.catatan } : record)));
    });
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe('penyaluran-channel');
    };
  }, []);

  const handleProsesPenyaluran = async (penerimaId: string, programData: ProgramFormValues) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/penyaluran', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...programData, id_penerima: penerimaId }) });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal memulai proses penyaluran.');
        return;
      }
      toast.success('Proses penyaluran dimulai.');
      const newRecord = await response.json();
      const updatedPenerimaList = disetujuiPenerima.filter((p) => p.id !== penerimaId);
      mutatePenerima(updatedPenerimaList, false);
      const newPenyaluranWithPenerima: PenyaluranWithPenerima = { ...newRecord, penerima: disetujuiPenerima.find((p) => p.id === penerimaId) || { id: penerimaId, nik: '', nama_lengkap: '', status_verifikasi: '' } };
      setPenyaluranData((prev) => [newPenyaluranWithPenerima, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(penyaluranTotal / limit);
  const totalRiwayat = penyaluranData.length;
  const totalMenunggu = penyaluranData.filter((item) => item.status_penyaluran === 'MENUNGGU').length;
  const totalBerhasil = penyaluranData.filter((item) => item.status_penyaluran === 'BERHASIL').length;
  const totalGagal = penyaluranData.filter((item) => item.status_penyaluran === 'GAGAL').length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-xs text-slate-500"><span>Layanan</span><span className="material-symbols-outlined text-[14px]">chevron_right</span><span className="font-medium text-blue-600">Manajemen Penyaluran</span></nav>
          <h2 className="text-3xl font-semibold text-[#191b23]">Manajemen Penyaluran Bantuan</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Penyaluran', value: totalRiwayat, icon: 'inventory_2', bg: 'bg-blue-50 text-blue-600' },
          { label: 'Menunggu', value: totalMenunggu, icon: 'pending_actions', bg: 'bg-amber-50 text-amber-600' },
          { label: 'Berhasil', value: totalBerhasil, icon: 'check_circle', bg: 'bg-emerald-50 text-emerald-600' },
          { label: 'Gagal', value: totalGagal, icon: 'error', bg: 'bg-rose-50 text-rose-600' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-xl border border-[#d7e3f7] bg-white p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bg}`}><span className="material-symbols-outlined">{item.icon}</span></div>
            <div><p className="text-xs text-slate-500">{item.label}</p><p className="text-2xl font-semibold">{item.value}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#d7e3f7] bg-white p-4">
        <Form {...form}>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <FormField control={form.control} name="jenis_bantuan" render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value={JenisBantuan.PKH}>PKH</SelectItem><SelectItem value={JenisBantuan.BPNT}>BPNT</SelectItem><SelectItem value={JenisBantuan.BLT}>BLT</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="nominal_bantuan" render={({ field }) => (<FormItem><FormLabel>Nominal</FormLabel><FormControl><Input type="number" {...field} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="metode_penyaluran" render={({ field }) => (<FormItem><FormLabel>Metode</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value={MetodePenyaluran.BANK}>BANK</SelectItem><SelectItem value={MetodePenyaluran.EWALLET}>E-WALLET</SelectItem><SelectItem value={MetodePenyaluran.FISIK}>FISIK</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="catatan" render={({ field }) => (<FormItem><FormLabel>Catatan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </form>
        </Form>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d7e3f7] bg-white">
        <div className="flex items-center justify-between border-b border-[#d7e3f7] bg-slate-50 p-4">
          <div className="flex items-center gap-1 rounded-lg bg-white p-1 text-sm">
            <button className="rounded-md bg-blue-50 px-4 py-1.5 font-medium text-blue-700">Semua</button>
            <button className="rounded-md px-4 py-1.5 text-slate-500">Menunggu</button>
            <button className="rounded-md px-4 py-1.5 text-slate-500">Diproses</button>
            <button className="rounded-md px-4 py-1.5 text-slate-500">Berhasil</button>
            <button className="rounded-md px-4 py-1.5 text-slate-500">Gagal</button>
          </div>
          <Input className="max-w-xs" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Cari nama/NIK..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[#d7e3f7] bg-[#faf8ff]"><th className="px-6 py-3 text-xs text-slate-600">NAMA</th><th className="px-6 py-3 text-xs text-slate-600">NIK</th><th className="px-6 py-3 text-xs text-slate-600">STATUS</th><th className="px-6 py-3 text-xs text-slate-600 text-right">AKSI</th></tr></thead>
            <tbody className="divide-y divide-[#d7e3f7]">
              {isLoadingPenerima ? (
                <tr><td colSpan={4} className="px-6 py-6 text-sm text-slate-500">Memuat data penerima...</td></tr>
              ) : disetujuiPenerima.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-6 text-sm text-slate-500">Tidak ada penerima dengan status DISETUJUI.</td></tr>
              ) : (
                disetujuiPenerima.map((penerima) => (
                  <tr key={penerima.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold">{penerima.nama_lengkap}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{penerima.nik}</td>
                    <td className="px-6 py-4"><StatusBadge status={penerima.status_verifikasi} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" disabled={isProcessing || !form.formState.isValid} onClick={form.handleSubmit((programData) => handleProsesPenyaluran(penerima.id, programData))}>Proses</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#d7e3f7] bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Menampilkan {Math.min(limit, disetujuiPenerima.length)} data</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>Prev</Button>
              <span className="text-sm">{currentPage}/{totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
