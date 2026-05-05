// src/app/(dashboard)/warga/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Warga {
  id: string;
  nik: string;
  nama_lengkap: string;
  alamat: string;
  wilayah: string;
  status_dtks: string;
  nilai_kesejahteraan: number;
  is_dalam_jangkauan: boolean;
}

export default function WargaRegistryPage() {
  const [warga, setWarga] = useState<Warga[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newWarga, setNewWarga] = useState({
    nik: '',
    nama_lengkap: '',
    alamat: '',
    wilayah: 'Panakkukang',
    status_dtks: 'BELUM_TERDAFTAR',
    nilai_kesejahteraan: '1',
  });

  useEffect(() => {
    fetchWarga();
  }, []);

  const fetchWarga = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/warga');
      if (response.ok) {
        const data = await response.json();
        setWarga(data);
      } else {
        toast.error('Gagal memuat data warga');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarga),
      });

      if (response.ok) {
        toast.success('Data warga berhasil ditambahkan!');
        setIsModalOpen(false);
        setNewWarga({
          nik: '',
          nama_lengkap: '',
          alamat: '',
          wilayah: 'Panakkukang',
          status_dtks: 'BELUM_TERDAFTAR',
          nilai_kesejahteraan: '1',
        });
        fetchWarga();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Gagal menambah data');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWarga = warga.filter(w => 
    w.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    w.nik.includes(search) ||
    w.wilayah.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Master Data Warga (Registry)</h1>
        <div className="flex gap-2">
          <Button onClick={fetchWarga} variant="outline" size="sm">
            <span className="material-symbols-outlined mr-2">refresh</span>
            Refresh
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800">
                <span className="material-symbols-outlined mr-2">add</span>
                Tambah NIK Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Data Warga Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data warga ke Master Registry agar mereka bisa melakukan pendaftaran mandiri.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddWarga} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nik">NIK</Label>
                  <Input 
                    id="nik" 
                    placeholder="16 digit NIK" 
                    value={newWarga.nik} 
                    onChange={(e) => setNewWarga({...newWarga, nik: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input 
                    id="nama" 
                    placeholder="Nama sesuai KTP" 
                    value={newWarga.nama_lengkap}
                    onChange={(e) => setNewWarga({...newWarga, nama_lengkap: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wilayah">Wilayah/Kecamatan</Label>
                    <Select value={newWarga.wilayah} onValueChange={(val) => setNewWarga({...newWarga, wilayah: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih wilayah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Panakkukang">Panakkukang</SelectItem>
                        <SelectItem value="Rappocini">Rappocini</SelectItem>
                        <SelectItem value="Biringkanaya">Biringkanaya</SelectItem>
                        <SelectItem value="Tamalanrea">Tamalanrea</SelectItem>
                        <SelectItem value="Tamalate">Tamalate</SelectItem>
                        <SelectItem value="Manggala">Manggala</SelectItem>
                        <SelectItem value="Tallo">Tallo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skor">Skor Kesejahteraan (1-10)</Label>
                    <Input 
                      id="skor" 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={newWarga.nilai_kesejahteraan}
                      onChange={(e) => setNewWarga({...newWarga, nilai_kesejahteraan: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <Input 
                    id="alamat" 
                    placeholder="Jl. Nama Jalan No. XX" 
                    value={newWarga.alamat}
                    onChange={(e) => setNewWarga({...newWarga, alamat: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Seluruh NIK Terdaftar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daftar ini berisi warga yang berhak mendaftar bantuan berdasarkan database kependudukan lokal.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
              <Input
                placeholder="Cari Nama, NIK, atau Wilayah..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">NIK</th>
                  <th className="px-4 py-3 text-left font-medium">NAMA LENGKAP</th>
                  <th className="px-4 py-3 text-left font-medium">WILAYAH/KECAMATAN</th>
                  <th className="px-4 py-3 text-left font-medium text-center">SKOR</th>
                  <th className="px-4 py-3 text-left font-medium">STATUS DTKS</th>
                  <th className="px-4 py-3 text-left font-medium">JANGKAUAN</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat data...</td>
                  </tr>
                ) : filteredWarga.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Data tidak ditemukan.</td>
                  </tr>
                ) : (
                  filteredWarga.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{w.nik}</td>
                      <td className="px-4 py-3 font-medium">{w.nama_lengkap}</td>
                      <td className="px-4 py-3">{w.wilayah}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {w.nilai_kesejahteraan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {w.status_dtks}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {w.is_dalam_jangkauan ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">DI DALAM</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">DI LUAR</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-right">
            Total Data: {filteredWarga.length} warga
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
