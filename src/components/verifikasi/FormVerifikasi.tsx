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
  status: z.enum([StatusVerifikasi.DISETUJUI, StatusVerifikasi.DITOLAK], {
    required_error: 'Pilih status verifikasi.',
  }),
  catatan: z.string().optional(),
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
                  className="flex flex-col space-y-1"
                  disabled={isLoading}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={StatusVerifikasi.DISETUJUI} />
                    </FormControl>
                    <FormLabel className="font-normal">Setuju</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={StatusVerifikasi.DITOLAK} />
                    </FormControl>
                    <FormLabel className="font-normal">Tolak</FormLabel>
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
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tambahkan catatan verifikasi..."
                  className="resize-none"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          Kirim Verifikasi
        </Button>
      </form>
    </Form>
  );
}
