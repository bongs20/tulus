// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const salt = process.env.ENCRYPTION_SALT || 'tulus_encryption_salt'; // Use a strong, unique salt in production
const key = scryptSync(process.env.ENCRYPTION_KEY || 'default_encryption_key', salt, 32);

export function encrypt(text: string): Buffer {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY is not set. Data will not be truly encrypted.");
  }
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decrypt(encryptedBuffer: Buffer): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY is not set. Decryption might fail or return unencrypted data.");
  }
  const iv = encryptedBuffer.subarray(0, ivLength);
  const tag = encryptedBuffer.subarray(ivLength, ivLength + 16);
  const encryptedText = encryptedBuffer.subarray(ivLength + 16);
  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encryptedText, 'base64', 'utf8') + decipher.final('utf8');
}
