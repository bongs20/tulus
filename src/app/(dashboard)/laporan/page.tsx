'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, getYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { JenisBantuan } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/dashboard/StatCard';

interface ReportData {
  periode: string;
  jenisBantuan: string;
  wilayah: string;
  totalPenerima: number;
  totalAnggaran: number;
  totalTersalurkanCount: number;
  totalDitolakCount: number;
  percentTersalurkan: number;
  programBreakdown: {
    jenis_bantuan: JenisBantuan;
    _count: { id: number };
    _sum: { nominal_bantuan: number | null };
  }[];
}

const filterSchema = z.object({
  periode: z.string().optional(),
  jenis_bantuan: z.enum([JenisBantuan.PKH, JenisBantuan.BPNT, JenisBantuan.BLT]).optional(),
  wilayah: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function LaporanPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = getYear(new Date());
  const availableYears = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      periode: format(new Date(), 'yyyy-MM'),
      jenis_bantuan: undefined,
      wilayah: undefined,
    },
  });

  const fetchReport = async (filters: FilterFormValues) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.periode) queryParams.append('periode', filters.periode);
      if (filters.jenis_bantuan) queryParams.append('jenisBantuan', filters.jenis_bantuan);
      if (filters.wilayah) queryParams.append('wilayah', filters.wilayah);

      const response = await fetch(`/api/laporan?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal memuat laporan.');
        setReport(null);
        return;
      }

      const data = await response.json();
      setReport(data);
    } catch {
      toast.error('Terjadi kesalahan saat memuat laporan.');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport(form.getValues());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (type: 'pdf' | 'excel') => {
    setIsLoading(true);
    try {
      const filters = form.getValues();
      const queryParams = new URLSearchParams();
      if (filters.periode) queryParams.append('periode', filters.periode);
      if (filters.jenis_bantuan) queryParams.append('jenisBantuan', filters.jenis_bantuan);
      if (filters.wilayah) queryParams.append('wilayah', filters.wilayah);
      queryParams.append('export', type);

      const response = await fetch(`/api/laporan?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || `Gagal mengekspor laporan ke ${type.toUpperCase()}.`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_penyaluran_${filters.periode || 'all'}.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan berhasil diekspor ke ${type.toUpperCase()}.`);
    } catch {
      toast.error(`Terjadi kesalahan saat mengekspor laporan ke ${type.toUpperCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-xl border border-[#d7e3f7] bg-white">
        <div className="border-b border-[#d7e3f7] bg-[#faf8ff] p-4">
          <h3 className="text-lg font-semibold">Filter Laporan</h3>
        </div>
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(fetchReport)} className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="periode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih periode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={format(new Date(), 'yyyy-MM')}>Bulan Ini ({format(new Date(), 'MMMM yyyy', { locale: id })})</SelectItem>
                        <SelectItem value={format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM')}>Bulan Lalu ({format(new Date().setMonth(new Date().getMonth() - 1), 'MMMM yyyy', { locale: id })})</SelectItem>
                        {availableYears.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jenis_bantuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Bantuan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Semua Jenis Bantuan" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PKH">PKH</SelectItem>
                        <SelectItem value="BPNT">BPNT</SelectItem>
                        <SelectItem value="BLT">BLT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wilayah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wilayah</FormLabel>
                    <FormControl><Input placeholder="Semua Wilayah (placeholder)" {...field} disabled={isLoading} /></FormControl>
                    <FormDescription>Fitur ini belum diimplementasi.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end gap-2">
                <Button type="submit" disabled={isLoading}>Terapkan Filter</Button>
                <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>Reset</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {isLoading && <div className="py-8 text-center">Memuat laporan...</div>}

      {report && !isLoading && (
        <>
          <div className="rounded-xl border border-[#d7e3f7] bg-white p-4">
            <h3 className="mb-4 text-lg font-semibold">Ringkasan Laporan</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Penerima" value={report.totalPenerima} description="Penerima yang berhasil disalurkan" />
              <StatCard title="Total Anggaran" value={formatCurrency(report.totalAnggaran)} description="Total nominal bantuan tersalurkan" />
              <StatCard title="Penyaluran Berhasil" value={report.totalTersalurkanCount} description="Jumlah penyaluran berhasil" />
              <StatCard title="% Tersalurkan" value={`${report.percentTersalurkan.toFixed(2)}%`} description="Persentase penyaluran berhasil" />
            </div>
          </div>

          <div className="rounded-xl border border-[#d7e3f7] bg-white">
            <div className="border-b border-[#d7e3f7] bg-[#faf8ff] p-4"><h3 className="text-lg font-semibold">Ringkasan Per Program</h3></div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Bantuan</TableHead>
                      <TableHead>Jumlah Penyaluran</TableHead>
                      <TableHead className="text-right">Total Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.programBreakdown.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center">Tidak ada data breakdown program.</TableCell></TableRow>
                    ) : (
                      report.programBreakdown.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.jenis_bantuan}</TableCell>
                          <TableCell>{item._count.id}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item._sum.nominal_bantuan || 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => handleExport('pdf')} disabled={isLoading}>Export PDF</Button>
            <Button onClick={() => handleExport('excel')} disabled={isLoading}>Export Excel</Button>
          </div>
        </>
      )}
    </div>
  );
}
