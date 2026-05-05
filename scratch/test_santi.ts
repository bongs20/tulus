import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSanti() {
  const santi = await prisma.tbl_penerima.findFirst({
    where: { nama_lengkap: { contains: 'Santi' } },
    include: { penyaluran: true }
  });
  
  if (!santi) {
    console.log('Santi not found');
    return;
  }
  
  console.log(`Santi Wijaya (ID: ${santi.id}) distributions:`);
  santi.penyaluran.forEach(d => {
    console.log(`- Status: ${d.status_penyaluran}`);
  });

  const foundInFiltered = await prisma.tbl_penerima.findFirst({
    where: {
      id: santi.id,
      penyaluran: {
        none: {
          OR: [
            { status_penyaluran: 'BERHASIL' },
            { status_penyaluran: 'DIPROSES' }
          ]
        }
      }
    }
  });

  console.log(`Is Santi in the filtered list? ${foundInFiltered ? 'YES (Bug!)' : 'NO (Correct)'}`);
}

testSanti().catch(console.error);
