
import { sendTelegramNotification } from '../src/lib/telegram';

async function test() {
  console.log("Testing Telegram Notification...");
  const result = await sendTelegramNotification('Tes koneksi bot Telegram TULUS berhasil! 🚀');
  console.log("Result:", result);
}

test().catch(console.error);
