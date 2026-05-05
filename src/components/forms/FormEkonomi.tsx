// src/components/forms/FormEkonomi.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ekonomiSchema } from '@/lib/validators';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EkonomiFormValues = z.infer<typeof ekonomiSchema>;

interface FormEkonomiProps {
  initialData: EkonomiFormValues;
  onNext: (data: EkonomiFormValues) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function FormEkonomi({ initialData, onNext, onBack, isLoading }: FormEkonomiProps) {
  const form = useForm<EkonomiFormValues>({
    resolver: zodResolver(ekonomiSchema),
    defaultValues: initialData,
  });

  const onSubmit = (data: EkonomiFormValues) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-border bg-white p-4">
        <FormField
          control={form.control}
          name="jenis_pekerjaan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Pekerjaan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis pekerjaan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Petani">Petani</SelectItem>
                  <SelectItem value="Buruh">Buruh</SelectItem>
                  <SelectItem value="Pedagang">Pedagang</SelectItem>
                  <SelectItem value="PNS">PNS</SelectItem>
                  <SelectItem value="Swasta">Swasta</SelectItem>
                  <SelectItem value="Tidak Bekerja">Tidak Bekerja</SelectItem>
                  {/* Add more options as needed */}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status_kepemilikan_rumah"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Kepemilikan Rumah</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status kepemilikan rumah" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Milik Sendiri">Milik Sendiri</SelectItem>
                  <SelectItem value="Sewa/Kontrak">Sewa/Kontrak</SelectItem>
                  <SelectItem value="Menumpang">Menumpang</SelectItem>
                  <SelectItem value="Dinas">Dinas</SelectItem>
                  {/* Add more options as needed */}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keterangan_ekonomi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan Ekonomi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deskripsikan kondisi ekonomi secara singkat"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
            Kembali
          </Button>
          <Button type="submit" className="bg-primary hover:bg-[#194fb2]" disabled={isLoading}>
            Lanjutkan
          </Button>
        </div>
      </form>
    </Form>
  );
}
