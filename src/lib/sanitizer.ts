// src/lib/sanitizer.ts

export function sanitize(dirty: string | undefined | null): string {
  if (!dirty) {
    return '';
  }

  // Keep sanitizer server-safe by avoiding browser-only dependencies at module load.
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
