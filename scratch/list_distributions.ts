import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listDistributions() {
  const distributions = await prisma.tbl_penyaluran.findMany({
    include: { penerima: true }
  });
  console.log('Distributions in DB:');
  distributions.forEach(d => {
    console.log(`- Penerima: ${d.penerima.nama_lengkap} | Status: ${d.status_penyaluran} | Program: ${d.jenis_bantuan}`);
  });
}

listDistributions().catch(console.error);
