// src/lib/sms.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSms(to: string, message: string) {
  if (!client || !twilioPhoneNumber) {
    console.warn("Twilio credentials not configured. Skipping SMS sending.");
    return { success: false, message: "Twilio not configured." };
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log(`SMS sent to ${to}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error: any) {
    console.error(`Failed to send SMS to ${to}:`, error.message);
    return { success: false, message: error.message };
  }
}
