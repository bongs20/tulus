// src/components/pengaturan/UserForm.tsx
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tbl_pengguna, Role, StatusAkun } from '@prisma/client';
import { toast } from 'sonner';

const userFormSchema = z.object({
  username: z.string().min(3, { message: 'Username minimal 3 karakter.' }).max(20, { message: 'Username maksimal 20 karakter.' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }).optional().or(z.literal('')),
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap tidak boleh kosong.' }),
  role: z.enum([Role.ADMINISTRATOR, Role.KEPALA_BIDANG, Role.PETUGAS_VERIFIKATOR]),
  status_akun: z.enum([StatusAkun.AKTIF, StatusAkun.NONAKTIF, StatusAkun.TERKUNCI]).optional(), // Only for edit
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: tbl_pengguna; // Optional, for edit mode
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: initialData?.username || '',
      nama_lengkap: initialData?.nama_lengkap || '',
      role: initialData?.role || Role.PETUGAS_VERIFIKATOR,
      status_akun: initialData?.status_akun || StatusAkun.AKTIF,
      password: '', // Password field is always empty initially
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: UserFormValues) => {
    try {
      const url = initialData ? `/api/pengguna/${initialData.id}` : '/api/pengguna';
      const method = initialData ? 'PUT' : 'POST';

      // Remove password from payload if empty for update
      const payload = { ...values };
      if (payload.password === '') {
        delete payload.password;
      }
      if (!initialData) { // If creating, password is required by schema
          delete payload.status_akun; // Status akun is not set on create
      }


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(initialData ? 'Pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal menyimpan pengguna.');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Terjadi kesalahan saat menyimpan pengguna.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username unik" {...field} disabled={isLoading || (initialData ? true : false)} />
              </FormControl>
              <FormMessage />
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
                <Input placeholder="Nama lengkap pengguna" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Role.ADMINISTRATOR}>Administrator</SelectItem>
                  <SelectItem value={Role.KEPALA_BIDANG}>Kepala Bidang</SelectItem>
                  <SelectItem value={Role.PETUGAS_VERIFIKATOR}>Petugas Verifikator</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {initialData && ( // Only show status_akun on edit mode
            <FormField
            control={form.control}
            name="status_akun"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status Akun</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Status Akun" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value={StatusAkun.AKTIF}>AKTIF</SelectItem>
                    <SelectItem value={StatusAkun.NONAKTIF}>NONAKTIF</SelectItem>
                    <SelectItem value={StatusAkun.TERKUNCI}>TERKUNCI</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password {initialData ? '(Kosongkan jika tidak ingin mengubah)' : ''}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={initialData ? '••••••••' : 'Password minimal 8 karakter'} {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {initialData ? 'Simpan Perubahan' : 'Buat Pengguna'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
