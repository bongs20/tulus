// src/app/api/validate-nik/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/crypto';
import { applyRateLimiter } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const rateLimitResponse = applyRateLimiter(req as any); // Cast to any to avoid NextRequest/NextResponse type conflict
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(req.url);
  const nik = searchParams.get('nik');

  if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
    return NextResponse.json({ message: 'NIK tidak valid.' }, { status: 400 });
  }

  try {
    const existingPenerima = await prisma.tbl_penerima.findMany({
      select: { id: true, nik: true },
    });

    const isDuplicate = existingPenerima.some((penerima) => {
      try {
        return decrypt(penerima.nik) === nik;
      } catch {
        return false;
      }
    });

    if (isDuplicate) {
      return NextResponse.json({ isDuplicate: true, message: 'NIK sudah terdaftar.' }, { status: 200 });
    } else {
      return NextResponse.json({ isDuplicate: false, message: 'NIK tersedia.' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking NIK:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
