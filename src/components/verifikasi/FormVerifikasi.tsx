// src/components/verifikasi/FormVerifikasi.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { StatusVerifikasi } from '@prisma/client';
import { toast } from 'sonner';

const formSchema = z.object({
  status: z.enum([StatusVerifikasi.DISETUJUI, StatusVerifikasi.DITOLAK]),
  catatan: z.string().min(1, 'Catatan wajib diisi.'),
});

type FormVerifikasiValues = z.infer<typeof formSchema>;

interface FormVerifikasiProps {
  penerimaId: string;
  onSuccess: () => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export function FormVerifikasi({ penerimaId, onSuccess, isLoading, onLoadingChange }: FormVerifikasiProps) {
  const form = useForm<FormVerifikasiValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormVerifikasiValues) => {
    onLoadingChange(true);
    try {
      const response = await fetch(`/api/verifikasi/${penerimaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Status verifikasi berhasil diperbarui.');
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal memperbarui status verifikasi.');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Terjadi kesalahan saat mengirim verifikasi.');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status Verifikasi</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  disabled={isLoading}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <FormControl>
                      <RadioGroupItem value={StatusVerifikasi.DISETUJUI} />
                    </FormControl>
                    <FormLabel className="font-medium text-emerald-800">Setuju</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-red-200 bg-red-50 p-3">
                    <FormControl>
                      <RadioGroupItem value={StatusVerifikasi.DITOLAK} />
                    </FormControl>
                    <FormLabel className="font-medium text-red-800">Tolak</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan Alasan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan alasan verifikasi (wajib)..."
                  className="resize-none"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-[#194fb2]" disabled={isLoading}>
          Kirim Verifikasi
        </Button>
      </form>
    </Form>
  );
}
