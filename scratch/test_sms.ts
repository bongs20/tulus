
import { sendSms } from '../src/lib/sms';

async function test() {
  console.log("Testing SMS to 085157441531...");
  const result = await sendSms('+6285157441531', 'Test SMS dari sistem TULUS. Sinkronisasi berhasil.');
  console.log("Result:", result);
}

test().catch(console.error);
