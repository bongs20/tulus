
import { sendWhatsappNotification } from '../src/lib/fonnte';

async function test() {
  console.log("Testing Fonnte WhatsApp Notification...");
  // Gunakan nomor HP Anda untuk mengetes
  const result = await sendWhatsappNotification('085157441531', 'Tes WhatsApp Fonnte dari sistem TULUS berhasil! ✅');
  console.log("Result:", result);
}

test().catch(console.error);
