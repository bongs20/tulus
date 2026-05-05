import { PrismaClient, StatusPenyaluran } from '@prisma/client';

const prisma = new PrismaClient();

async function testFilter() {
  const allPenerima = await prisma.tbl_penerima.findMany({
    where: { status_verifikasi: 'DISETUJUI' },
    include: { penyaluran: true }
  });
  console.log('Total DISETUJUI:', allPenerima.length);

  const filtered = await prisma.tbl_penerima.findMany({
    where: {
      status_verifikasi: 'DISETUJUI',
      penyaluran: {
        none: {
          status_penyaluran: {
            in: [StatusPenyaluran.BERHASIL, StatusPenyaluran.DIPROSES]
          }
        }
      }
    }
  });
  console.log('Filtered (excludeDisalurkan):', filtered.length);
  
  filtered.forEach(p => {
    console.log(`- ${p.nama_lengkap} (ID: ${p.id})`);
  });
}

testFilter().catch(console.error);
