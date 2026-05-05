// src/components/shared/SanggahanFormModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const sanggahanSchema = z.object({
  nama_pengaju: z.string().min(1, { message: 'Nama tidak boleh kosong.' }),
  nomor_telepon: z.string().optional(),
  isi_sanggahan: z.string().min(10, { message: 'Sanggahan terlalu pendek.' }),
});

type SanggahanFormValues = z.infer<typeof sanggahanSchema>;

interface SanggahanFormModalProps {
  id_penerima: string;
  children: React.ReactNode;
}

export function SanggahanFormModal({ id_penerima, children }: SanggahanFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SanggahanFormValues>({
    resolver: zodResolver(sanggahanSchema),
    defaultValues: {
      nama_pengaju: '',
      nomor_telepon: '',
      isi_sanggahan: '',
    },
  });

  const onSubmit = async (values: SanggahanFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sanggahan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, id_penerima }),
      });

      if (response.ok) {
        toast.success('Sanggahan berhasil diajukan! Kami akan segera meninjaunya.');
        form.reset();
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal mengajukan sanggahan.');
      }
    } catch (error) {
      console.error('Error submitting sanggahan:', error);
      toast.error('Terjadi kesalahan saat mengajukan sanggahan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Ajukan Sanggahan / Banding</DialogTitle>
          <DialogDescription className="text-slate-600">
            Gunakan formulir ini untuk melaporkan ketidaksesuaian data (Sanggahan) atau mengajukan keberatan atas status Anda sendiri (Banding).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nama_pengaju"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nama Anda</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap pengaju" {...field} disabled={isLoading} className="text-slate-900 placeholder:text-slate-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomor_telepon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nomor WhatsApp (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 08123456789" {...field} disabled={isLoading} className="text-slate-900 placeholder:text-slate-400" />
                  </FormControl>
                  <FormDescription className="text-[10px] text-slate-500">
                    Kami akan mengirimkan notifikasi status sanggahan via WA jika nomor diisi.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isi_sanggahan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Isi Sanggahan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan sanggahan Anda secara detail..."
                      className="resize-none text-slate-900 placeholder:text-slate-400"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Mengajukan...' : 'Ajukan Sanggahan'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
