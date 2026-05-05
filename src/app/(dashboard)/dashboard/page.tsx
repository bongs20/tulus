'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { MonthlyBarChart } from '@/components/dashboard/BarChart';
import { getPusherClient } from '@/lib/pusher-client';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, mutate } = useDashboardStats();
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const pusherClient = getPusherClient();
    if (!pusherClient) {
      return;
    }

    const channel = pusherClient.subscribe('dashboard-channel');
    const refreshDashboard = () => {
      void mutate();
    };

    channel.bind('verifikasi-update', refreshDashboard);
    channel.bind('penyaluran-update', refreshDashboard);
    channel.bind('aid-application-update', refreshDashboard);

    return () => {
      channel.unbind('verifikasi-update', refreshDashboard);
      channel.unbind('penyaluran-update', refreshDashboard);
      channel.unbind('aid-application-update', refreshDashboard);
      pusherClient.unsubscribe('dashboard-channel');
    };
  }, [mutate]);

  const handleRetrySinkronisasiTertunda = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/sinkronisasi/retry-tertunda?limit=100', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || 'Gagal memproses retry sinkronisasi tertunda.');
        return;
      }
      toast.success('Retry sinkronisasi tertunda selesai diproses.');
    } catch {
      toast.error('Terjadi kesalahan saat memproses retry sinkronisasi.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-9 w-72 rounded bg-muted" />
          <div className="h-5 w-96 max-w-full rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border bg-card shadow-sm">
              <CardHeader className="space-y-3 pb-2">
                <div className="h-4 w-32 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-9 w-20 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="py-10 text-center text-muted-foreground">Memuat data dashboard...</CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">Gagal memuat data dashboard.</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Muat Ulang
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Beranda</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-primary">Dashboard</span>
        </nav>
        <h1 className="text-3xl font-semibold text-foreground">Dasbor Ringkasan</h1>
        <p className="text-sm text-muted-foreground">Ringkasan operasional bantuan sosial, status sinkronisasi, dan progres penyaluran.</p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">Jalankan sinkronisasi ulang untuk data DTKS berstatus tertunda.</p>
          <Button onClick={handleRetrySinkronisasiTertunda} disabled={isRetrying}>
            {isRetrying ? 'Memproses...' : 'Retry Sinkronisasi Tertunda'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Calon Penerima"
          value={stats.total_masuk}
          description="Semua data yang masuk ke sistem"
        />
        <StatCard
          title="Dalam Proses Verifikasi"
          value={stats.lolos_awal}
          description="Data dengan status awal MATCH"
        />
        <StatCard
          title="Disetujui"
          value={stats.disetujui}
          description="Lolos verifikasi faktual"
        />
        <StatCard
          title="Penyaluran Berhasil"
          value={stats.tersalurkan}
          description="Bantuan yang sudah berhasil disalurkan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Alur Proses Verifikasi &amp; Penyaluran</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={stats.funnel_data} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={stats.monthly_trend} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/60 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">Penyaluran Terbaru (Berhasil)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-3 text-xs text-muted-foreground">NAMA</th>
                  <th className="px-6 py-3 text-xs text-muted-foreground">NIK</th>
                  <th className="px-6 py-3 text-xs text-muted-foreground">JENIS</th>
                  <th className="px-6 py-3 text-xs text-muted-foreground">NOMINAL</th>
                  <th className="px-6 py-3 text-xs text-muted-foreground">TANGGAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recent_penyaluran.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-sm text-muted-foreground">Tidak ada penyaluran terbaru.</td>
                  </tr>
                ) : (
                  stats.recent_penyaluran.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4 text-foreground">{item.penerima.nama_lengkap}</td>
                      <td className="px-6 py-4 text-foreground">{item.penerima.nik}</td>
                      <td className="px-6 py-4 text-foreground">{item.jenis_bantuan}</td>
                      <td className="px-6 py-4 text-foreground">{formatCurrency(item.nominal_bantuan)}</td>
                      <td className="px-6 py-4 text-foreground">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
