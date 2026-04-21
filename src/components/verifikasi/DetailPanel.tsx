// src/components/verifikasi/DetailPanel.tsx
'use client';

import { tbl_penerima, tbl_foto } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { format } from 'date-fns';
import { IdCard, Calendar, GenderIntersex, Phone, HouseSimple, Briefcase, Info } from '@phosphor-icons/react';
import { FormVerifikasi } from './FormVerifikasi';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface DetailPanelProps {
  penerima: tbl_penerima & { fotos: tbl_foto[] };
  onVerificationSuccess: () => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export function DetailPanel({ penerima, onVerificationSuccess, isLoading, onLoadingChange }: DetailPanelProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!penerima) {
    return (
      <Card className="h-full">
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
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Detail Penerima
          <StatusBadge status={penerima.status_verifikasi} />
        </CardTitle>
        <CardDescription>{penerima.nama_lengkap}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identity Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Informasi Identitas</h4>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><IdCard className="h-4 w-4" /> NIK: {penerima.nik}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Tanggal Lahir: {format(new Date(penerima.tanggal_lahir), 'dd MMMM yyyy')}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><GenderIntersex className="h-4 w-4" /> Jenis Kelamin: {penerima.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> Telepon: {penerima.nomor_telepon}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Alamat & Ekonomi</h4>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><HouseSimple className="h-4 w-4" /> Alamat: {penerima.alamat}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="h-4 w-4" /> Pekerjaan: {penerima.jenis_pekerjaan}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Info className="h-4 w-4" /> Status Rumah: {penerima.status_kepemilikan_rumah}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">Jumlah Anggota Keluarga: {penerima.jumlah_anggota_keluarga}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">Keterangan Ekonomi: {penerima.keterangan_ekonomi}</p>
          </div>
        </div>

        {/* Photo Thumbnails */}
        <div>
          <h4 className="font-semibold mb-2">Dokumentasi Foto</h4>
          {penerima.fotos && penerima.fotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {penerima.fotos.map((foto) => (
                <div key={foto.id} className="relative aspect-video overflow-hidden rounded-md cursor-pointer border" onClick={() => handleImageClick(foto.url_foto)}>
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
          <div>
            <h4 className="font-semibold mb-2">Formulir Verifikasi</h4>
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
