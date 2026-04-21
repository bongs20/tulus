// src/app/api/validate-nik/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nik = searchParams.get('nik');

  if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
    return NextResponse.json({ message: 'NIK tidak valid.' }, { status: 400 });
  }

  try {
    // Check if NIK already exists in tbl_penerima
    const existingPenerima = await prisma.tbl_penerima.findUnique({
      where: { nik: nik },
    });

    if (existingPenerima) {
      return NextResponse.json({ isDuplicate: true, message: 'NIK sudah terdaftar.' }, { status: 200 });
    } else {
      return NextResponse.json({ isDuplicate: false, message: 'NIK tersedia.' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking NIK:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
