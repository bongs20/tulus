import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWarga() {
  try {
    const wargaCount = await prisma.tbl_warga.count();
    console.log(`Total warga: ${wargaCount}`);

    const sampleWarga = await prisma.tbl_warga.findMany({
        take: 5
    });
    
    console.log('Sample warga (decrypted info if possible):');
    // Note: We can't easily decrypt here without the secret key being available to this script, 
    // but we can see the raw data structure.
    console.log(JSON.stringify(sampleWarga, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    , 2));

  } catch (error) {
    console.error('Error checking warga:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWarga();
