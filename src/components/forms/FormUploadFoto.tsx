// src/components/forms/FormUploadFoto.tsx
'use client';

import React, { useState } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { XCircle } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface FormUploadFotoProps {
  initialData: { url_foto: string[] };
  onNext: (data: { url_foto: string[] }) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function FormUploadFoto({ initialData, onNext, onBack, isLoading }: FormUploadFotoProps) {
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(initialData.url_foto || []);
  const maxFiles = 5;

  const handleUploadComplete = (res: Array<{ url: string; serverData?: { fileUrl?: string; uploadedBy?: string } }>) => {
    console.log('handleUploadComplete', res);
    if (res && res.length > 0) {
      const newUrls = res
        .map((r) => r.url || r.serverData?.fileUrl)
        .filter((url): url is string => Boolean(url));
      if (newUrls.length === 0) {
        console.warn('No fileUrl or url returned from server in upload response', res);
        toast.warning('Unggahan selesai tapi URL file tidak ditemukan. Periksa console.');
      }
      setUploadedImageUrls((prevUrls) => {
        const combined = [...prevUrls, ...newUrls];
        // Ensure maxFiles limit
        if (combined.length > maxFiles) {
          toast.warning(`Hanya ${maxFiles} foto yang diizinkan.`);
          return combined.slice(0, maxFiles);
        }
        return combined;
      });
      toast.success('Foto berhasil diunggah!');
    } else {
      toast.error('Gagal mengunggah foto.');
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('handleUploadError', error);
    toast.error(`Terjadi kesalahan saat mengunggah: ${error.message}`);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setUploadedImageUrls((prevUrls) => prevUrls.filter((url) => url !== urlToRemove));
    toast.info('Foto dihapus.');
  };

  const onSubmit = () => {
    if (uploadedImageUrls.length === 0) {
      toast.error('Minimal 1 foto harus diunggah untuk melanjutkan.');
      return;
    }
    onNext({ url_foto: uploadedImageUrls });
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-white p-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">Upload Foto</h3>
        <p className="text-sm text-muted-foreground">
          Unggah minimal 1, maksimal 5 foto. (JPG/PNG, max 4MB per foto)
        </p>
      </div>

      <UploadDropzone
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        disabled={isLoading || uploadedImageUrls.length >= maxFiles}
        config={{
          mode: "auto",
        }}
      />

      {uploadedImageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {uploadedImageUrls.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border shadow-sm">
              <Image src={url} alt={`Uploaded ${index + 1}`} fill style={{ objectFit: 'cover' }} />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => handleRemoveImage(url)}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Kembali
        </Button>
        <Button type="button" className="bg-primary hover:bg-[#194fb2]" onClick={onSubmit} disabled={isLoading || uploadedImageUrls.length === 0}>
          Lanjutkan
        </Button>
      </div>
    </div>
  );
}
