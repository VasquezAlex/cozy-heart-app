import crypto from 'crypto';

function getBaseUrl() {
  const value = process.env.API_URL || 'http://localhost:3000';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildHeaders(body) {
  const signingSecret = process.env.SIGNING_SECRET;
  const apiKey = process.env.API_KEY;

  if (!signingSecret || !apiKey) {
    throw new Error('Missing API_KEY or SIGNING_SECRET for signed API call');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(`${timestamp}:${hash}`)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Request-Timestamp': timestamp,
    'X-Body-Hash': hash,
    'X-Signature': signature,
  };
}

export async function APICall(path, payload) {
  const body = JSON.stringify(payload || {});
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    headers: buildHeaders(body),
    body,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = { error: 'Invalid JSON response from API' };
  }

  if (!res.ok) {
    const message = data?.error || `API request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}
