// src/lib/sms.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSms(to: string, message: string) {
  if (!accountSid || !authToken || !twilioPhoneNumber || !accountSid.startsWith('AC')) {
    console.warn("Twilio credentials not configured. Skipping SMS sending.");
    return { success: false, message: "Twilio not configured." };
  }
  // Format nomor Indonesia (08... -> +628...)
  let formattedTo = to.trim();
  if (formattedTo.startsWith('0')) {
    formattedTo = '+62' + formattedTo.substring(1);
  } else if (!formattedTo.startsWith('+')) {
    formattedTo = '+' + formattedTo;
  }

  try {
    const client = twilio(accountSid, authToken);
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedTo,
    });
    console.log(`SMS sent to ${formattedTo}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown SMS error.';
    const errorCode = error.code || 'No code';
    console.error(`Failed to send SMS to ${to}: [${errorCode}] ${errorMessage}`);
    return { success: false, message: `[${errorCode}] ${errorMessage}` };
  }
}
