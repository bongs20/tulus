// src/app/api/warga/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMINISTRATOR', 'KEPALA_BIDANG'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    const wargaRecords = await prisma.tbl_warga.findMany({
      orderBy: { nama_lengkap: 'asc' },
    });

    const processedWarga = wargaRecords.map(w => ({
      ...w,
      nik: decrypt(w.nik),
    })).filter(w => 
      w.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || 
      w.nik.includes(search) ||
      w.wilayah.toLowerCase().includes(search.toLowerCase())
    );

    return NextResponse.json(processedWarga);
  } catch (error) {
    console.error('Error fetching warga registry:', error);
    return NextResponse.json({ message: 'Gagal mengambil data warga.' }, { status: 500 });
  }
}
