// src/lib/telegram.ts

export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram Bot Token atau Chat ID belum dikonfigurasi di .env");
    return { success: false, message: "Telegram not configured." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔔 *NOTIFIKASI TULUS*\n\n${message}`,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (result.ok) {
      console.log("Notifikasi Telegram terkirim.");
      return { success: true };
    } else {
      console.error("Gagal kirim Telegram:", result.description);
      return { success: false, message: result.description };
    }
  } catch (error) {
    console.error("Error Telegram:", error);
    return { success: false, message: "Connection error." };
  }
}
