// src/app/(dashboard)/input-data/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormIdentitas } from '@/components/forms/FormIdentitas';
import { FormEkonomi } from '@/components/forms/FormEkonomi';
import { FormUploadFoto } from '@/components/forms/FormUploadFoto';
import { StepProgressBar } from '@/components/forms/StepProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import { identitasSchema, ekonomiSchema } from '@/lib/validators';
import { toast } from 'sonner';

// Combined type for all form data
type FormData = z.infer<typeof identitasSchema> &
  z.infer<typeof ekonomiSchema> & { url_foto: string[] };

export default function InputDataPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({
    url_foto: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 4;
  const stepLabels = ['Identitas', 'Ekonomi', 'Foto', 'Sinkronisasi'];

  const handleNext = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSyncDtks = async () => {
    setIsLoading(true);
    try {
      // Step 4: Sinkronisasi DTKS
      // On arrive at step 4, auto-trigger POST /api/sinkronisasi with NIK
      const { nik, nama_lengkap, tanggal_lahir } = formData;

      if (!nik || !nama_lengkap || !tanggal_lahir) {
        toast.error('Data identitas tidak lengkap untuk sinkronisasi DTKS.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/sinkronisasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik,
          nama: nama_lengkap,
          tanggal_lahir: tanggal_lahir.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.status === 'MATCH') {
          // Simulate sending SMS and pushing to antrian (this logic will be in API)
          toast.success('Sinkronisasi DTKS berhasil! Data masuk antrian verifikasi.');
          // Redirect to antrian page or show success message
          router.push('/antrian');
        } else if (result.status === 'MISMATCH') {
          toast.warning(`Sinkronisasi DTKS: ${result.message || 'Data tidak cocok.'} Fields: ${result.mismatched_fields?.join(', ')}`);
          // Show correction form or allow user to go back and edit
          // For now, let's just indicate mismatch and suggest re-editing or manual review
        }
      } else {
        toast.error(`Gagal sinkronisasi DTKS: ${result.message || 'Terjadi kesalahan.'}`);
      }
    } catch (error) {
      console.error('Error during DTKS sync:', error);
      toast.error('Terjadi kesalahan saat melakukan sinkronisasi DTKS.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger sync when currentStep is 4
  React.useEffect(() => {
    if (currentStep === 4) {
      handleSyncDtks();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Input Data Penerima Bantuan</CardTitle>
          <div className="mt-4">
            <StepProgressBar currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
          </div>
        </CardHeader>
        <CardContent className="mt-6">
          {currentStep === 1 && (
            <FormIdentitas
              initialData={formData as z.infer<typeof identitasSchema>}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <FormEkonomi
              initialData={formData as z.infer<typeof ekonomiSchema>}
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <FormUploadFoto
              initialData={{ url_foto: formData.url_foto || [] }}
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {currentStep === 4 && (
            <div className="text-center">
              <p className="text-lg font-medium">Melakukan sinkronisasi data DTKS...</p>
              {isLoading && <p className="text-muted-foreground">Mohon tunggu sebentar.</p>}
              {/* Optional: Add a spinner or more visual feedback here */}
              {!isLoading && (
                <div className="mt-4 space-y-4">
                    <p className="text-lg text-green-600 font-semibold">Sinkronisasi DTKS telah diproses.</p>
                    <p className="text-muted-foreground">Anda akan diarahkan ke halaman antrian verifikasi jika data MATCH, atau Anda akan melihat pesan jika terjadi MISMATCH.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
