'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { identitasSchema, ekonomiSchema } from '@/lib/validators';
import { FormIdentitas } from '@/components/forms/FormIdentitas';
import { FormEkonomi } from '@/components/forms/FormEkonomi';
import { FormUploadFoto } from '@/components/forms/FormUploadFoto';
import { StepProgressBar } from '@/components/forms/StepProgressBar';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';
type FormData = z.infer<typeof identitasSchema> & z.infer<typeof ekonomiSchema> & { url_foto: string[] };

export default function PendaftarMandiriPage() {
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({ url_foto: [] });
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = (data: Partial<FormData>) => {
    const nextFormData = { ...formData, ...data };
    setFormData(nextFormData);
    if (currentStep === 3) {
      void handleSubmit(nextFormData);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBackStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (finalFormData: Partial<FormData>) => {
    setIsLoading(true);
    setSubmissionStatus('submitting');
    setSubmissionMessage('');

    try {
      const response = await fetch('/api/pendaftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData),
      });

      const result = await response.json();
      setSubmissionMessage(result.message || 'Terjadi kesalahan.');

      if (response.ok) {
        toast.success(result.message || 'Pendaftaran berhasil!');
        setSubmissionStatus('success');
      } else {
        toast.error(result.message || 'Pendaftaran gagal.');
        setSubmissionStatus('error');
      }
    } catch (error) {
      const message = 'Terjadi kesalahan fatal saat mengirim data pendaftaran.';
      toast.error(message);
      setSubmissionMessage(message);
      setSubmissionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ['Data Identitas', 'Data Ekonomi', 'Dokumen & Foto', 'Selesai'];

  const renderMultiStepForm = () => (
    <>
      <div className="rounded-xl border border-[#d7e3f7] bg-white p-4">
        <StepProgressBar currentStep={currentStep} totalSteps={3} labels={stepLabels.slice(0, 3)} />
      </div>
      <div className="rounded-xl border border-[#d7e3f7] bg-white p-6">
        {currentStep === 1 && (
          <FormIdentitas
            initialData={formData as z.infer<typeof identitasSchema>}
            onNext={handleNextStep}
            isLoading={isLoading}
          />
        )}
        {currentStep === 2 && (
          <FormEkonomi
            initialData={formData as z.infer<typeof ekonomiSchema>}
            onNext={handleNextStep}
            onBack={handleBackStep}
            isLoading={isLoading}
          />
        )}
        {currentStep === 3 && (
          <FormUploadFoto
            initialData={{ url_foto: formData.url_foto || [] }}
            onNext={handleNextStep}
            onBack={handleBackStep}
            isLoading={isLoading}
          />
        )}
      </div>
    </>
  );
  
  const renderSubmissionStatus = () => (
     <Card className="border-border bg-card shadow-sm text-center py-10">
        <CardHeader>
          <CardTitle className={`text-lg text-foreground ${submissionStatus === 'error' ? 'text-red-600' : 'text-primary'}`}>
            {submissionStatus === 'submitting' ? 'Mengirim Data...' 
              : submissionStatus === 'success' ? 'Pendaftaran Berhasil' 
              : 'Pendaftaran Gagal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{submissionMessage}</p>
          <Button asChild className="mt-6">
            <Link href="/publik">Kembali ke Portal Publik</Link>
          </Button>
           {submissionStatus === 'error' && (
            <Button variant="outline" className="mt-6 ml-2" onClick={() => setSubmissionStatus('idle')}>
              Coba Lagi
            </Button>
           )}
        </CardContent>
     </Card>
  );

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3">
           <div>
            <h1 className="text-3xl font-semibold text-foreground">Pendaftaran Mandiri Bantuan Sosial</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lengkapi data diri, ekonomi, dan dokumen Anda untuk menyelesaikan pendaftaran.
            </p>
          </div>
        </div>

        {submissionStatus === 'idle' ? renderMultiStepForm() : renderSubmissionStatus()}
      </div>
    </main>
  );
}
