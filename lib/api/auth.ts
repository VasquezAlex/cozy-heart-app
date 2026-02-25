import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Store: IP -> timestamps of requests
const requests = new Map<string, number[]>();
const MAX_STORED_IPS = 1000; // Prevent memory leak

// === MAIN CHECK ===
export function authenticate(req: Request) {
  if (!req?.headers) {
    throw new Error('Invalid request object - authenticate() only works in API routes');
  }
  
  const ip = getIP(req);
  
  if (isBlockedIP(ip)) throw new Error('IP not allowed');
  if (isRateLimited(ip)) throw new Error('Too many requests');
  if (isExpired(req)) throw new Error('Request too old');
  if (isWrongKey(req)) throw new Error('Wrong API key');
  if (isTampered(req)) throw new Error('Invalid signature');
  
  return { ip, requestId: crypto.randomUUID() };
}

// === CHECKS ===
function getIP(req: Request) {
  // Safety check
  if (!req.headers) return 'unknown';
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

function isBlockedIP(ip: string) {
  const allowed = process.env.ALLOWED_IPS?.split(',') || [];
  return allowed.length > 0 && !allowed.includes(ip);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter(t => now - t < 60000);
  
  if (recent.length >= 20) return true;
  
  recent.push(now);
  requests.set(ip, recent);
  
  // Cleanup old entries if too many IPs stored
  if (requests.size > MAX_STORED_IPS) {
    const firstKey = requests.keys().next().value;
    if (firstKey) {
      requests.delete(firstKey);
    }
  }
  
  return false;
}

function isExpired(req: Request) {
  const ts = req.headers.get('x-request-timestamp');
  if (!ts) return true;
  return Math.abs(Date.now() / 1000 - parseInt(ts)) > 300; // 5 min
}

function isWrongKey(req: Request) {
  const key = req.headers.get('authorization')?.replace('Bearer ', '');
  const valid = [process.env.API_KEY, process.env.API_KEY_FALLBACK].filter(Boolean);
  return !valid.includes(key || '');
}

function isTampered(req: Request) {
  const ts = req.headers.get('x-request-timestamp') || '';
  const hash = req.headers.get('x-body-hash') || '';
  const sig = req.headers.get('x-signature') || '';
  
  const expected = crypto
    .createHmac('sha256', process.env.SIGNING_SECRET || '')
    .update(`${ts}:${hash}`)
    .digest('hex');
    
  try {
    return !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return true;
  }
}

// === RESPONSE ===
export function deny(message: string, requestId?: string) {
  return NextResponse.json(
    { success: false, error: message, requestId: requestId || 'none' }, 
    { status: 401 }
  );
}