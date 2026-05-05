'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const highlights = [

  {
    title: 'Transparansi Publik',
    description: 'Masyarakat bisa melihat data bantuan yang sudah disetujui tanpa membuka data sensitif secara penuh.',
  },
  {
    title: 'Pendaftaran Mandiri',
    description: 'Warga cukup memasukkan NIK untuk mengecek kelayakan dan mendaftarkan diri jika masih dalam jangkauan layanan.',
  },
  {
    title: 'Evaluasi Petugas',
    description: 'Petugas memvalidasi dan mengevaluasi data, sementara pendaftaran awal tetap dibuka untuk warga.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/publik" className="hover:text-primary">Portal Transparansi</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-primary">Tentang TULUS</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Tentang TULUS</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            TULUS adalah sistem layanan sosial yang dirancang untuk transparan, terukur, dan mudah diakses warga.
            Portal publik dipakai untuk melihat penerima bantuan dan mendaftar mandiri, sedangkan dashboard internal
            dipakai petugas untuk evaluasi dan penyaluran.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-6 text-muted-foreground">{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Alur Umum</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">Untuk warga</p>
              <p className="mt-2 leading-6">Masukkan NIK, cek kelayakan, lalu daftar mandiri jika masih dalam jangkauan layanan. Bila tidak ditemukan atau di luar jangkauan, hubungi admin via WhatsApp.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">Untuk petugas</p>
              <p className="mt-2 leading-6">Petugas memvalidasi data, mengevaluasi DTKS, dan memproses penyaluran. Alur daftar publik tidak dilakukan dari sisi petugas.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
