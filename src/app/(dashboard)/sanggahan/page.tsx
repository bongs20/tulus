'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSanggahan } from '@/hooks/useSanggahan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Sanggahan {
  id: string;
  nama_pengaju: string;
  nomor_telepon: string | null;
  isi_sanggahan: string;
  tanggal_sanggahan: string;
  status_sanggahan: string;
  penerima: {
    nama_lengkap: string;
    nik: string;
  };
}

export default function SanggahanPage() {
  const { data: sanggahanList, isLoading, isError, mutate } = useSanggahan();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSanggahanAction = async (sanggahanId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(sanggahanId);
    try {
      const response = await fetch(`/api/sanggahan/${sanggahanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Sanggahan berhasil diproses.');
        void mutate();
      } else {
        throw new Error(data.message || 'Gagal memproses sanggahan.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Beranda</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-primary">Sanggahan</span>
        </nav>
        <h1 className="text-3xl font-semibold text-foreground">Daftar Sanggahan &amp; Banding</h1>
        <p className="text-sm text-muted-foreground">Tinjau dan proses sanggahan atau banding dari warga terkait data penerima bantuan.</p>
      </div>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/60 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">Semua Sanggahan Masuk</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pengaju / WA</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Untuk Penerima</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Isi Sanggahan</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Memuat data sanggahan...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-destructive">Gagal memuat data sanggahan.</td>
                  </tr>
                ) : sanggahanList?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Tidak ada sanggahan masuk.</td>
                  </tr>
                ) : (
                  (sanggahanList as Sanggahan[]).map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{s.nama_pengaju}</div>
                        <div className="text-xs text-muted-foreground">{s.nomor_telepon || 'Tanpa WA'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{s.penerima.nama_lengkap}</div>
                        <div className="text-[10px] text-muted-foreground">{s.penerima.nik}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-foreground line-clamp-2">{s.isi_sanggahan}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {format(new Date(s.tanggal_sanggahan), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={s.status_sanggahan === 'PENDING' ? 'outline' : 'secondary'}>
                          {s.status_sanggahan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {s.status_sanggahan === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                              onClick={() => handleSanggahanAction(s.id, 'APPROVE')}
                              disabled={processingId === s.id}
                            >
                              {processingId === s.id ? '...' : 'Setujui'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                              onClick={() => handleSanggahanAction(s.id, 'REJECT')}
                              disabled={processingId === s.id}
                            >
                              {processingId === s.id ? '...' : 'Tolak'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-muted-foreground italic">Sudah diproses</div>
                        )}
                      </td>
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
