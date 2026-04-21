// src/app/(dashboard)/pengaturan/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/pengaturan/UserTable';
import { UserForm } from '@/components/pengaturan/UserForm';
import { tbl_pengguna } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PengaturanPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<tbl_pengguna | undefined>(undefined);

  const handleEditUser = (user: tbl_pengguna) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUser(undefined);
    // UserTable uses SWR with refreshInterval, so it will automatically update.
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingUser(undefined);
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Manajemen Pengguna</CardTitle>
          <Button onClick={() => { setEditingUser(undefined); setIsFormOpen(true); }}>Tambah Pengguna Baru</Button>
        </CardHeader>
        <CardContent>
          <UserTable onEditUser={handleEditUser} />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
          </DialogHeader>
          <UserForm initialData={editingUser} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
