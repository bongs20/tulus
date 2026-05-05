// src/app/api/warga/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMINISTRATOR', 'KEPALA_BIDANG'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nik, nama_lengkap, alamat, wilayah, status_dtks, nilai_kesejahteraan } = body;

    if (!nik || !nama_lengkap) {
      return NextResponse.json({ message: 'NIK dan Nama Lengkap wajib diisi.' }, { status: 400 });
    }

    const encryptedNik = encrypt(nik);

    const existingWarga = await prisma.tbl_warga.findFirst({
      where: { nik: encryptedNik },
    });

    if (existingWarga) {
      return NextResponse.json({ message: 'NIK ini sudah ada di Master Data.' }, { status: 409 });
    }

    const newWarga = await prisma.tbl_warga.create({
      data: {
        nik: encryptedNik,
        nama_lengkap,
        alamat: alamat || '',
        wilayah: wilayah || 'Makassar',
        status_dtks: status_dtks || 'BELUM_TERDAFTAR',
        nilai_kesejahteraan: Number(nilai_kesejahteraan) || 1,
        is_dalam_jangkauan: true,
      },
    });

    return NextResponse.json(newWarga, { status: 201 });
  } catch (error) {
    console.error('Error creating warga registry:', error);
    return NextResponse.json({ message: 'Gagal menambahkan data warga baru.' }, { status: 500 });
  }
}
