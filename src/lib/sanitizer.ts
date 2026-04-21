// src/lib/sanitizer.ts
import DOMPurify from 'dompurify';

export function sanitize(dirty: string | undefined | null): string {
  if (!dirty) {
    return '';
  }
  // Isomorphic DOMPurify, to work on server and client
  const isServer = typeof window === 'undefined';
  if (isServer) {
    // For server-side, you might need a different setup or a library like jsdom
    // For simplicity here, we'll just do basic escaping as a fallback on server if no window object.
    // A more robust solution would be to use a server-side HTML sanitizer.
    return dirty.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return DOMPurify.sanitize(dirty);
}

// Function to sanitize all string properties of an object
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitizedObj: any = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitizedObj[key] = sanitize(obj[key]);
    } else {
      sanitizedObj[key] = obj[key];
    }
  }
  return sanitizedObj as T;
}
