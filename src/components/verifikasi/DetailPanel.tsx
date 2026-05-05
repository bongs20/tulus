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

interface DetailPanelProps {
  penerima: DecryptedPenerimaWithRelations | null;
  onVerificationSuccess: () => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
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
                  <Image src={foto.url_foto} alt={foto.nama_file} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Tidak ada foto terlampir.</p>
          )}
        </div>

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
                <Image src={selectedImage} alt="Full view" fill style={{ objectFit: 'contain' }} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
