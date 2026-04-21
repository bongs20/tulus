// src/hooks/useVerifikasi.ts
import { useState } from 'react';
import { StatusVerifikasi } from '@prisma/client';
import { toast } from 'sonner';

interface VerifyRecipientPayload {
  status: StatusVerifikasi.DISETUJUI | StatusVerifikasi.DITOLAK;
  catatan?: string;
}

interface UseVerifikasiResult {
  verifyRecipient: (penerimaId: string, payload: VerifyRecipientPayload) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useVerifikasi(): UseVerifikasiResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyRecipient = async (penerimaId: string, payload: VerifyRecipientPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/verifikasi/${penerimaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Verifikasi berhasil disimpan.');
        return true;
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Gagal menyimpan verifikasi.';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err: any) {
      const errorMessage = 'Terjadi kesalahan jaringan atau server saat memverifikasi.';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { verifyRecipient, isLoading, error };
}
