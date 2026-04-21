// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/dashboard/StatCard';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { MonthlyBarChart } from '@/components/dashboard/BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, CheckSquare, XCircle, Handshake, TrendUp } from '@phosphor-icons/react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return <div className="text-center py-10">Memuat data dashboard...</div>;
  }

  if (isError) {
    return <div className="text-center py-10 text-destructive">Gagal memuat data dashboard.</div>;
  }

  if (!stats) {
    return <div className="text-center py-10">Tidak ada data dashboard yang tersedia.</div>;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      {/* Stat Cards */}
      <StatCard
        title="Total Masuk"
        value={stats.total_masuk}
        description="Total penerima terdaftar"
        icon={Package}
      />
      <StatCard
        title="Lolos Awal (DTKS)"
        value={stats.lolos_awal}
        description="Penerima lolos sinkronisasi DTKS"
        icon={CheckSquare}
      />
      <StatCard
        title="Disetujui Verifikasi"
        value={stats.disetujui}
        description="Penerima disetujui verifikator"
        icon={Handshake}
      />
      <StatCard
        title="Tersalurkan"
        value={stats.tersalurkan}
        description="Penyaluran berhasil"
        icon={TrendUp}
      />

      {/* Program Breakdown & Funnel Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Alur Proses Verifikasi & Penyaluran</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart data={stats.funnel_data} />
        </CardContent>
      </Card>

      {/* Monthly Penyaluran Trend */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Tren Penyaluran Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart data={stats.monthly_trend} />
        </CardContent>
      </Card>

      {/* Recent Penyaluran */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Penyaluran Terbaru (Berhasil)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Penerima</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jenis Bantuan</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent_penyaluran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Tidak ada penyaluran terbaru.</TableCell>
                  </TableRow>
                ) : (
                  stats.recent_penyaluran.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.penerima.nama_lengkap}</TableCell>
                      <TableCell>{item.penerima.nik}</TableCell>
                      <TableCell>{item.jenis_bantuan}</TableCell>
                      <TableCell>{formatCurrency(item.nominal_bantuan)}</TableCell>
                      <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
