import crypto from "crypto";

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const API_KEY = process.env.API_KEY;
const SECRET = process.env.SIGNING_SECRET || '';

// For server-to-server calls (e.g., calling your own API from a service)
export async function APICall(method: string, path: string, bodyData?: Record<string, unknown>) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(bodyData || {});
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  const signature = crypto.createHmac('sha256', SECRET).update(`${timestamp}:${hash}`).digest('hex');

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'X-Request-Timestamp': timestamp,
      'X-Body-Hash': hash,
      'X-Signature': signature
    },
    body
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return res.json();
}