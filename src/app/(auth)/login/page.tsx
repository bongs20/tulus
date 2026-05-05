'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const callbackUrl = searchParams.get('callbackUrl') || undefined;
    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
      callbackUrl,
    });
    setIsLoading(false);

    if (result?.error) {
      toast.error(`Login Gagal: ${result.error}`);
      return;
    }

    // After successful login, fetch session to get role and redirect accordingly
    const session = await getSession();
    
    if (session?.user) {
      toast.success('Login Berhasil!');
      if (session.user.role === 'PETUGAS_VERIFIKATOR') {
        window.location.href = '/antrian';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      // Fallback if session is not immediately available
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && !callbackUrl.includes('/login')) {
        window.location.href = callbackUrl;
      } else {
        window.location.href = '/dashboard';
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d7e3f7] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-blue-700">TULUS</h1>
          <p className="mt-1 text-sm text-slate-500">Sistem Manajemen Kesejahteraan Sosial</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="Masukkan username" required value={username} onChange={(e) => setUsername(e.target.value)} className="border-[#d7e3f7]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-[#d7e3f7]" />
          </div>
          <Button type="submit" className="w-full bg-[#1f63db] hover:bg-[#194fb2]" disabled={isLoading}>{isLoading ? 'Memuat...' : 'Login'}</Button>
        </form>
        <div className="mt-6 border-t border-[#d7e3f7] pt-6 text-center">
          <Link href="/publik">
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
              <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
              Kembali ke Portal Publik
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8ff]" />}>
      <LoginForm />
    </Suspense>
  );
}
