// src/lib/fonnte.ts

export async function sendWhatsappNotification(target: string, message: string) {
  const apiKey = process.env.FONNTE_API_KEY;

  if (!apiKey) {
    console.warn("Fonnte API Key belum dikonfigurasi di .env");
    return { success: false, message: "Fonnte not configured." };
  }

  // Format nomor (08... -> 628...)
  let formattedTarget = target.trim();
  if (formattedTarget.startsWith('0')) {
    formattedTarget = '62' + formattedTarget.substring(1);
  } else if (formattedTarget.startsWith('+')) {
    formattedTarget = formattedTarget.substring(1);
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: new URLSearchParams({
        'target': formattedTarget,
        'message': message,
        'countryCode': '62', // Default Indonesia
      }),
    });

    const result = await response.json();
    if (result.status) {
      console.log(`WhatsApp Fonnte terkirim ke ${formattedTarget}`);
      return { success: true };
    } else {
      console.error("Gagal kirim Fonnte:", result.reason);
      return { success: false, message: result.reason };
    }
  } catch (error) {
    console.error("Error Fonnte:", error);
    return { success: false, message: "Connection error." };
  }
}
