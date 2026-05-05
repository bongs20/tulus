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
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitizedObj = {} as T;

  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitizedObj[key] = sanitize(value) as T[typeof key];
    } else {
      sanitizedObj[key] = value;
    }
  }

  return sanitizedObj;
}
