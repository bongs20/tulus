'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { SanggahanFormModal } from '@/components/shared/SanggahanFormModal';

interface PublicPenerima {
  id: string;
  nama_lengkap: string;
  nik: string;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchPublicData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(currentPage));
        queryParams.append('limit', String(limit));
        if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);

        const response = await fetch(`/api/publik/penerima?${queryParams.toString()}`);
        const result = await response.json();
        if (response.ok) {
          setData(result.data || []);
          setTotal(result.total || 0);
        } else {
          setFetchError(result.message || 'Gagal memuat data publik.');
        }
      } catch {
        setFetchError('Terjadi kesalahan saat memuat data publik.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [currentPage, debouncedSearchTerm, reloadToken]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">TULUS</span>
            <div className="mx-2 h-6 w-px bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portal Transparansi</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/about" className="hidden rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted sm:inline-flex">
              Tentang
            </Link>
            <Link href="/login">
              <Button className="px-4 py-2 text-sm font-semibold">
                <span className="material-symbols-outlined mr-1 text-[18px]">login</span>
                Masuk Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-12">
        <section className="relative overflow-hidden border-b border-border bg-card py-12">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h1 className="mb-4 text-4xl font-bold text-primary">Portal Transparansi Layanan Sosial</h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              Komitmen kami untuk memastikan penyaluran bantuan sosial yang tepat sasaran, akuntabel, dan dapat diawasi langsung oleh masyarakat secara terbuka.
            </p>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-8 max-w-7xl px-6">
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="flex flex-col items-end gap-4 p-6 md:flex-row">
            <div className="w-full flex-1">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">Cari Nama atau NIK (Ter-masking)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="Cari Nama atau NIK"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <Button className="h-12.5 w-full px-6 font-semibold md:w-auto">
              <span className="material-symbols-outlined mr-1">filter_list</span>
              Terapkan Filter
            </Button>
            </CardContent>
          </Card>
          <div className="mt-4 flex justify-end">
            <Link href="/pendaftar" className="text-sm font-medium text-primary hover:underline">
              Pendaftar mandiri: masukkan NIK di sini
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <Card className="border-border bg-card p-0 shadow-sm">
              <CardContent className="p-4">
                <p className="mb-1 text-xs uppercase tracking-tight text-muted-foreground">Total Penerima</p>
                <h3 className="text-3xl font-semibold text-primary">{total}</h3>
                <p className="mt-2 text-xs text-emerald-600">Update data publik aktif</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-primary p-0 text-primary-foreground shadow-sm">
              <CardContent className="p-4">
                <h4 className="mb-2 text-lg font-semibold">Punya Pertanyaan?</h4>
                <p className="mb-4 text-xs opacity-90">Laporkan ketidaksesuaian data di lapangan.</p>
              <div className="space-y-2">
                {data.slice(0, 1).map((item) => (
                  <SanggahanFormModal key={item.id} id_penerima={item.id}>
                    <Button className="w-full bg-white text-primary hover:bg-primary-50">Ajukan Sanggahan</Button>
                  </SanggahanFormModal>
                ))}
                {data.length === 0 && !isLoading ? <p className="text-xs text-primary-foreground/80">Cari data terlebih dahulu untuk mengajukan sanggahan.</p> : null}
              </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-border bg-card shadow-sm lg:col-span-3">
            <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-foreground">Daftar Penerima Bantuan Disetujui</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {fetchError ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">{fetchError}</p>
                <Button type="button" onClick={() => setReloadToken((current) => current + 1)}>
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-6 py-3 text-xs text-muted-foreground">NAMA PENERIMA</th>
                        <th className="px-6 py-3 text-xs text-muted-foreground">WILAYAH/KECAMATAN</th>
                        <th className="px-6 py-3 text-xs text-muted-foreground">JENIS BANTUAN</th>
                        <th className="px-6 py-3 text-xs text-muted-foreground">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoading ? (
                        <tr>
                          <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={4}>Memuat data...</td>
                        </tr>
                      ) : data.length === 0 ? (
                        <tr>
                          <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={4}>Tidak ada data penerima.</td>
                        </tr>
                      ) : (
                        data.map((item) => (
                          <tr key={item.id} className="transition-colors hover:bg-muted/40">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-foreground">{item.nama_lengkap}</div>
                              <div className="text-xs text-muted-foreground">NIK: {item.nik}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">{item.kecamatan}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{item.programs}</td>
                            <td className="px-6 py-4">
                              <SanggahanFormModal id_penerima={item.id}>
                                <button className="rounded px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-red-50" type="button">
                                  SANGGAH
                                </button>
                              </SanggahanFormModal>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-6 py-4">
                    <Button variant="outline" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
