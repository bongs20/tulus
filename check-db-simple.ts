import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWarga() {
  try {
    const wargaCount = await prisma.tbl_warga.count();
    console.log(`Total warga: ${wargaCount}`);

    const sampleWarga = await prisma.tbl_warga.findMany({
        take: 5
    });
    
    console.log('Sample warga:');
    console.log(JSON.stringify(sampleWarga, (key, value) => {
        if (value && value.type === 'Buffer') {
            return Buffer.from(value.data).toString('hex');
        }
        return typeof value === 'bigint' ? value.toString() : value;
    }, 2));

  } catch (error) {
    console.error('Error checking warga:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWarga();
