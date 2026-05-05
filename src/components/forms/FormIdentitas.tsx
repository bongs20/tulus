// src/components/forms/FormIdentitas.tsx
'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { identitasSchema } from '@/lib/validators';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SanggahanFormModal } from '@/components/shared/SanggahanFormModal';

type IdentitasFormValues = z.infer<typeof identitasSchema>;

interface FormIdentitasProps {
  initialData: IdentitasFormValues;
  onNext: (data: IdentitasFormValues) => void;
  isLoading: boolean;
}

export function FormIdentitas({ initialData, onNext, isLoading }: FormIdentitasProps) {
  const form = useForm<IdentitasFormValues>({
    resolver: zodResolver(identitasSchema) as Resolver<IdentitasFormValues>,
    defaultValues: initialData,
  });

  const [nikCheckLoading, setNikCheckLoading] = useState(false);
  const [nikDuplicateError, setNikDuplicateError] = useState<string | null>(null);

  const validateNik = async (nik: string) => {
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      setNikDuplicateError(null);
      return;
    }

    setNikCheckLoading(true);
    setNikDuplicateError(null);

    try {
      const response = await fetch(`/api/validate-nik?nik=${nik}`);
      let data: { isDuplicate?: boolean; message?: string };
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        setNikDuplicateError(data.message || 'Gagal memvalidasi NIK.');
      } else if (data.isDuplicate) {
        setNikDuplicateError('NIK sudah terdaftar.');
      }
    } catch (error) {
      console.error('NIK validation error:', error);
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa NIK.';
      setNikDuplicateError(message);
    } finally {
      setNikCheckLoading(false);
    }
  };

  const onSubmit = (data: IdentitasFormValues) => {
    if (nikDuplicateError || nikCheckLoading) {
      toast.error('Mohon perbaiki kesalahan NIK sebelum melanjutkan.');
      return;
    }
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-border bg-white p-4">
        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIK (Nomor Induk Kependudukan)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: 327401xxxxxx0001"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    void validateNik(e.target.value);
                  }}
                  disabled={isLoading || nikCheckLoading}
                />
              </FormControl>
              {nikCheckLoading && <FormDescription>Memeriksa NIK...</FormDescription>}
              {nikDuplicateError && (
                <div className="flex flex-col gap-2 mt-1">
                  <FormMessage>{nikDuplicateError}</FormMessage>
                  <SanggahanFormModal nik_pengaju={field.value} nama_pengaju={form.getValues('nama_lengkap') || 'Warga'}>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs text-blue-700 underline justify-start text-left whitespace-normal">
                      NIK bermasalah atau tidak ditemukan? Klik di sini untuk mengajukan Sanggahan/Banding
                    </Button>
                  </SanggahanFormModal>
                </div>
              )}
              <FormMessage>{form.formState.errors.nik?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nama_lengkap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap sesuai KTP" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tanggal_lahir"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Lahir</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pilih tanggal lahir</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jenis_kelamin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alamat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea placeholder="Alamat lengkap" {...field} disabled={isLoading} />
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
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 081234567890" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jumlah_anggota_keluarga"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Anggota Keluarga</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Contoh: 4"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-primary hover:bg-[#194fb2]" disabled={isLoading || nikCheckLoading}>
          Lanjutkan
        </Button>
      </form>
    </Form>
  );
}
