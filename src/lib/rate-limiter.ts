// src/lib/rate-limiter.ts
import { NextResponse } from 'next/server';

type RateLimitStore = {
  [ip: string]: {
    count: number;
    lastRequest: number;
  };
};

const rateLimitStore: RateLimitStore = {};
const rateLimit = 100; // 100 requests
const rateLimitWindow = 60 * 1000; // 1 minute in ms

export function applyRateLimiter(req: NextResponse) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

  const now = Date.now();
  const userRequests = rateLimitStore[ip] || { count: 0, lastRequest: now };

  if (now - userRequests.lastRequest > rateLimitWindow) {
    // Reset if window has passed
    userRequests.count = 1;
    userRequests.lastRequest = now;
  } else {
    userRequests.count++;
  }

  rateLimitStore[ip] = userRequests;

  if (userRequests.count > rateLimit) {
    return NextResponse.json({ message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }, { status: 429 });
  }

  return null; // No rate limiting applied
}
