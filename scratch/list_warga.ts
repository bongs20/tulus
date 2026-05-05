
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.tbl_warga.findMany();
  console.log(`Total warga: ${all.length}`);
  all.forEach(w => {
    const d = decrypt(w.nik);
    console.log(`NIK: ${d}, Nama: ${w.nama_lengkap}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
