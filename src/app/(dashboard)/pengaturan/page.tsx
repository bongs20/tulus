'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/pengaturan/UserTable';
import { UserForm } from '@/components/pengaturan/UserForm';
import type { UserFormData } from '@/components/pengaturan/UserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PengaturanPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | undefined>(undefined);

  const handleEditUser = (user: UserFormData) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#191b23]">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Kelola akun, role, dan status pengguna internal.</p>
        </div>
        <Button onClick={() => { setEditingUser(undefined); setIsFormOpen(true); }} className="w-full bg-[#1f63db] hover:bg-[#194fb2] sm:w-auto">Tambah Pengguna Baru</Button>
      </div>

      <div className="rounded-xl border border-[#d7e3f7] bg-white p-4">
        <UserTable onEditUser={handleEditUser} />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle></DialogHeader>
          <UserForm initialData={editingUser} onSuccess={() => { setIsFormOpen(false); setEditingUser(undefined); }} onCancel={() => { setIsFormOpen(false); setEditingUser(undefined); }} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
