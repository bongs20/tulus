// src/app/(dashboard)/laporan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadSimple, User, Handshake, TrendUp, Coin } from '@phosphor-icons/react';
import { format, getYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { JenisBantuan } from '@prisma/client';

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
  wilayah: z.string().optional(), // Placeholder as it's not yet implemented in schema
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
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal memuat laporan.');
        setReport(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Terjadi kesalahan saat memuat laporan.');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(form.getValues());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = (values: FilterFormValues) => {
    fetchReport(values);
  };

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
      if (response.ok) {
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
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Gagal mengekspor laporan ke ${type.toUpperCase()}.`);
      }
    } catch (error) {
      console.error(`Error exporting report to ${type}:`, error);
      toast.error(`Terjadi kesalahan saat mengekspor laporan ke ${type.toUpperCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleApplyFilters)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="periode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih periode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={format(new Date(), 'yyyy-MM')}>Bulan Ini ({format(new Date(), 'MMMM yyyy', { locale: id })})</SelectItem>
                        <SelectItem value={format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM')}>Bulan Lalu ({format(new Date().setMonth(new Date().getMonth() - 1), 'MMMM yyyy', { locale: id })})</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Jenis Bantuan" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormControl>
                      <Input placeholder="Semua Wilayah (placeholder)" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>Fitur ini belum diimplementasi.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end space-x-2">
                <Button type="submit" disabled={isLoading}>
                  Terapkan Filter
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center py-8">Memuat laporan...</div>}

      {report && !isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Laporan</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Penerima"
                value={report.totalPenerima}
                description="Penerima yang berhasil disalurkan"
                icon={User}
              />
              <StatCard
                title="Total Anggaran"
                value={formatCurrency(report.totalAnggaran)}
                description="Total nominal bantuan tersalurkan"
                icon={Coin}
              />
              <StatCard
                title="Penyaluran Berhasil"
                value={report.totalTersalurkanCount}
                description="Jumlah penyaluran berhasil"
                icon={Handshake}
              />
              <StatCard
                title="% Tersalurkan"
                value={`${report.percentTersalurkan.toFixed(2)}%`}
                description="Persentase penyaluran berhasil"
                icon={TrendUp}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Per Program</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Tidak ada data breakdown program.</TableCell>
                      </TableRow>
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button onClick={() => handleExport('pdf')} disabled={isLoading}>
              <DownloadSimple className="h-4 w-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={() => handleExport('excel')} disabled={isLoading}>
              <DownloadSimple className="h-4 w-4 mr-2" /> Export Excel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
