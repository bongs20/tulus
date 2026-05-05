// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, createHash, scryptSync } from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const salt = process.env.ENCRYPTION_SALT || 'tulus_encryption_salt';
const key = scryptSync(process.env.ENCRYPTION_KEY || 'default_encryption_key', salt, 32);

// Derive a deterministic, static IV from the key. This is crucial for lookup capabilities.
const iv = createHash('sha256').update(key).digest().subarray(0, ivLength);

export function encrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY is not set. Data will not be truly encrypted.");
  }
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Prepend the static IV and tag, then convert to hex string for DB storage
  return Buffer.concat([iv, tag, encrypted]).toString('hex');
}

export function decrypt(encryptedData: string | Buffer | Uint8Array): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY is not set. Decryption might fail or return unencrypted data.");
  }
  try {
    const buffer = typeof encryptedData === 'string' 
      ? Buffer.from(encryptedData, 'hex') 
      : Buffer.from(encryptedData);
      
    // The IV is extracted but it will always be the same static IV.
    const receivedIv = buffer.subarray(0, ivLength);
    const tag = buffer.subarray(ivLength, ivLength + 16);
    const encryptedText = buffer.subarray(ivLength + 16);
    const decipher = createDecipheriv(algorithm, key, receivedIv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
  } catch (error) {
    console.error("Decryption failed.", error);
    return 'DECRYPTION_FAILED';
  }
}
