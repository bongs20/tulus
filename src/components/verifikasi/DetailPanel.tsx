// src/components/verifikasi/DetailPanel.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { FormVerifikasi } from './FormVerifikasi';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { DecryptedPenerimaWithRelations } from '@/types';
import { toast } from 'sonner';

interface DetailPanelProps {
  penerima: DecryptedPenerimaWithRelations | null;
  onVerificationSuccess: () => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

function canRenderWithNextImage(src: string) {
  if (src.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();

    return url.protocol === 'https:' && (hostname === 'utfs.io' || hostname === 'ufs.sh' || hostname.endsWith('.ufs.sh'));
  } catch {
    return false;
  }
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-secondary/40 p-3 text-center">
      <span className="max-w-full break-all text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function DetailPanel({ penerima, onVerificationSuccess, isLoading, onLoadingChange }: DetailPanelProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!penerima) {
    return (
      <Card className="h-full border-border/70 shadow-sm">
        <CardContent className="flex h-full items-center justify-center p-6">
          <p className="text-muted-foreground">Pilih penerima dari daftar untuk melihat detail.</p>
        </CardContent>
      </Card>
    );
  }

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    setLightboxOpen(true);
  };

  const handleSanggahanAction = async (sanggahanId: string, action: 'APPROVE' | 'REJECT') => {
    onLoadingChange(true);
    try {
      const response = await fetch(`/api/sanggahan/${sanggahanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Gagal memproses sanggahan.');
      }

      const data = await response.json();
      toast.success(data.message);
      onVerificationSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <Card className="h-full overflow-y-auto border-border/70 shadow-sm">
      <CardHeader className="bg-secondary/50 border-b">
        <CardTitle className="flex justify-between items-center">
          Detail Penerima
          <StatusBadge status={penerima.status_verifikasi} />
        </CardTitle>
        <CardDescription>{penerima.nama_lengkap}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identity Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-secondary/20 p-4">
            <h4 className="font-semibold mb-2 text-primary">Informasi Identitas</h4>
            <p className="text-sm text-muted-foreground">NIK: {penerima.nik}</p>
            <p className="text-sm text-muted-foreground">Tanggal Lahir: {format(new Date(penerima.tanggal_lahir), 'dd MMMM yyyy')}</p>
            <p className="text-sm text-muted-foreground">Jenis Kelamin: {penerima.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p>
            <p className="text-sm text-muted-foreground">Telepon: {penerima.nomor_telepon}</p>
          </div>
          <div className="rounded-lg border bg-secondary/20 p-4">
            <h4 className="font-semibold mb-2 text-primary">Alamat & Ekonomi</h4>
            <p className="text-sm text-muted-foreground">Alamat: {penerima.alamat}</p>
            <p className="text-sm text-muted-foreground">Pekerjaan: {penerima.jenis_pekerjaan}</p>
            <p className="text-sm text-muted-foreground">Status Rumah: {penerima.status_kepemilikan_rumah}</p>
            <p className="text-sm text-muted-foreground">Jumlah Anggota Keluarga: {penerima.jumlah_anggota_keluarga}</p>
            <p className="text-sm text-muted-foreground">Keterangan Ekonomi: {penerima.keterangan_ekonomi}</p>
          </div>
        </div>

        {/* Photo Thumbnails */}
        <div>
          <h4 className="font-semibold mb-2 text-primary">Dokumentasi Foto</h4>
          {penerima.fotos && penerima.fotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {penerima.fotos.map((foto) => (
                <div key={foto.id} className="relative aspect-video overflow-hidden rounded-lg cursor-pointer border border-border shadow-sm hover:shadow-md transition-shadow" onClick={() => handleImageClick(foto.url_foto)}>
                  {canRenderWithNextImage(foto.url_foto) ? (
                    <Image src={foto.url_foto} alt={foto.nama_file} fill sizes="(max-width: 640px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                  ) : (
                    <PhotoPlaceholder label={foto.nama_file} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Tidak ada foto terlampir.</p>
          )}
        </div>

        {/* Sanggahan Info */}
        {penerima.sanggahan && penerima.sanggahan.length > 0 && (
          <div className="rounded-lg border bg-rose-50/50 p-4 border-rose-200">
            <h4 className="font-semibold mb-3 text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Riwayat Sanggahan
            </h4>
            <div className="space-y-3">
              {penerima.sanggahan.map((s, idx) => (
                <div key={s.id} className="border-l-2 border-rose-400 pl-3">
                  <p className="text-xs font-semibold text-rose-900">{s.nama_pengaju} <span className="font-normal text-rose-700 ml-2">{format(new Date(s.tanggal_sanggahan), 'dd MMM yyyy HH:mm')}</span></p>
                  <p className="text-sm text-rose-800 mt-1 bg-white/60 p-2 rounded">{s.isi_sanggahan}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-rose-700 font-medium">Status: {s.status_sanggahan}</p>
                    {s.status_sanggahan === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSanggahanAction(s.id, 'APPROVE')}
                          disabled={isLoading}
                          className="px-2 py-1 text-[10px] bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-bold uppercase"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleSanggahanAction(s.id, 'REJECT')}
                          disabled={isLoading}
                          className="px-2 py-1 text-[10px] bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors font-bold uppercase"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Form */}
        {(penerima.status_verifikasi === 'MATCH' || penerima.status_verifikasi === 'MENUNGGU') && (
          <div className="rounded-lg border bg-secondary/20 p-4">
            <h4 className="font-semibold mb-3 text-primary">Formulir Verifikasi</h4>
            <FormVerifikasi penerimaId={penerima.id} onSuccess={onVerificationSuccess} isLoading={isLoading} onLoadingChange={onLoadingChange} />
          </div>
        )}

        {/* Lightbox for images */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0">
            {selectedImage && (
              <div className="relative w-full h-[80vh]">
                {canRenderWithNextImage(selectedImage) ? (
                  <Image src={selectedImage} alt="Full view" fill sizes="100vw" style={{ objectFit: 'contain' }} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/30 p-6 text-center">
                    <p className="text-sm font-medium text-foreground">Pratinjau foto tidak tersedia</p>
                    <p className="break-all text-xs text-muted-foreground">{selectedImage}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
